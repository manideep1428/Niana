import openai from "@/lib/openai";
import { tools, CreateArtifactArgs, TOOL_NAMES } from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { systemPrompt } from "@/lib/prompt";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface Attachment {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
}

type TextPart = { type: "text"; text: string };
type ImagePart = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
type ContentPart = TextPart | ImagePart;

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

function buildMessageContent(
  text: string,
  attachments?: Attachment[],
): string | ContentPart[] {
  if (!attachments || attachments.length === 0) {
    return text;
  }

  const parts: ContentPart[] = [];

  for (const attachment of attachments) {
    if (attachment.contentType.startsWith("image/")) {
      parts.push({
        type: "image_url",
        image_url: { url: attachment.url, detail: "auto" },
      });
    } else {
      parts.push({
        type: "text",
        text: `[Attached file: ${attachment.name} (${attachment.contentType})]`,
      });
    }
  }

  if (text) {
    parts.push({ type: "text", text });
  }

  return parts.length === 1 && parts[0].type === "text"
    ? (parts[0] as TextPart).text
    : parts;
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

        // Planning phase - determine screens to create
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

        const planMessages = [
          { role: "system" as const, content: planningPrompt },
          ...messages.map(
            (m: {
              role: string;
              content: string;
              attachments?: Attachment[];
            }) => ({
              role: m.role as "user" | "assistant",
              content: buildMessageContent(m.content, m.attachments),
            }),
          ),
        ];

        const planResponse = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: planMessages,
          response_format: { type: "json_object" },
          stream: false,
        });

        const planContent = planResponse.choices[0]?.message?.content || "{}";
        totalUsageTokens += planResponse.usage?.completion_tokens || 0;

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

            const screenMessages = [
              { role: "system" as const, content: basePrompt },
              ...messages.map(
                (m: {
                  role: string;
                  content: string;
                  attachments?: Attachment[];
                }) => ({
                  role: m.role as "user" | "assistant",
                  content: buildMessageContent(m.content, m.attachments),
                }),
              ),
              {
                role: "user" as const,
                content: `Generate ONLY the "${screen.title}" screen (ID: ${screen.id}). Description: ${screen.description}. This is screen ${i + 1} of ${plan.screens.length}. Use the ${TOOL_NAMES.CREATE_ARTIFACT} tool with id="${screen.id}" and title="${screen.title}".`,
              },
            ];

            const screenStream = await openai.chat.completions.create({
              model: "gpt-4.1",
              messages: screenMessages,
              tools: tools,
              tool_choice: {
                type: "function",
                function: { name: TOOL_NAMES.CREATE_ARTIFACT },
              },
              stream: true,
              stream_options: { include_usage: true },
            });

            let toolArguments = "";

            for await (const chunk of screenStream) {
              const delta = chunk.choices[0]?.delta;

              if (chunk.usage) {
                totalUsageTokens += chunk.usage.completion_tokens || 0;
              }

              if (delta?.tool_calls?.[0]?.function?.arguments) {
                toolArguments += delta.tool_calls[0].function.arguments;
              }
            }

            // Parse and send artifact finish
            const args = JSON.parse(toolArguments) as CreateArtifactArgs;
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
