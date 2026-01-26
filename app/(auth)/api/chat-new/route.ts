import { streamText, convertToCoreMessages } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { systemPrompt } from "@/lib/ai/prompts";
import { createDesignTool } from "@/lib/ai/tools/create-design";
import { updateDesignTool } from "@/lib/ai/tools/update-design";

// Initialize Convex Client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Gemini model to use
const GEMINI_MODEL = "gemini-2.0-flash-exp";

interface Attachment {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

export async function GET(request: Request) {
  return Response.json({ message: "Chat API is running (AI SDK + Gemini)" });
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

  try {
    // Convert messages to AI SDK format
    const coreMessages = messages.map((m: Message) => ({
      role: m.role,
      content: m.content,
      // TODO: Add attachment handling for images
    }));

    // Stream response with tools
    const result = streamText({
      model: google(GEMINI_MODEL),
      system: systemPrompt({ selectedChatModel }),
      messages: convertToCoreMessages(coreMessages),
      tools: {
        createDesign: createDesignTool,
        updateDesign: updateDesignTool,
      },
      maxSteps: 5,
      onFinish: async ({ usage }) => {
        // Update token usage
        if (user && usage?.totalTokens) {
          try {
            await convex.mutation(api.mutations.updateTokenUsage, {
              user_id: user.id,
              tokens_used: usage.totalTokens,
            });
          } catch (error) {
            console.error("Failed to update token usage:", error);
          }
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}
