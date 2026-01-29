"use strict";
"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, AlertCircle } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { TOKENS_PER_CREDIT, tokensToCredits } from "@/lib/razorpay";

export function TokenUsageDisplay() {
  const { user } = useAuth();
  const subscription = useQuery(
    api.quires.getUserSubscription,
    user ? { user_id: user.id } : "skip", // Wait for user to be loaded
  );

  if (!user) return null;

  // Default to Free Plan logic if no subscription found
  // Free: Unlimited tokens (Republic Day Offer) - shown as -1
  const isFree = !subscription || subscription.plan === "free";
  const totalTokens = subscription?.tokens_total ?? TOKENS_PER_CREDIT; // 1 credit = 20k tokens
  const usedTokens = subscription?.tokens_used ?? 0;

  // Check if unlimited (Republic Day Offer)
  const isUnlimited = totalTokens === -1;
  const remainingTokens = isUnlimited
    ? -1
    : Math.max(0, totalTokens - usedTokens);

  // 1 Credit = 20,000 Output Tokens (show with 2 decimal places)
  const creditsRemaining = isUnlimited ? -1 : tokensToCredits(remainingTokens);
  const creditsTotal = isUnlimited ? -1 : tokensToCredits(totalTokens);
  const creditsUsed = tokensToCredits(usedTokens);
  const usagePercent = isUnlimited
    ? 0
    : Math.min(100, (usedTokens / totalTokens) * 100);

  const isLowBalance = !isUnlimited && creditsRemaining < 1;

  // Format credits to show 2 decimal places or "∞" for unlimited
  const formatCredits = (credits: number) =>
    credits === -1 ? "∞" : credits.toFixed(2);

  return (
    <HoverCard openDelay={0} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`px-3 gap-2 rounded-full border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ${
            isLowBalance
              ? "text-red-500 dark:text-red-400 border-red-200 bg-red-50 dark:bg-red-900/10"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span className="font-semibold">
            {formatCredits(creditsRemaining)}
          </span>
          <span className="text-xs opacity-70 hidden sm:inline">Credits</span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Credit Balance</h4>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isUnlimited
                  ? "bg-gradient-to-r from-orange-100 via-white to-green-100 text-gray-800 dark:from-orange-900/30 dark:via-gray-800 dark:to-green-900/30 dark:text-white border border-orange-300 dark:border-orange-500/30"
                  : isFree
                    ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {isUnlimited
                ? "🇮🇳 REPUBLIC OFFER"
                : subscription?.plan
                  ? subscription.plan.toUpperCase()
                  : "FREE"}
            </span>
          </div>

          {isUnlimited ? (
            <div className="rounded-md bg-gradient-to-r from-orange-50 via-white to-green-50 dark:from-orange-900/20 dark:via-gray-800 dark:to-green-900/20 p-3 border border-orange-300/30 dark:border-orange-500/20">
              <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                🎉 Unlimited Credits Active!
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Enjoy unlimited design generation for 5 days. No restrictions!
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                {creditsUsed.toFixed(2)} credits used so far
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCredits(creditsRemaining)} available</span>
                <span>{formatCredits(creditsTotal)} total</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {formatCredits(creditsUsed)} credits used (
                {usedTokens.toLocaleString()} tokens)
              </div>
            </div>
          )}

          {isLowBalance && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 flex gap-3 items-start">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-800 dark:text-red-300">
                  Running low on credits!
                </p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                  Upgrade your plan to continue generating designs without
                  interruption.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link href="/pricing" className="w-full block">
              <Button className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0">
                {isLowBalance ? "Refill Credits" : "Manage Plan"}
              </Button>
            </Link>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
