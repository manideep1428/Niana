import { CreateArtifactArgs, TOOL_NAMES } from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { systemPrompt } from "@/lib/prompt";
import { Type } from "@google/genai";
import { gemini } from "@/lib/gemini";

const geminiTools = [
  {
    functionDeclarations: [
      {
        name: TOOL_NAMES.CREATE_ARTIFACT,
        description: "Create a new UI artifact/screen with HTML content",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description:
                "Unique identifier for the artifact (e.g., 'home-screen', 'login-page')",
            },
            title: {
              type: Type.STRING,
              description: "Display title for the artifact",
            },
            content: {
              type: Type.STRING,
              description:
                "Complete HTML content for the artifact including inline CSS and JavaScript",
            },
          },
          required: ["id", "title", "content"],
        },
      },
    ],
  },
];

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface Attachment {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
}

// Gemini content parts
type GeminiTextPart = { text: string };
type GeminiInlineDataPart = { inlineData: { mimeType: string; data: string } };
type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

// Stream event types - matching ai-chatbot style
type StreamEvent =
  | { type: "text-delta"; content: string }
  | { type: "artifact-start"; id: string; title: string }
  | { type: "artifact-delta"; id: string; content: string }
  | { type: "artifact-finish"; id: string; title: string; content: string }
  | { type: "finish"; reason: string }
  | { type: "error"; message: string };

function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function buildGeminiContent(
  text: string,
  attachments?: Attachment[],
): Promise<GeminiPart[]> {
  const parts: GeminiPart[] = [];

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (
        attachment.contentType.startsWith("image/") ||
        attachment.contentType === "application/pdf"
      ) {
        try {
          const response = await fetch(attachment.url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const base64String = Buffer.from(arrayBuffer).toString("base64");

            parts.push({
              inlineData: {
                mimeType: attachment.contentType,
                data: base64String,
              },
            });
          } else {
            console.error(`Failed to fetch attachment: ${attachment.url}`);
            // Fallback to text description if fetch fails
            parts.push({
              text: `[Attached file: ${attachment.name}] (Download: ${attachment.url})`,
            });
          }
        } catch (error) {
          console.error(
            `Error processing attachment ${attachment.name}:`,
            error,
          );
          parts.push({
            text: `[Attached file: ${attachment.name}] (Download: ${attachment.url})`,
          });
        }
      } else {
        parts.push({
          text: `[Attached file: ${attachment.name} (${attachment.contentType})]`,
        });
      }
    }
  }

  if (text) {
    parts.push({ text });
  }

  return parts;
}

