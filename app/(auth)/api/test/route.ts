import { CreateArtifactArgs, TOOL_NAMES } from "@/lib/tools";
import { NextRequest } from "next/server";
import { systemPrompt } from "@/lib/prompt";
import { gemini, Type } from "@/lib/gemini";
import { geminiTools } from "@/lib/tools-new";

interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

type GeminiTextPart = { text: string };
type GeminiInlineDataPart = { inlineData: { mimeType: string; data: string } };
type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

type StreamEvent =
  | { type: "text-delta"; content: string }
  | { type: "thought-delta"; content: string }
  | { type: "artifact-start"; id: string; title: string }
  | { type: "artifact-delta"; id: string; content: string }
  | { type: "artifact-finish"; id: string; title: string; content: string }
  | { type: "design-node-skeleton"; id: string; title: string }
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
  const { messages } = await request.json();

  const encoder = new TextEncoder();

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

        // Add create_html_file function declaration for HTML-specific creation
        const enhancedTools = [
          ...geminiTools,
          {
            functionDeclarations: [
              {
                name: "create_html_file",
                description:
                  "Create a new HTML file for a mobile UI screen or web page. This function should be called when the user explicitly asks to create an HTML file or screen. When this is called, a design node skeleton will appear in the UI.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    id: {
                      type: Type.STRING,
                      description:
                        "Unique identifier for the HTML file (e.g., 'home-screen', 'login-page')",
                    },
                    title: {
                      type: Type.STRING,
                      description: "Display title for the HTML file",
                    },
                    content: {
                      type: Type.STRING,
                      description:
                        "Complete HTML content for the screen with inline Tailwind CSS",
                    },
                  },
                  required: ["id", "title", "content"],
                },
              },
            ],
          },
        ];

        const response = await gemini.models.generateContentStream({
          model: "gemini-3-pro-preview",
          contents: geminiContents,
          config: {
            systemInstruction: systemPrompt({
              projectType: "web",
            }),
            tools: enhancedTools,
            thinkingConfig: {
              includeThoughts: true,
              thinkingLevel: "high" as any,
            },
          },
        });

        for await (const chunk of response) {
          if (chunk.text && chunk.text.trim()) {
            controller.enqueue(
              encoder.encode(
                encodeEvent({ type: "text-delta", content: chunk.text }),
              ),
            );
          }

          // Handle thought content
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.thought) {
                controller.enqueue(
                  encoder.encode(
                    encodeEvent({
                      type: "thought-delta",
                      content: part.text || "",
                    }),
                  ),
                );
              }
            }
          }

          // Handle function calls
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.functionCall) {
                const funcCall = part.functionCall;
                const funcName = funcCall.name;

                // Handle create_html_file specifically
                if (funcName === "create_html_file") {
                  const args = funcCall.args as any;

                  // Send the design-node-skeleton event FIRST
                  if (args && args.id && args.title) {
                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: "design-node-skeleton",
                          id: args.id,
                          title: args.title,
                        }),
                      ),
                    );

                    // Then send the artifact-finish event with content
                    if (args.content) {
                      controller.enqueue(
                        encoder.encode(
                          encodeEvent({
                            type: "artifact-finish",
                            id: args.id,
                            title: args.title,
                            content: args.content,
                          }),
                        ),
                      );
                    }
                  }
                }
                // Handle standard CREATE_ARTIFACT
                else if (funcCall.name === TOOL_NAMES.CREATE_ARTIFACT) {
                  const args = funcCall.args as unknown as CreateArtifactArgs;

                  if (args && args.id && args.content) {
                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: "artifact-finish",
                          id: args.id,
                          title: args.title,
                          content: args.content,
                        }),
                      ),
                    );
                  }
                }
                // Handle UPDATE_ARTIFACT
                else if (funcCall.name === TOOL_NAMES.UPDATE_ARTIFACT) {
                  const args = funcCall.args as any;

                  if (args && args.id && args.content) {
                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: "artifact-finish",
                          id: args.id,
                          title: args.title || "",
                          content: args.content,
                        }),
                      ),
                    );
                  }
                }
              }
            }
          }
        }

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
