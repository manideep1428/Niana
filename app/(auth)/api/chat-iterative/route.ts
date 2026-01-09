import openai from "@/lib/openai";
import { getIterativeSystemPrompt, getSingleScreenPrompt } from "@/lib/prompt";
import { tools, CreateArtifactArgs } from "@/lib/tools";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";

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
        const planMessages = [
          { role: "system" as const, content: testPrompt },
          ...messages.map(
            (m: {
              role: string;
              content: string;
              attachments?: Attachment[];
            }) => ({
              role: m.role as "user" | "assistant",
              content: buildMessageContent(m.content, m.attachments),
            })
          ),
        ];

        const planResponse = await openai.chat.completions.create({
          model: "gpt-5.2",
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

        // Send plan info to client
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "text",
              content: `I'll create ${plan.screens.length} screen${plan.screens.length > 1 ? "s" : ""}: ${plan.screens.map((s) => s.title).join(", ")}.\n\n`,
            })}\n\n`
          )
        );

        // Step 2: Generate each screen sequentially
        for (let i = 0; i < plan.screens.length; i++) {
          const screen = plan.screens[i];

          try {
            // Send artifact_start event for this screen
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "artifact_start",
                  data: {
                    id: screen.id,
                    title: screen.title,
                  },
                })}\n\n`
              )
            );

            // Generate this specific screen
            const screenMessages = [
              { role: "system" as const, content: getSingleScreenPrompt() },
              ...messages.map(
                (m: {
                  role: string;
                  content: string;
                  attachments?: Attachment[];
                }) => ({
                  role: m.role as "user" | "assistant",
                  content: buildMessageContent(m.content, m.attachments),
                })
              ),
              {
                role: "user" as const,
                content: `Generate ONLY the "${screen.title}" screen (ID: ${screen.id}). Description: ${screen.description}. This is screen ${i + 1} of ${plan.screens.length}. Use the create_artifact tool with id="${screen.id}" and title="${screen.title}".`,
              },
            ];

            const screenStream = await openai.chat.completions.create({
              model: "gpt-4.1",
              messages: screenMessages,
              tools: tools,
              tool_choice: {
                type: "function",
                function: { name: "create_artifact" },
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

              // Simply accumulate tool call arguments
              if (delta?.tool_calls?.[0]?.function?.arguments) {
                toolArguments += delta.tool_calls[0].function.arguments;
              }
            }

            // Parse and send the final artifact
            const args = JSON.parse(toolArguments) as CreateArtifactArgs;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "artifact_finish",
                  tool: "create_artifact",
                  projectId,
                  data: {
                    id: args.id || screen.id,
                    title: args.title || screen.title,
                    content: args.content,
                  },
                })}\n\n`
              )
            );

            // Send progress update
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "text",
                  content: `✓ Created ${screen.title}\n`,
                })}\n\n`
              )
            );
          } catch (e) {
            console.error(`Failed to generate screen ${screen.id}:`, e);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "text",
                  content: `⚠ Failed to create ${screen.title}\n`,
                })}\n\n`
              )
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

        // Send completion
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "text",
              content: `\nAll ${plan.screens.length} screens have been created! Would you like me to add more screens or make any modifications?`,
            })}\n\n`
          )
        );

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
}
