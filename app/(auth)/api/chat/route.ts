import openai from "@/lib/openai";
import { systemPrompt } from "@/lib/prompt";
import {
  tools,
  CreateArtifactArgs,
  UpdateArtifactArgs,
  TOOL_NAMES,
} from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";

// Initialize Convex Client
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

export async function GET(request: Request) {
  return Response.json({ message: "Chat API is running" });
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

  // Add the text content
  if (text) {
    parts.push({ type: "text", text });
  }

  return parts.length === 1 && parts[0].type === "text"
    ? (parts[0] as TextPart).text
    : parts;
}

// Stream event types - cleaner format like ai-chatbot
type StreamEvent =
  | { type: "text-delta"; content: string }
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

  // Build the messages array with history
  const chatMessages = [
    { role: "system" as const, content: systemPrompt({ selectedChatModel }) },
    ...messages.map(
      (m: { role: string; content: string; attachments?: Attachment[] }) => ({
        role: m.role as "user" | "assistant",
        content: buildMessageContent(m.content, m.attachments),
      }),
    ),
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4.1",
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
    let usageTokens = 0;

    const readable = new ReadableStream({
      async start(controller) {
        const processToolCall = (
          index: number,
          toolCall: {
            id: string;
            name: string;
            arguments: string;
            sent: boolean;
          },
        ) => {
          if (toolCall.sent) return;

          try {
            const args = JSON.parse(toolCall.arguments);

            if (toolCall.name === TOOL_NAMES.CREATE_ARTIFACT) {
              controller.enqueue(
                encoder.encode(
                  encodeEvent({
                    type: "tool-call",
                    name: TOOL_NAMES.CREATE_ARTIFACT,
                    args: args as CreateArtifactArgs,
                  }),
                ),
              );
              toolCall.sent = true;
            } else if (toolCall.name === TOOL_NAMES.UPDATE_ARTIFACT) {
              controller.enqueue(
                encoder.encode(
                  encodeEvent({
                    type: "tool-call",
                    name: TOOL_NAMES.UPDATE_ARTIFACT,
                    args: args as UpdateArtifactArgs,
                  }),
                ),
              );
              toolCall.sent = true;
            }
          } catch {
            // JSON not complete yet
          }
        };

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            const finishReason = chunk.choices[0]?.finish_reason;

            // Capture usage
            if (chunk.usage) {
              usageTokens = chunk.usage.completion_tokens || 0;
            }

            // Stream text content directly
            if (delta?.content) {
              controller.enqueue(
                encoder.encode(
                  encodeEvent({ type: "text-delta", content: delta.content }),
                ),
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

                processToolCall(index, current);
              }
            }

            // Process remaining tool calls on finish
            if (
              finishReason === "tool_calls" ||
              (finishReason === "stop" && toolCalls.size > 0)
            ) {
              for (const [index, toolCall] of toolCalls) {
                if (!toolCall.sent) {
                  processToolCall(index, toolCall);
                }
              }
              toolCalls.clear();
            }
          }

          // Update token usage
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

          // Send finish event
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
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}
