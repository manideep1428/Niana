import { CreateArtifactArgs, TOOL_NAMES } from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { systemPrompt } from "@/lib/prompt";
import { gemini } from "@/lib/gemini";
import { geminiTools } from "@/lib/tools-new";

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
  | { type: "artifact-start"; id: string; title: string }
  | { type: "artifact-delta"; id: string; content: string }
  | { type: "artifact-finish"; id: string; title: string; content: string }
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

  // Gemini rejects requests where any message has zero parts.
  // Fall back to a single whitespace text part so the array is never empty.
  if (parts.length === 0) {
    parts.push({ text: " " });
  }

  return parts;
}

export async function POST(request: NextRequest) {
  const { messages, projectId } = await request.json();
  const { user } = await withAuth();

  if (!user) {
    return Response.json(
      { error: "Unauthorized, please sign in" },
      { status: 401 },
    );
  }

  let projectType: "mobile" | "web" = "mobile";
  try {
    const project = await convex.query(api.quires.getProject, {
      project_id: projectId,
    });
    if (project?.type) {
      projectType = project.type as "mobile" | "web";
    }
  } catch (e) {
    console.error("Failed to fetch project type:", e);
  }

  let isFree = true; // default to restricted until subscription confirmed
  try {
    const subscription = await convex.query(api.quires.getUserSubscription, {
      user_id: user.id,
    });
    isFree = !subscription || subscription.plan === "free";
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
        { status: 403 },
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
        const geminiContents = (
          await Promise.all(
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
          )
        // Drop any message that still somehow has no parts (safety guard)
        ).filter((m) => m.parts.length > 0);

        const response = await gemini.models.generateContentStream({
          model: "gemini-3.5-flash",
          contents: geminiContents,
          config: {
            systemInstruction: systemPrompt({ projectType }),
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

                    // Send artifact-start first to show skeleton in canvas
                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: "artifact-start",
                          id: args.id,
                          title: args.title || "",
                          tool: name,
                        } as any)
                      )
                    );

                    // Stream content in chunks to produce a live generating animation
                    if (args.content) {
                      const content: string = args.content;
                      const CHUNK_SIZE = 200;
                      const CHUNK_DELAY_MS = 5;

                      for (let i = 0; i < content.length; i += CHUNK_SIZE) {
                        const chunk = content.slice(i, i + CHUNK_SIZE);
                        controller.enqueue(
                          encoder.encode(
                            encodeEvent({
                              type: "artifact-delta",
                              id: args.id,
                              content: chunk,
                            })
                          )
                        );
                        // Small delay so chunks are flushed separately
                        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
                      }

                      // Send finish after all chunks streamed — include tool name so client knows create vs update
                      controller.enqueue(
                        encoder.encode(
                          encodeEvent({
                            type: "artifact-finish",
                            id: args.id,
                            title: args.title || "",
                            content: args.content,
                            tool: name,
                          } as any)
                        )
                      );
                    }
                  }
                }
              }
            }
          }

          // 4. Token usage
          if (chunk.usageMetadata) {
            totalUsageTokens = chunk.usageMetadata.totalTokenCount || 0;
          }
        }

        // Update token usage in Convex
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
