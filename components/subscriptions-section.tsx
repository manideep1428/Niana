"use client";

import { Crown, Check, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "Forever",
    description: "Perfect for trying out Niana",
    features: [
      "5 projects per month",
      "Basic AI design generation",
      "Export to HTML/CSS",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29",
    period: "month",
    description: "For professionals and teams",
    features: [
      "Unlimited projects",
      "Advanced AI models",
      "Priority generation",
      "Export to React/Vue",
      "Custom components",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "99",
    period: "month",
    description: "For large teams and organizations",
    features: [
      "Everything in Pro",
      "Custom AI training",
      "White-label options",
      "API access",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function SubscriptionsSection() {
  return (
    <section className="relative py-20 px-4">
      <div className="absolute inset-0 pointer-events-none bg-black rounded-t-[30px]" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-white/80">Pricing Plans</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-white">Choose your </span>
            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              perfect plan
            </span>
          </h2>

          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include our core AI
            design features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlighted
                  ? "bg-linear-to-b from-white/10 to-white/5 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              {/* Badge for highlighted plan */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-purple-500 to-pink-500 text-white text-xs font-medium shadow-lg">
                    <Star className="w-3 h-3" />
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
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-white/60">/{plan.period}</span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className={`w-full mb-8 ${
                  plan.highlighted
                    ? "bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {plan.highlighted && <Zap className="w-4 h-4 mr-2" />}
                {plan.cta}
              </Button>

              {/* Features List */}
              <div className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.highlighted ? "bg-purple-500/20" : "bg-white/10"
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          plan.highlighted ? "text-purple-400" : "text-white/60"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-white/60">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
