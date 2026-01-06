"use server";

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { SUBSCRIPTION_PLANS, PlanType, BillingCycle } from "@/lib/razorpay";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billingCycle = "monthly",
    } = await request.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET!
    )
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Payment signature verification failed");

      // Update payment status to failed
      await convex.mutation(api.mutations.updatePaymentStatus, {
        order_id: razorpay_order_id,
        status: "failed",
      });

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Get plan details
    const selectedPlan = SUBSCRIPTION_PLANS[plan as PlanType];
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const isYearly = billingCycle === "yearly";

    // Calculate expiry date based on billing cycle
    const expiresAt = new Date();
    if (isYearly) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year for yearly
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days for monthly
    }

    // Get the correct amount based on billing cycle
    const amountInPaise = isYearly
      ? selectedPlan.yearlyPriceInPaise
      : selectedPlan.priceInPaise;

    // Calculate tokens (yearly gets 12x monthly tokens)
    const totalTokens = isYearly
      ? selectedPlan.tokens * 12
      : selectedPlan.tokens;

    // Update payment status to paid
    await convex.mutation(api.mutations.updatePaymentStatus, {
      order_id: razorpay_order_id,
      status: "paid",
      razorpay_payment_id,
      razorpay_signature,
    });

    // Create subscription
    await convex.mutation(api.mutations.createSubscription, {
      user_id: user.id,
      plan: plan as PlanType,
      tokens_total: totalTokens,
      tokens_used: 0,
      projects_limit: selectedPlan.projectsLimit,
      status: "active",
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      amount: amountInPaise,
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        plan: selectedPlan.name,
        tokens: totalTokens,
        projectsLimit: selectedPlan.projectsLimit,
        expiresAt: expiresAt.toISOString(),
        billingCycle,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
