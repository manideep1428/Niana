"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/razorpay";
import TopBar from "@/components/top-bar";
import { PaymentSuccessAnimation } from "@/components/payment-success-animation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Free plan config (not in SUBSCRIPTION_PLANS as it's not purchasable)

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null);
  const [isInternational, setIsInternational] = useState(false);

  // Get user's current subscription
  const subscription = useQuery(
    api.quires.getUserSubscription,
    user ? { user_id: user.id } : "skip",
  );
  const currentPlanId = subscription?.plan ?? "free";

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId: PlanType) => {
    if (!user) {
      toast.info("Please sign in to subscribe");
      router.push("/sign-in");
      return;
    }

    setLoadingPlan(planId);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load payment gateway");
        setLoadingPlan(null);
        return;
      }

      const plan = SUBSCRIPTION_PLANS[planId];
      const billingCycle = isYearly ? "yearly" : "monthly";

      if (isInternational) {
        try {
          const response = await fetch("/api/polar/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId, billingCycle }),
          });

          const data = await response.json();

          if (data.error) {
            toast.error(data.error);
            setLoadingPlan(null);
            return;
          }

          if (data.url) {
            window.location.href = data.url;
            return;
          }
        } catch (error) {
          console.error("Polar payment error:", error);
          toast.error("Failed to start checkout");
          setLoadingPlan(null);
          return;
        }
        return;
      }

      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, billingCycle }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to create order");
        setLoadingPlan(null);
        return;
      }

      const options: RazorpayOptions = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Niana",
        description: `${plan.name} Plan Subscription (${isYearly ? "Yearly" : "Monthly"})`,
        order_id: data.order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                plan: planId,
                billingCycle,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setPurchasedPlan(plan.name);
              setShowSuccess(true);
            } else {
              toast.error(verifyData.error || "Payment verification failed");
            }
          } catch {
            toast.error("Payment verification failed");
          }
          setLoadingPlan(null);
        },
        prefill: {
          name: data.user.name,
          email: data.user.email,
        },
        theme: {
          color: "#f97316",
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setLoadingPlan(null);
      });
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong. Please try again.");
      setLoadingPlan(null);
    }
  };

  const handleContactSales = () => {
    window.open(
      "https://cal.com/manideep-zgprs5/15min?overlayCalendar=true",
      "_blank",
    );
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push("/dashboard");
  };

  // Helper to format price
  const formatPrice = (price: number) => `₹${price.toLocaleString()}`;

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-background">
        {/* Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 right-0 h-[40%]">
            <div className="absolute inset-0 bg-linear-to-t from-orange-400/10 dark:from-orange-600/20 via-orange-300/5 dark:via-orange-500/10 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-linear-to-t from-orange-400/20 dark:from-orange-500/30 via-orange-300/10 dark:via-orange-400/20 to-transparent blur-3xl" />
          </div>
        </div>

        <div className="relative z-10">
          {/* Republic Day Offer Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-orange-500 via-white to-green-500 text-center py-3 px-4"
          >
            <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 flex-wrap">
              <span className="text-2xl">🇮🇳</span>
              <span className="font-bold text-gray-900 text-sm sm:text-base">
                🎉 Republic Day Special Offer!
              </span>
              <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-pulse">
                5 FREE UNLIMITED
              </span>
              <span className="text-gray-800 text-sm hidden sm:inline">
                No credit card required • Limited time only
              </span>
              <span className="text-2xl">🎊</span>
            </div>
          </motion.div>

          <TopBar />

          {/* Main Content */}
          <div className="pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
                  Choose your plan
                </h1>
                <p className="text-lg text-gray-600 dark:text-white/60 max-w-xl mx-auto mb-8">
                  Start free and upgrade as you grow. Cancel anytime.
                </p>

                {/* Location Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-black/5 dark:bg-white/5 p-1 rounded-lg inline-flex items-center gap-2 border border-black/10 dark:border-white/10">
                    <button
                      onClick={() => setIsInternational(false)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        !isInternational
                          ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
                      }`}
                    >
                      🇮🇳 India
                    </button>
                    <button
                      onClick={() => setIsInternational(true)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        isInternational
                          ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
                      }`}
                    >
                      🌍 International
                    </button>
                  </div>
                </div>

                {/* Monthly/Yearly Toggle */}
                <div className="inline-flex items-center gap-2 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  <button
                    onClick={() => setIsYearly(false)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      !isYearly
                        ? "bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsYearly(true)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      isYearly
                        ? "bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Yearly
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold">
                      2 MONTHS FREE
                    </span>
                  </button>
                </div>
              </motion.div>

              {/* Pricing Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {/* FREE Plan Card - Special Republic Day Edition */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0 }}
                  className="relative"
                >
                  {/* Republic Day Ribbon */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-white to-green-500 text-gray-900 text-xs font-bold shadow-lg whitespace-nowrap animate-pulse">
                      🇮🇳 5 FREE UNLIMITED
                    </span>
                  </div>

                  {/* Card */}
                  <div
                    className={`relative h-full rounded-2xl overflow-hidden transition-all duration-300 ${
                      currentPlanId === "free"
                        ? "bg-gradient-to-b from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/50"
                        : "bg-gradient-to-b from-orange-500/20 via-white/10 to-green-500/20 border-2 border-orange-400/50 dark:border-orange-500/30"
                    }`}
                  >
                    <div className="p-6 flex flex-col h-full">
                      {/* Plan Header */}
                      <div className="flex items-center justify-between mb-2 mt-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Free
                        </h3>
                        {currentPlanId === "free" ? (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            CURRENT
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gradient-to-r from-orange-500 to-green-500 text-white">
                            REPUBLIC OFFER
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
                        Perfect for getting started
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₹0
                        </span>
                        <span className="text-gray-500 dark:text-white/50">
                          /forever
                        </span>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.info("Please sign in to get started");
                            router.push("/sign-in");
                          } else {
                            router.push("/");
                          }
                        }}
                        disabled={currentPlanId === "free"}
                        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 mb-6 ${
                          currentPlanId === "free"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                            : "bg-gradient-to-r from-orange-500 via-orange-400 to-green-500 text-white hover:from-orange-600 hover:via-orange-500 hover:to-green-600 shadow-lg shadow-orange-500/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {currentPlanId === "free" ? (
                          <span className="flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" />
                            Current Plan
                          </span>
                        ) : (
                          "Get Started Free"
                        )}
                      </button>

                      {/* Credits Info */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 mb-1">
                          <span className="text-lg font-semibold">
                            ∞ Unlimited Credits
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-white/40">
                          No limits for 5 days! 🎉
                        </p>
                      </div>

                      {/* INCLUDES Header */}
                      <p className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wider mb-3">
                        INCLUDES:
                      </p>

                      {/* Features */}
                      <ul className="space-y-2.5 flex-grow">
                        {[
                          "Unlimited Credits",
                          "Unlimited projects",
                          "Unlimited Figma exports",
                          "Community support",
                          "No credit card required",
                        ].map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500 dark:text-green-400" />
                            <span className="text-sm text-gray-600 dark:text-white/70">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>

                {/* Paid Plan Cards */}
                {(Object.keys(SUBSCRIPTION_PLANS) as PlanType[])
                  .filter((planId) => planId !== "free")
                  .map((planId, index) => {
                    const plan = SUBSCRIPTION_PLANS[planId];
                    const isCurrentPlan = currentPlanId === planId;
                    const isLoading = loadingPlan === planId;
                    const isEnterprise = planId === "premium";

                    const price = isYearly ? plan.yearlyPrice : plan.price;
                    const originalPrice = isYearly
                      ? plan.originalYearlyPrice
                      : plan.originalPrice;

                    return (
                      <motion.div
                        key={planId}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
                        className="relative"
                      >
                        {/* Card */}
                        <div
                          className={`relative h-full rounded-2xl overflow-hidden transition-all duration-300 ${
                            isCurrentPlan
                              ? "bg-gradient-to-b from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/50"
                              : plan.popular
                                ? "bg-gradient-to-b from-orange-500/10 to-orange-600/5 border-2 border-orange-500/50"
                                : "bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 shadow-sm dark:shadow-none"
                          }`}
                        >
                          <div className="p-6 flex flex-col h-full">
                            {/* Plan Header */}
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {plan.name}
                              </h3>
                              {isCurrentPlan ? (
                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  CURRENT
                                </span>
                              ) : plan.popular ? (
                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                  MOST POPULAR
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                                  {plan.discountPercent}% OFF
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
                              {isEnterprise
                                ? "Built for teams"
                                : `For ${planId === "base" ? "higher limits" : "even higher AI limits"}`}
                            </p>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mb-6">
                              {isEnterprise ? (
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                  Custom
                                </span>
                              ) : (
                                <>
                                  <span className="text-lg text-gray-400 dark:text-white/40 line-through">
                                    {isInternational ? "$" : "₹"}
                                    {isInternational
                                      ? (originalPrice / 85).toFixed(0)
                                      : formatPrice(originalPrice).replace(
                                          "₹",
                                          "",
                                        )}
                                  </span>
                                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {isInternational ? "$" : "₹"}
                                    {isInternational
                                      ? (price / 85).toFixed(0)
                                      : formatPrice(price).replace("₹", "")}
                                  </span>
                                  <span className="text-gray-500 dark:text-white/50">
                                    /{isYearly ? "year" : "month"}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* CTA Button */}
                            <button
                              onClick={() =>
                                isEnterprise
                                  ? handleContactSales()
                                  : handleSubscribe(planId)
                              }
                              disabled={
                                isLoading ||
                                (loadingPlan !== null &&
                                  loadingPlan !== planId) ||
                                (isCurrentPlan && !isEnterprise)
                              }
                              className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 mb-6 ${
                                isCurrentPlan && !isEnterprise
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                                  : plan.popular
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20"
                                    : "bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isCurrentPlan && !isEnterprise ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Check className="w-4 h-4" />
                                  Current Plan
                                </span>
                              ) : isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  Processing...
                                </span>
                              ) : isEnterprise ? (
                                "Contact Sales"
                              ) : (
                                `Upgrade to ${plan.name}`
                              )}
                            </button>

                            {/* Credits Info */}
                            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                              <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 mb-1">
                                <span className="text-lg font-semibold">
                                  {isEnterprise
                                    ? "Custom Credits"
                                    : `${isYearly ? plan.credits * 12 : plan.credits} Credits / ${isYearly ? "year" : "month"}`}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-white/40">
                                {isEnterprise
                                  ? "Unlimited messages"
                                  : `~${Math.floor((isYearly ? plan.tokens * 12 : plan.tokens) / 1000)} messages (${((isYearly ? plan.tokens * 12 : plan.tokens) / 1000).toLocaleString()}K tokens)`}
                              </p>
                            </div>

                            {/* INCLUDES Header */}
                            <p className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wider mb-3">
                              INCLUDES:
                            </p>

                            {/* Features */}
                            <ul className="space-y-2.5 flex-grow">
                              {(isEnterprise
                                ? [
                                    "Everything in Pro",
                                    "Team collaboration",
                                    "Priority support",
                                    "Centralized billing",
                                  ]
                                : plan.features
                              ).map((feature, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2.5"
                                >
                                  <Check
                                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                      plan.popular
                                        ? "text-orange-500 dark:text-orange-400"
                                        : "text-orange-500 dark:text-orange-400/70"
                                    }`}
                                  />
                                  <span className="text-sm text-gray-600 dark:text-white/70">
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-12 text-center"
              >
                <p className="text-sm text-gray-400 dark:text-white/40 mb-4">
                  Secure payments powered by
                </p>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 17.93c-3.94-.494-7-3.858-7-7.93s3.06-7.436 7-7.93v15.86zm2 0V2.07c3.94.494 7 3.858 7 7.93s-3.06 7.436-7 7.93z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-white/60">
                      Razorpay
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <svg
                      className="w-5 h-5 text-green-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-white/60">
                      256-bit SSL
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Animation Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <button
                onClick={handleSuccessClose}
                className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <PaymentSuccessAnimation
                planName={purchasedPlan || ""}
                onClose={handleSuccessClose}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
