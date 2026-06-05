import {
  CreateArtifactArgs,
  UpdateArtifactArgs,
  TOOL_NAMES,
} from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { systemPrompt } from "@/lib/prompt";
import { gemini } from "@/lib/gemini";
import { geminiTools } from "@/lib/tools-new";

// Initialize Convex Client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface Attachment {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
}

type StreamEvent =
  | { type: "text-delta"; content: string }
  | { type: "thought-delta"; content: string }
  | {
    type: "tool-call";
    name: string;
    args: CreateArtifactArgs | UpdateArtifactArgs;
  }
  | { type: "finish"; reason: string }
  | { type: "error"; message: string };

function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

type GeminiTextPart = { text: string };
type GeminiInlineDataPart = { inlineData: { mimeType: string; data: string } };
type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

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

export async function GET(request: Request) {
  return Response.json({ message: "Chat API is running (Gemini)" });
}

export async function POST(request: NextRequest) {
  const { messages, projectId, selectedChatModel } = await request.json();
  const { user } = await withAuth();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check Credit Balance
  try {
    const subscription = await convex.query(api.quires.getUserSubscription, {
      user_id: user.id,
    });
    const isFree = !subscription || subscription.plan === "free";
    const totalTokens =
      isFree && subscription?.tokens_total === -1
        ? 2
        : (subscription?.tokens_total ?? 2);
    const usedTokens = subscription?.tokens_used ?? 0;

    // Check if user has credits remaining (Bypassed for testing)
    /*
    if (usedTokens >= totalTokens) {
      return Response.json(
        {
          error:
            "You have run out of credits. Please upgrade your plan to continue.",
        },
        { status: 403 }
      );
    }
    */
  } catch (e) {
    console.error("Credit check failed:", e);
  }

  const encoder = new TextEncoder();
  let totalUsageTokens = 0;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const geminiContents = await Promise.all(
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

        const response = await gemini.models.generateContentStream({
          model: "gemini-3-pro-preview",
          contents: geminiContents,
          config: {
            systemInstruction: systemPrompt({ selectedChatModel }),
            tools: geminiTools,
            thinkingConfig: {
              includeThoughts: true,
              thinkingLevel: "high" as any,
            },
          },
        });

        const processedToolCalls = new Set<string>();

        for await (const chunk of response) {
          // 1. Text deltas
          if (chunk.text && chunk.text.trim()) {
            controller.enqueue(
              encoder.encode(
                encodeEvent({ type: "text-delta", content: chunk.text })
              )
            );
          }

          // 2. Thought deltas
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.thought) {
                controller.enqueue(
                  encoder.encode(
                    encodeEvent({
                      type: "thought-delta",
                      content: part.text || "",
                    })
                  )
                );
              }
            }
          }

          // 3. Function Calls
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.functionCall) {
                const funcCall = part.functionCall;
                const name = funcCall.name;
                const args = funcCall.args as any;

                if (
                  name === TOOL_NAMES.CREATE_ARTIFACT ||
                  name === TOOL_NAMES.UPDATE_ARTIFACT
                ) {
                  if (args && args.id && !processedToolCalls.has(args.id)) {
                    processedToolCalls.add(args.id);

                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: "tool-call",
                          name: name,
                          args: args,
                        })
                      )
                    );
                  }
                }
              }
            }
          }

          // 4. Usage metadata
          if (chunk.usageMetadata) {
            totalUsageTokens = chunk.usageMetadata.totalTokenCount || 0;
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

        // Send finish event
        controller.enqueue(
          encoder.encode(encodeEvent({ type: "finish", reason: "stop" }))
        );
        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.enqueue(
          encoder.encode(
            encodeEvent({ type: "error", message: String(error) })
          )
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
