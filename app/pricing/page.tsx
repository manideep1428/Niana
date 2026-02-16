"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [isInternational, setIsInternational] = useState<boolean | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);

  // Auto-detect user's country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Use a free IP geolocation service
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        // If country is India, use Razorpay, otherwise use Polar
        setIsInternational(data.country_code !== "IN");
      } catch (error) {
        console.error("Failed to detect country:", error);
        // Default to India (Razorpay) if detection fails
        setIsInternational(false);
      } finally {
        setIsDetectingLocation(false);
      }
    };
    detectCountry();
  }, []);

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

                {/* Welcome Offer Banner */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative group cursor-default inline-block mb-8"
                >
                  {/* Outer Glow/Blur */}
                  <div className="absolute -inset-[2px] bg-linear-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-full blur-md opacity-40 group-hover:opacity-80 transition duration-500 animate-pulse"></div>

                  {/* Moving Gradient Border */}
                  <div className="absolute -inset-px bg-linear-to-r from-orange-500 via-yellow-500 to-orange-500 rounded-full animate-gradient-x opacity-100"></div>

                  <div className="relative px-6 py-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-full flex items-center gap-4 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                    {/* Pulsing Dot */}
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                    </span>

                    {/* Text Section */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                        Welcome Offer
                      </span>

                      <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />

                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                          75% OFF
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30 uppercase tracking-widest">
                          Limited Time
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <p className="text-lg text-gray-600 dark:text-white/60 max-w-xl mx-auto mb-8">
                  Start free and upgrade as you grow. Cancel anytime.
                </p>

                {/* Location indicator */}
                {isDetectingLocation ? (
                  <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs font-medium">
                        Auto-detecting region...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center mb-8">
                    <div className="group relative inline-flex items-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative flex items-center gap-3 px-1 py-1 pr-4 rounded-full bg-background/50 backdrop-blur-md border border-border/50 shadow-sm hover:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-foreground text-xs font-medium">
                          <span>{isInternational ? "🌍" : "🇮🇳"}</span>
                          <span>{isInternational ? "Global" : "India"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            Prices in {isInternational ? "USD" : "INR"}
                          </span>
                          <div className="w-px h-3 bg-border" />
                          <button
                            onClick={() => setIsInternational(!isInternational)}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            Switch to {isInternational ? "INR" : "USD"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                {/* FREE Plan Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0 }}
                  className="relative"
                >
                  {/* Card */}
                  <div
                    className={`relative h-full rounded-2xl overflow-hidden transition-all duration-300 ${
                      currentPlanId === "free"
                        ? "bg-gradient-to-b from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/50"
                        : "bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 shadow-sm dark:shadow-none"
                    }`}
                  >
                    <div className="p-6 flex flex-col h-full">
                      {/* Plan Header */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Free
                        </h3>
                        {currentPlanId === "free" && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            CURRENT
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
                        Perfect for getting started
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {isInternational ? "$0" : "₹0"}
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
                            : "bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
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
                            2 Credits
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-white/40">
                          Perfect to try out Niana
                        </p>
                      </div>

                      {/* INCLUDES Header */}
                      <p className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wider mb-3">
                        INCLUDES:
                      </p>

                      {/* Features */}
                      <ul className="space-y-2.5 flex-grow">
                        {[
                          "2 design credits",
                          "1 Figma export",
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
                    const isTeamPlan = planId === "premium";

                    // Get prices based on billing cycle and location
                    const price = isYearly
                      ? isInternational
                        ? (plan as any).yearlyPriceUSD
                        : plan.yearlyPrice
                      : isInternational
                        ? (plan as any).priceUSD
                        : plan.price;
                    const originalPrice = isYearly
                      ? isInternational
                        ? (plan as any).originalYearlyPriceUSD
                        : plan.originalYearlyPrice
                      : isInternational
                        ? (plan as any).originalPriceUSD
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
                              {isTeamPlan
                                ? "Built for teams"
                                : `For ${planId === "base" ? "higher limits" : "even higher AI limits"}`}
                            </p>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mb-6">
                              {isTeamPlan ? (
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                  Custom
                                </span>
                              ) : (
                                <>
                                  <span className="text-lg text-gray-400 dark:text-white/40 line-through">
                                    {isInternational ? "$" : "₹"}
                                    {isInternational
                                      ? originalPrice
                                      : formatPrice(originalPrice).replace(
                                          "₹",
                                          "",
                                        )}
                                  </span>
                                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {isInternational ? "$" : "₹"}
                                    {isInternational
                                      ? price
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
                                isTeamPlan
                                  ? handleContactSales()
                                  : handleSubscribe(planId)
                              }
                              disabled={
                                isLoading ||
                                (loadingPlan !== null &&
                                  loadingPlan !== planId) ||
                                (isCurrentPlan && !isTeamPlan)
                              }
                              className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 mb-6 ${
                                isCurrentPlan && !isTeamPlan
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                                  : plan.popular
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20"
                                    : "bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isCurrentPlan && !isTeamPlan ? (
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
                              ) : isTeamPlan ? (
                                "Contact Sales"
                              ) : (
                                `Upgrade to ${plan.name}`
                              )}
                            </button>

                            {/* Credits Info */}
                            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                              <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 mb-1">
                                <span className="text-lg font-semibold">
                                  {isTeamPlan
                                    ? "Custom Credits"
                                    : `${isYearly ? plan.credits * 12 : plan.credits} Credits / ${isYearly ? "year" : "month"}`}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-white/40">
                                {isTeamPlan
                                  ? "Unlimited messages"
                                  : `~${(isYearly ? plan.credits * 12 : plan.credits) * 2} Designs (${isYearly ? plan.credits * 12 : plan.credits}M tokens)`}
                              </p>
                            </div>

                            {/* INCLUDES Header */}
                            <p className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wider mb-3">
                              INCLUDES:
                            </p>

                            {/* Features */}
                            <ul className="space-y-2.5 flex-grow">
                              {(isTeamPlan
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
