import openai from "@/lib/openai";
import { getSystemPrompt } from "@/lib/prompt";
import { tools, CreateArtifactArgs, UpdateArtifactArgs } from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";

// Initialize Convex Client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const systemPrompt = getSystemPrompt();

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

export async function GET(request: Request) {
  return Response.json({ message: "Chat API is running" });
}

function buildMessageContent(
  text: string,
  attachments?: Attachment[]
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

  // Add the text content
  if (text) {
    parts.push({ type: "text", text });
  }

  return parts.length === 1 && parts[0].type === "text"
    ? (parts[0] as TextPart).text
    : parts;
}

export async function POST(request: NextRequest) {
  const { messages, projectId } = await request.json();
  const { user } = await withAuth();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check Credit Balance
  try {
    const subscription = await convex.query(api.quires.getUserSubscription, {
      user_id: user.id,
    });
    const totalTokens = subscription?.tokens_total ?? 20000; // Default Free: 1 credit = 20k tokens
    const usedTokens = subscription?.tokens_used ?? 0;

    if (usedTokens >= totalTokens) {
      return Response.json(
        {
          error:
            "You have run out of credits. Please upgrade your plan to continue.",
        },
        { status: 403 }
      );
    }
  } catch (e) {
    console.error("Credit check failed:", e);
  }

  // Build the messages array with history, handling attachments
  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map(
      (m: { role: string; content: string; attachments?: Attachment[] }) => ({
        role: m.role as "user" | "assistant",
        content: buildMessageContent(m.content, m.attachments),
      })
    ),
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1", // Use a model that supports tool calling
      messages: chatMessages,
      tools: tools,
      tool_choice: "auto",
      stream: true,
      stream_options: { include_usage: true },
    });

    const encoder = new TextEncoder();

    // Track tool calls as they stream
    const toolCalls: Map<
      number,
      { id: string; name: string; arguments: string; sent: boolean }
    > = new Map();
    let currentContent = "";
    let usageTokens = 0;

    const readable = new ReadableStream({
      async start(controller) {
        // Helper function to try sending a tool call if its arguments are complete
        const tryProcessToolCall = (
          index: number,
          toolCall: {
            id: string;
            name: string;
            arguments: string;
            sent: boolean;
          }
        ) => {
          if (toolCall.sent) return; // Already sent

          try {
            // Try to parse - if successful, the arguments are complete
            const args = JSON.parse(toolCall.arguments);

            if (toolCall.name === "create_artifact") {
              const createArgs = args as CreateArtifactArgs;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_call",
                    tool: "create_artifact",
                    projectId,
                    data: {
                      id: createArgs.id,
                      title: createArgs.title,
                      content: createArgs.content,
                    },
                  })}\n\n`
                )
              );
              toolCall.sent = true;
            } else if (toolCall.name === "update_artifact") {
              const updateArgs = args as UpdateArtifactArgs;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_call",
                    tool: "update_artifact",
                    projectId,
                    data: {
                      id: updateArgs.id,
                      title: updateArgs.title,
                      content: updateArgs.content,
                    },
                  })}\n\n`
                )
              );
              toolCall.sent = true;
            }
          } catch {
            // JSON not complete yet, wait for more chunks
          }
        };

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            const finishReason = chunk.choices[0]?.finish_reason;

            // Capture usage if available (usually in the last chunk)
            if (chunk.usage) {
              // User requested: "every 10,000 output tokens ... will cosume a 1 token"
              // We track output tokens (completion_tokens).
              usageTokens = chunk.usage.completion_tokens || 0;
            }

            // Handle text content
            if (delta?.content) {
              currentContent += delta.content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: delta.content })}\n\n`
                )
              );
            }

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const index = toolCall.index;

                if (!toolCalls.has(index)) {
                  toolCalls.set(index, {
                    id: toolCall.id || "",
                    name: toolCall.function?.name || "",
                    arguments: "",
                    sent: false,
                  });
                }

                const current = toolCalls.get(index)!;

                if (toolCall.id) {
                  current.id = toolCall.id;
                }
                if (toolCall.function?.name) {
                  current.name = toolCall.function.name;
                }
                if (toolCall.function?.arguments) {
                  current.arguments += toolCall.function.arguments;
                }

                // Try to process this tool call immediately if arguments are complete
                tryProcessToolCall(index, current);
              }
            }

            // Final check: Process any remaining tool calls that weren't sent yet
            if (
              finishReason === "tool_calls" ||
              (finishReason === "stop" && toolCalls.size > 0)
            ) {
              for (const [index, toolCall] of toolCalls) {
                if (!toolCall.sent) {
                  tryProcessToolCall(index, toolCall);
                }
              }
              toolCalls.clear();
            }
          }

          // Update token usage in DB if we have a user and usage data
          if (user && usageTokens > 0) {
            try {
              await convex.mutation(api.mutations.updateTokenUsage, {
                user_id: user.id,
                tokens_used: usageTokens,
              });
            } catch (error) {
              console.error("Failed to update token usage:", error);
            }
          }

          // Send done event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: String(error) })}\n\n`
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
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
