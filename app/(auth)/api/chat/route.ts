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
import { systemPrompt } from "@/lib/prompt";
import openai from "@/lib/openai";

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

export async function GET(request: Request) {
  return Response.json({ message: "Chat API is running (OpenAI)" });
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

    // Check if user has credits remaining
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

  const encoder = new TextEncoder();
  let totalUsageTokens = 0;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const formattedMessages: any[] = [
          {
            role: "system",
            content: systemPrompt({ selectedChatModel }),
          },
        ];

        for (const m of messages) {
          if (m.role === "assistant" || m.role === "model") {
            formattedMessages.push({
              role: "assistant",
              content: m.content || "",
            });
          } else {
            const content = [];
            if (m.content) {
              content.push({ type: "text", text: m.content });
            }
            if (m.attachments && m.attachments.length > 0) {
              for (const att of m.attachments) {
                if (
                  att.contentType.startsWith("image/") ||
                  att.contentType === "application/pdf"
                ) {
                  try {
                    const response = await fetch(att.url);
                    if (response.ok) {
                      const arrayBuffer = await response.arrayBuffer();
                      const base64String = Buffer.from(arrayBuffer).toString(
                        "base64"
                      );
                      content.push({
                        type: "image_url",
                        image_url: {
                          url: `data:${att.contentType};base64,${base64String}`,
                        },
                      });
                    } else {
                      content.push({
                        type: "text",
                        text: `[Attached file: ${att.name}] (Download: ${att.url})`,
                      });
                    }
                  } catch (error) {
                    content.push({
                      type: "text",
                      text: `[Attached file: ${att.name}] (Download: ${att.url})`,
                    });
                  }
                } else {
                  content.push({
                    type: "text",
                    text: `[Attached file: ${att.name} (${att.contentType})]`,
                  });
                }
              }
            }
            formattedMessages.push({
              role: "user",
              content,
            });
          }
        }


        const response = await openai.chat.completions.create({
          model: "gpt-5.4",
          messages: formattedMessages,
          tools: tools,
          stream: true,
          stream_options: { include_usage: true },
        });

        const toolCallsMap: Record<number, { name: string; arguments: string }> = {};

        for await (const chunk of response) {
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            controller.enqueue(
              encoder.encode(
                encodeEvent({ type: "text-delta", content: delta.content })
              )
            );
          }

          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              const index = toolCall.index;
              if (!toolCallsMap[index]) {
                toolCallsMap[index] = { name: "", arguments: "" };
              }
              if (toolCall.function?.name) {
                toolCallsMap[index].name = toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                toolCallsMap[index].arguments += toolCall.function.arguments;
              }
            }
          }

          if (chunk.choices[0]?.finish_reason === "tool_calls") {
            for (const key in toolCallsMap) {
              const tc = toolCallsMap[key];
              if (
                tc.name === TOOL_NAMES.CREATE_ARTIFACT ||
                tc.name === TOOL_NAMES.UPDATE_ARTIFACT
              ) {
                try {
                  const args = JSON.parse(tc.arguments) as
                    | CreateArtifactArgs
                    | UpdateArtifactArgs;
                  controller.enqueue(
                    encoder.encode(
                      encodeEvent({
                        type: "tool-call",
                        name: tc.name,
                        args: args,
                      })
                    )
                  );
                } catch (e) {
                  console.error("Failed to parse tool call args:", e);
                }
              }
            }
          }

          if (chunk.usage) {
            totalUsageTokens = chunk.usage.total_tokens || 0;
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
