import { polar, POLAR_PRODUCTS } from "@/lib/polar";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, billingCycle } = await request.json();

    // Ensure safe access to keys
    const planConfig = POLAR_PRODUCTS[planId as keyof typeof POLAR_PRODUCTS];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const productId = planConfig[billingCycle as "monthly" | "yearly"];

    if (!productId) {
      return NextResponse.json(
        { error: "Product not configured for this cycle" },
        { status: 500 },
      );
    }

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${request.headers.get("origin")}/api/polar/verify-payment?checkout_id={CHECKOUT_ID}`,
      customerEmail: user.email,
      metadata: {
        userId: user.id,
        plan: planId,
        billingCycle,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Polar Checkout Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 },
    );
  }
}
