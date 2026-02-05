import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/razorpay";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    console.error("POLAR_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  const rawBody = await request.text();
  const headersList = await headers();
  const signature = await headersList.get("webhook-signature");
  const webhookId = await headersList.get("webhook-id");
  const webhookTimestamp = await headersList.get("webhook-timestamp");

  if (!signature || !webhookId || !webhookTimestamp) {
    return NextResponse.json(
      { error: "Missing signature headers" },
      { status: 400 },
    );
  }

  // Verify signature
  // Polar standard webhook signature: v1,base64(hmac)
  // Payload to sign: message_id + "." + timestamp + "." + body
  const payloadToSign = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const computedSignature = createHmac("sha256", WEBHOOK_SECRET)
    .update(payloadToSign)
    .digest("base64");

  const expectedSignature = `v1,${computedSignature}`;

  if (signature !== expectedSignature) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.type === "order.paid") {
    const order = event.data;
    const { userId, plan, billingCycle } = order.metadata || {};

    if (userId && plan) {
      const planConfig = SUBSCRIPTION_PLANS[plan as PlanType];
      if (planConfig) {
        const isYearly = billingCycle === "yearly";
        const totalTokens = planConfig.tokens * (isYearly ? 12 : 1);
        const expiresAt = new Date();
        if (isYearly) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        // Create Payment Record
        // We use createPayment because for Polar we don't pre-create a payment record in DB
        await convex.mutation(api.mutations.createPayment, {
          user_id: userId,
          order_id: order.id,
          plan: plan as PlanType,
          amount: order.amount,
          currency: order.currency || "USD",
          status: "paid",
          polar_order_id: order.id,
          polar_checkout_id: order.checkout_id,
          provider: "polar",
        });

        // Create Subscription
        await convex.mutation(api.mutations.createSubscription, {
          user_id: userId,
          plan: plan as PlanType,
          tokens_total: totalTokens,
          tokens_used: 0,
          projects_limit: planConfig.projectsLimit,
          status: "active",
          amount: order.amount,
          currency: order.currency || "USD",
          expires_at: expiresAt.toISOString(),
          polar_subscription_id: order.subscription_id,
          polar_checkout_id: order.checkout_id,
          polar_order_id: order.id,
          provider: "polar",
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
