"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, AlertCircle, Zap } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
  TOKENS_PER_CREDIT,
  tokensToCredits,
  SUBSCRIPTION_PLANS,
} from "@/lib/razorpay";
import { cn } from "@/lib/utils";

interface TokenUsageDisplayProps {
  /** Compact mode for inline display (e.g. in design page header) */
  compact?: boolean;
}

export function TokenUsageDisplay({ compact = false }: TokenUsageDisplayProps) {
  const { user } = useAuth();
  const subscription = useQuery(
    api.quires.getUserSubscription,
    user ? { user_id: user.id } : "skip",
  );

  if (!user) return null;

  // Default to Free Plan logic if no subscription found
  const isFree = !subscription || subscription.plan === "free";

  // Use subscription tokens or default to 2 for free tier
  const totalTokens =
    isFree && subscription?.tokens_total === -1
      ? 2
      : (subscription?.tokens_total ?? 2);

  const usedTokens = subscription?.tokens_used ?? 0;

  // Check if unlimited (for paid plans with unlimited tokens)
  const isUnlimited = totalTokens === -1;
  const remainingTokens = isUnlimited
    ? -1
    : Math.max(0, totalTokens - usedTokens);

  // Credit calculations
  const creditsRemaining = isUnlimited ? -1 : tokensToCredits(remainingTokens);
  const creditsTotal = isUnlimited ? -1 : tokensToCredits(totalTokens);
  const creditsUsed = tokensToCredits(usedTokens);
  const usagePercent = isUnlimited
    ? 0
    : Math.min(100, (usedTokens / totalTokens) * 100);

  const isLowBalance = !isUnlimited && creditsRemaining < 1;
  const isExhausted = !isUnlimited && creditsRemaining <= 0;

  // Plan info
  const planKey = (subscription?.plan ||
    "free") as keyof typeof SUBSCRIPTION_PLANS;
  const planName = SUBSCRIPTION_PLANS[planKey]?.name || "Free";

  // Format credits
  const formatCredits = (credits: number) =>
    credits === -1
      ? "∞"
      : credits % 1 === 0
        ? credits.toString()
        : credits.toFixed(1);

  // ─── Compact mode: small inline badge for design page header ───
  if (compact) {
    return (
      <HoverCard openDelay={0} closeDelay={200}>
        <HoverCardTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all duration-200 shrink-0 cursor-pointer",
              isExhausted
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20"
                : isLowBalance
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20",
            )}
          >
            <Zap className="h-2.5 w-2.5" />
            <span>
              {formatCredits(creditsUsed)} / {formatCredits(creditsTotal)}
            </span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-72 p-4" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Credit Usage</h4>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  isFree
                    ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
                )}
              >
                {planName.toUpperCase()}
              </span>
            </div>

            {/* Used / Remaining / Total */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Used</p>
                <p className="text-sm font-bold text-foreground">
                  {formatCredits(creditsUsed)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p
                  className={cn(
                    "text-sm font-bold",
                    isExhausted
                      ? "text-red-500"
                      : isLowBalance
                        ? "text-amber-500"
                        : "text-emerald-500",
                  )}
                >
                  {formatCredits(creditsRemaining)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold text-foreground">
                  {formatCredits(creditsTotal)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Progress value={usagePercent} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground text-right">
                {Math.round(usagePercent)}% used
              </p>
            </div>

            {isLowBalance && (
              <Link href="/pricing" className="block">
                <Button
                  size="sm"
                  className="w-full text-xs bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
                >
                  {isExhausted ? "Get More Credits" : "Upgrade Plan"}
                </Button>
              </Link>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // ─── Full mode: button with hover card (sidebar / top bar) ───
  return (
    <HoverCard openDelay={0} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "px-3 gap-2 rounded-full border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
            isExhausted
              ? "text-red-500 dark:text-red-400 border-red-200 bg-red-50 dark:bg-red-900/10"
              : isLowBalance
                ? "text-amber-500 dark:text-amber-400 border-amber-200 bg-amber-50 dark:bg-amber-900/10"
                : "text-violet-600 dark:text-violet-400",
          )}
        >
          <Coins className="w-4 h-4" />
          <span className="font-semibold tabular-nums">
            {formatCredits(creditsUsed)}
            <span className="text-muted-foreground font-normal">/</span>
            {formatCredits(creditsTotal)}
          </span>
          <span className="text-xs opacity-70 hidden sm:inline">Credits</span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Credit Usage</h4>
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                isFree
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
              )}
            >
              {planName.toUpperCase()}
            </span>
          </div>

          {/* Three column stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Used
              </p>
              <p className="text-base font-bold tabular-nums text-foreground">
                {formatCredits(creditsUsed)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Remaining
              </p>
              <p
                className={cn(
                  "text-base font-bold tabular-nums",
                  isExhausted
                    ? "text-red-500"
                    : isLowBalance
                      ? "text-amber-500"
                      : "text-emerald-500",
                )}
              >
                {formatCredits(creditsRemaining)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Total
              </p>
              <p className="text-base font-bold tabular-nums text-foreground">
                {formatCredits(creditsTotal)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <Progress value={usagePercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(usagePercent)}% used</span>
              <span>{formatCredits(creditsRemaining)} remaining</span>
            </div>
          </div>

          {isLowBalance && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 flex gap-3 items-start border border-red-200/50 dark:border-red-800/30">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-800 dark:text-red-300">
                  {isExhausted
                    ? "Credits exhausted!"
                    : "Running low on credits!"}
                </p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                  {isExhausted
                    ? "You've used all your credits. Upgrade to continue generating."
                    : "Upgrade your plan to continue generating designs without interruption."}
                </p>
              </div>
            </div>
          )}

          <div className="pt-1">
            <Link href="/pricing" className="w-full block">
              <Button className="w-full bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0 shadow-sm">
                {isExhausted
                  ? "Get More Credits"
                  : isLowBalance
                    ? "Refill Credits"
                    : "Manage Plan"}
              </Button>
            </Link>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
