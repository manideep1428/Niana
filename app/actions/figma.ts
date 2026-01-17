"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { SUBSCRIPTION_PLANS } from "@/lib/razorpay";
import { randomUUID } from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function convertHtmlToFigma(html: string, artifactId?: string) {
  const API_KEY = process.env.CONVERT_FIGMA_API_KEY!;
  const { user } = await withAuth();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    let isCached = false;
    if (artifactId) {
      const cached = await convex.query(api.figma.getFigmaData, {
        artifact_id: artifactId,
      });
      if (cached && cached.content) {
        console.log("Figma Cache Hit for", artifactId);
        return { success: true, data: cached.content, cached: true };
      }
    }

    const subscription = await convex.query(api.quires.getUserSubscription, {
      user_id: user.id,
    });
    const planKey = (subscription?.plan ||
      "free") as keyof typeof SUBSCRIPTION_PLANS;
    const limit =
      SUBSCRIPTION_PLANS[planKey]?.figmaLimit ??
      SUBSCRIPTION_PLANS.free.figmaLimit;

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    const usage = await convex.query(api.figma.getFigmaUserCount, {
      user_id: user.id,
      since: startOfMonth,
    });

    if (usage >= limit) {
      return {
        success: false,
        error: `Plan limit reached. You have used ${usage}/${limit} Figma exports this month. Upgrade to export more.`,
      };
    }
  } catch (e) {
    console.error("Limit check failed:", e);
    // Fallback? Or block? Block is safer.
    return { success: false, error: "Failed to verify usage limits." };
  }

  try {
    console.log("Figma Cache Miss - Calling API");
    const response = await fetch("https://api.to.design/html", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        html,
        clip: true,
        width: 1280,
        height: 720,
        theme: "light",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.title || errorJson.message || errorMessage;
      } catch {
        // use plain text error
      }
      return { success: false, error: errorMessage };
    }

    const clipboardData = await response.text();

    if (artifactId && clipboardData) {
      try {
        await convex.mutation(api.figma.saveFigmaData, {
          artifact_id: artifactId,
          content: clipboardData,
          user_id: user.id,
        });
        console.log("Saved to cache:", artifactId);
      } catch (e) {
        console.error("Failed to cache result:", e);
      }
    }

    return { success: true, data: clipboardData, cached: false };
  } catch (error) {
    console.error("Figma conversion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