export async function POST(request: NextRequest) {
  const { messages, projectId, selectedChatModel } = await request.json();
  const { user } = await withAuth();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await convex.query(api.quires.getUserSubscription, {
      user_id: user.id,
    });
    const totalTokens = subscription?.tokens_total ?? 20000;
    const usedTokens = subscription?.tokens_used ?? 0;

    if (usedTokens >= totalTokens) {
      return Response.json(
        {
          error:
            "You have run out of credits. Please upgrade your plan to continue.",
        },
        { status: 403 },
      );
    }
  } catch (e) {
    console.error("Credit check failed:", e);
  }

  const encoder = new TextEncoder();
  let totalUsageTokens = 0;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const basePrompt = systemPrompt({ selectedChatModel });

        const planningPrompt = `${basePrompt}

PLANNING MODE:
Analyze the user's request and output a JSON object with the screens to create.
You MUST respond with valid JSON in this exact format:
{
  "screens": [
    { "id": "screen-id", "title": "Screen Title", "description": "Brief description of the screen" }
  ]
}

Follow the INTELLIGENT SCREEN DECISION rules from your system prompt to determine the right number of screens.`;

        // Build Gemini contents for planning
        const planContents = await Promise.all(
          messages.map(
            async (m: {
              role: string;
              content: string;
              attachments?: Attachment[];
            }) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: await buildGeminiContent(m.content, m.attachments),
            }),
          ),
        );

        // Planning step - get screen plan from Gemini
        const planResponse = await gemini.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: planContents,
          config: {
            systemInstruction: planningPrompt,
            responseMimeType: "application/json",
          },
        });

        const planContent = planResponse.text || "{}";
        if (planResponse.usageMetadata) {
          totalUsageTokens +=
            planResponse.usageMetadata.candidatesTokenCount || 0;
        }

        let plan: {
          screens: Array<{ id: string; title: string; description: string }>;
        };
        try {
          plan = JSON.parse(planContent);
        } catch {
          plan = {
            screens: [
              {
                id: "home-screen",
                title: "Home",
                description: "Main home screen",
              },
            ],
          };
        }

        // Send text about what we're creating
        const screenList = plan.screens
          .map((s, i) => `${i + 1}. **${s.title}**`)
          .join("\n");
        controller.enqueue(
          encoder.encode(
            encodeEvent({
              type: "text-delta",
              content: `✨ **Creating ${plan.screens.length} screen${plan.screens.length > 1 ? "s" : ""}**\n\n${screenList}\n\n---\n\n`,
            }),
          ),
        );

        // Generate each screen
        for (let i = 0; i < plan.screens.length; i++) {
          const screen = plan.screens[i];

          try {
            // Send artifact start
            controller.enqueue(
              encoder.encode(
                encodeEvent({
                  type: "artifact-start",
                  id: screen.id,
                  title: screen.title,
                }),
              ),
            );

            // Build screen generation contents
            const screenContents = [
              ...(await Promise.all(
                messages.map(
                  async (m: {
                    role: string;
                    content: string;
                    attachments?: Attachment[];
                  }) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: await buildGeminiContent(m.content, m.attachments),
                  }),
                ),
              )),
              {
                role: "user" as const,
                parts: [
                  {
                    text: `Generate ONLY the "${screen.title}" screen (ID: ${screen.id}). Description: ${screen.description}. This is screen ${i + 1} of ${plan.screens.length}. Use the ${TOOL_NAMES.CREATE_ARTIFACT} tool with id="${screen.id}" and title="${screen.title}".`,
                  },
                ],
              },
            ];

            // Generate screen using Gemini with function calling
            const screenResponse = await gemini.models.generateContent({
              model: "gemini-3-pro-preview",
              contents: screenContents,
              config: {
                systemInstruction: basePrompt,
                tools: geminiTools,
              },
            });

            if (screenResponse.usageMetadata) {
              totalUsageTokens +=
                screenResponse.usageMetadata.candidatesTokenCount || 0;
            }

            // Extract function call result
            let args: CreateArtifactArgs | null = null;

            if (screenResponse.candidates?.[0]?.content?.parts) {
              for (const part of screenResponse.candidates[0].content.parts) {
                if (
                  part.functionCall &&
                  part.functionCall.name === TOOL_NAMES.CREATE_ARTIFACT
                ) {
                  args = part.functionCall
                    .args as unknown as CreateArtifactArgs;
                  break;
                }
              }
            }

            if (args) {
              controller.enqueue(
                encoder.encode(
                  encodeEvent({
                    type: "artifact-finish",
                    id: args.id || screen.id,
                    title: args.title || screen.title,
                    content: args.content,
                  }),
                ),
              );
            } else {
              // Fallback: try to extract HTML from text response
              const textContent = screenResponse.text || "";
              if (textContent) {
                controller.enqueue(
                  encoder.encode(
                    encodeEvent({
                      type: "artifact-finish",
                      id: screen.id,
                      title: screen.title,
                      content: textContent,
                    }),
                  ),
                );
              }
            }
          } catch (e) {
            console.error(`Failed to generate screen ${screen.id}:`, e);
            controller.enqueue(
              encoder.encode(
                encodeEvent({
                  type: "text-delta",
                  content: `⚠ Failed to create ${screen.title}\n`,
                }),
              ),
            );
          }
        }

        // Update token usage
        if (user && totalUsageTokens > 0) {
          try {
            await convex.mutation(api.mutations.updateTokenUsage, {
              user_id: user.id,
              tokens_used: totalUsageTokens,
            });
          } catch (error) {
            console.error("Failed to update token usage:", error);
          }
        }

        // Send completion message
        controller.enqueue(
          encoder.encode(
            encodeEvent({
              type: "text-delta",
              content: `\n---\n\n🎉 **All done!** Successfully created ${plan.screens.length} screen${plan.screens.length > 1 ? "s" : ""}.\n\n**What would you like to do next?**\n\n• Add more screens\n• Modify colors or styling\n• Refine a specific screen\n• Add features\n\n💡 *Click on any screen to preview it!*`,
            }),
          ),
        );

        controller.enqueue(
          encoder.encode(encodeEvent({ type: "finish", reason: "stop" })),
        );
        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.enqueue(
          encoder.encode(
            encodeEvent({ type: "error", message: String(error) }),
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
