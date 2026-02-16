import { polar } from "@/lib/polar";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/razorpay";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutId = searchParams.get("checkout_id");

  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  try {
    const checkout = await polar.checkouts.get({ id: checkoutId });

    if (checkout.status !== "succeeded" && checkout.status !== "confirmed") {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 },
      );
    }

    const { metadata } = checkout;
    const userId = metadata?.userId as string;
    const planId = metadata?.plan as PlanType;
    const billingCycle =
      (metadata?.billingCycle as "monthly" | "yearly") || "monthly";

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "Invalid checkout metadata" },
        { status: 400 },
      );
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const isYearly = billingCycle === "yearly";
    const expiresAt = new Date();
    if (isYearly) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const totalTokens = isYearly
      ? selectedPlan.tokens * 12
      : selectedPlan.tokens;

    // Create subscription
    await convex.mutation(api.mutations.createSubscription, {
      user_id: userId,
      plan: planId,
      tokens_total: totalTokens,
      tokens_used: 0,
      projects_limit: selectedPlan.projectsLimit,
      status: "active",
      polar_checkout_id: checkout.id,
      amount: checkout.amount,
      currency: checkout.currency || "USD",
      expires_at: expiresAt.toISOString(),
      provider: "polar",
    });

    return NextResponse.redirect(
      `${request.headers.get("origin")}/dashboard?success=true&provider=polar`,
    );
  } catch (error) {
    console.error("Polar Verify Error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}
