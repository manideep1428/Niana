// ============================================
// OPTION 1: OpenAI (Commented out)
// ============================================
// import openai from "@/lib/openai";
// import { systemPrompt } from "@/lib/prompt";
// import {
//   tools,
//   CreateArtifactArgs,
//   UpdateArtifactArgs,
//   TOOL_NAMES,
// } from "@/lib/tools";

// ============================================
// OPTION 2: Google Gemini with Vertex AI (Active)
// ============================================
import { GoogleGenAI, Type } from "@google/genai";
import { systemPrompt } from "@/lib/prompt";
import {
  CreateArtifactArgs,
  UpdateArtifactArgs,
  TOOL_NAMES,
} from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";

// Initialize Gemini AI with Vertex AI
const geminiAI = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT || "",
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

// Gemini model to use
const GEMINI_MODEL = "gemini-2.5-flash";

// Define tools for Gemini (function declarations)
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
      {
        name: TOOL_NAMES.UPDATE_ARTIFACT,
        description: "Update an existing UI artifact/screen",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "The ID of the artifact to update",
            },
            title: {
              type: Type.STRING,
              description: "New title for the artifact (optional)",
            },
            content: {
              type: Type.STRING,
              description: "Updated HTML content for the artifact",
            },
          },
          required: ["id", "content"],
        },
      },
    ],
  },
];

// Initialize Convex Client
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

export async function GET(request: Request) {
  return Response.json({ message: "Chat API is running (Gemini)" });
}

function buildGeminiContent(
  text: string,
  attachments?: Attachment[],
): GeminiPart[] {
  const parts: GeminiPart[] = [];

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.contentType.startsWith("image/")) {
        // For images, we'd need to fetch and convert to base64
        // For now, add as text reference
        parts.push({
          text: `[Attached image: ${attachment.name}] URL: ${attachment.url}`,
        });
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

  // Build Gemini contents from messages
  const geminiContents = messages.map(
    (m: { role: string; content: string; attachments?: Attachment[] }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: buildGeminiContent(m.content, m.attachments),
    }),
  );

  try {
    const response = await geminiAI.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: geminiContents,
      config: {
        systemInstruction: systemPrompt({ selectedChatModel }),
        tools: geminiTools,
      },
    });

    const encoder = new TextEncoder();
    let usageTokens = 0;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            // Handle text content
            if (chunk.text) {
              controller.enqueue(
                encoder.encode(
                  encodeEvent({ type: "text-delta", content: chunk.text }),
                ),
              );
            }

            // Handle function calls from Gemini
            if (chunk.candidates?.[0]?.content?.parts) {
              for (const part of chunk.candidates[0].content.parts) {
                if (part.functionCall) {
                  const funcCall = part.functionCall;
                  const args = funcCall.args as Record<string, unknown>;

                  if (funcCall.name === TOOL_NAMES.CREATE_ARTIFACT) {
                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: "tool-call",
                          name: TOOL_NAMES.CREATE_ARTIFACT,
                          args: args as unknown as CreateArtifactArgs,
                        }),
                      ),
                    );
                  } else if (funcCall.name === TOOL_NAMES.UPDATE_ARTIFACT) {
                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: "tool-call",
                          name: TOOL_NAMES.UPDATE_ARTIFACT,
                          args: args as unknown as UpdateArtifactArgs,
                        }),
                      ),
                    );
                  }
                }
              }
            }

            // Capture usage metadata if available
            if (chunk.usageMetadata) {
              usageTokens = chunk.usageMetadata.candidatesTokenCount || 0;
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
