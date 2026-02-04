import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay-server";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/razorpay";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, billingCycle = "monthly" } = await request.json();

    if (!plan || !SUBSCRIPTION_PLANS[plan as PlanType]) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 },
      );
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan as PlanType];
    const isYearly = billingCycle === "yearly";

    // Get the correct price based on billing cycle
    const amountInPaise = isYearly
      ? selectedPlan.yearlyPriceInPaise
      : selectedPlan.priceInPaise;

    // Create Razorpay order
    // Receipt must be <= 40 chars, so we use a short format
    const shortUserId = user.id.slice(-8);
    const timestamp = Date.now().toString(36); // Base36 for shorter string
    const receipt = `rcpt_${shortUserId}_${timestamp}`.slice(0, 40);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        user_id: user.id,
        plan: plan,
        billing_cycle: billingCycle,
        user_email: user.email,
      },
    });

    // Save payment attempt to Convex
    await convex.mutation(api.mutations.createPayment, {
      user_id: user.id,
      order_id: order.id,
      plan: plan as PlanType,
      amount: amountInPaise,
      currency: "INR",
      status: "created",
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        email: user.email,
      },
      billingCycle,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
