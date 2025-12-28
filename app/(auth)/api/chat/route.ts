import openai from "@/lib/openai";
import { getSystemPrompt } from "@/lib/prompt";
import { tools, CreateArtifactArgs, UpdateArtifactArgs } from "@/lib/tools";
import { NextRequest } from "next/server";

const systemPrompt = getSystemPrompt();

// Attachment type
interface Attachment {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
}

// Message part types for multimodal content
type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
type ContentPart = TextPart | ImagePart;

export async function GET(request: Request) {
  return Response.json({ message: "Chat API is running" });
}

// Convert attachments to OpenAI message content format
function buildMessageContent(
  text: string,
  attachments?: Attachment[]
): string | ContentPart[] {
  if (!attachments || attachments.length === 0) {
    return text;
  }

  const parts: ContentPart[] = [];

  // Add image attachments
  for (const attachment of attachments) {
    if (attachment.contentType.startsWith("image/")) {
      parts.push({
        type: "image_url",
        image_url: { url: attachment.url, detail: "auto" },
      });
    } else {
      // For non-image files (PDF, Word), add as text reference
      // Note: For full document processing, you'd need a document parser
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

  // Build the messages array with history, handling attachments
  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m: { role: string; content: string; attachments?: Attachment[] }) => ({
      role: m.role as "user" | "assistant",
      content: buildMessageContent(m.content, m.attachments),
    })),
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1", // Use a model that supports tool calling
      messages: chatMessages,
      tools: tools,
      tool_choice: "auto",
      stream: true,
    });

    const encoder = new TextEncoder();

    // Track tool calls as they stream
    const toolCalls: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();
    let currentContent = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            const finishReason = chunk.choices[0]?.finish_reason;

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
              }
            }

            // Process tool calls if tool_calls finish reason OR if we have calls and it's stopping
            if (finishReason === "tool_calls" || (finishReason === "stop" && toolCalls.size > 0)) {
              for (const [, toolCall] of toolCalls) {
                try {
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
                  }
                } catch (e) {
                  console.error("Failed to parse tool call arguments:", e);
                }
              }
              // Clear processed calls to avoid double processing
              toolCalls.clear();
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
