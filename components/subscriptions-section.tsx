"use client";

import { Crown, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

type PlanId = "free" | "base" | "standard" | "premium";

const plans = [
  {
    id: "free" as PlanId,
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with Niana",
    features: [
      "1 Credit / month",
      "1 Figma export / month",
      "Unlimited projects",
      "Community support",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    id: "base" as PlanId,
    name: "Starter",
    price: "₹199",
    originalPrice: "₹249",
    period: "month",
    description: "For hobbyists and students",
    features: [
      "5 Credits",
      "5 Figma exports",
      "Unlimited projects",
      "Basic support",
    ],
    cta: "Upgrade to Starter",
    highlighted: false,
    badge: "20% OFF",
  },
  {
    id: "standard" as PlanId,
    name: "Pro",
    price: "₹499",
    originalPrice: "₹624",
    period: "month",
    description: "For professionals",
    features: [
      "15 Credits",
      "30 Figma exports",
      "Unlimited projects",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "MOST POPULAR",
  },
  {
    id: "premium" as PlanId,
    name: "Enterprise",
    price: "Custom",
    period: "contact",
    description: "For power users",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Priority support",
      "Centralized billing",
    ],
    cta: "Contact Sales",
    highlighted: false,
    badge: "20% OFF",
  },
];

export function SubscriptionsSection() {
  const { user } = useAuth();
  const subscription = useQuery(
    api.quires.getUserSubscription,
    user ? { user_id: user.id } : "skip"
  );

  // Determine current plan: if no subscription or no plan, it's "free"
  const currentPlanId = subscription?.plan ?? "free";

  const handleClick = (planId: PlanId) => {
    if (planId === "premium") {
      window.open(
        "https://cal.com/manideep-zgprs5/15min?overlayCalendar=true",
        "_blank"
      );
    }
  };

  return (
    <section className="relative py-20 px-4">
      <div className="absolute inset-0 pointer-events-none bg-black rounded-t-[30px]" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Crown className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-white/80">Pricing Plans</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-white">Choose your </span>
            <span className="bg-linear-to-r from-orange-400 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              perfect plan
            </span>
          </h2>

          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include unlimited
            projects.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
          {plans.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlanId;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col ${
                  isCurrentPlan
                    ? "bg-linear-to-b from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20"
                    : plan.highlighted
                      ? "bg-linear-to-b from-orange-500/10 to-orange-500/5 border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20 scale-105 z-10"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      Current Plan
                    </div>
                  </div>
                )}

                {/* Badge for highlighted plan (only if not current) */}
                {plan.badge && !isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-lg ${
                        plan.badge === "MOST POPULAR"
                          ? "bg-linear-to-r from-orange-500 to-orange-600"
                          : "bg-linear-to-r from-orange-500/50 to-orange-600/50 border border-orange-500/30"
                      }`}
                    >
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan Name */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-white/60">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    {plan.originalPrice && (
                      <span className="text-lg text-white/40 line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.period !== "contact" && (
                      <span className="text-white/60">/{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                {plan.id === "premium" ? (
                  <Button
                    onClick={() => handleClick(plan.id)}
                    className="w-full mb-8 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Link href="/pricing" className="w-full block mb-8">
                    <Button
                      disabled={isCurrentPlan}
                      className={`w-full ${
                        isCurrentPlan
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                          : plan.highlighted
                            ? "bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Current Plan
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </Link>
                )}

                {/* Features List */}
                <div className="space-y-3 mt-auto">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrentPlan
                            ? "bg-emerald-500/20"
                            : plan.highlighted
                              ? "bg-orange-500/20"
                              : "bg-white/10"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${
                            isCurrentPlan
                              ? "text-emerald-400"
                              : plan.highlighted
                                ? "text-orange-400"
                                : "text-white/60"
                          }`}
                        />
                      </div>
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-white/60">
            Secure payments powered by Razorpay. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
