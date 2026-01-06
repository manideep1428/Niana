"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "@workos-inc/authkit-nextjs";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  LayoutDashboard,
  Moon,
  Sun,
  CreditCard,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Progress } from "@/components/ui/progress";
import {
  TOKENS_PER_CREDIT,
  tokensToCredits,
  SUBSCRIPTION_PLANS,
} from "@/lib/razorpay";

export default function TopBar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Fetch subscription for credits display in dropdown
  const subscription = useQuery(
    api.quires.getUserSubscription,
    user ? { user_id: user.id } : "skip"
  );

  // Calculate start of current month for Figma usage
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Fetch Figma usage count for current month
  const figmaUsage = useQuery(
    api.figma.getFigmaUserCount,
    user ? { user_id: user.id, since: startOfMonth } : "skip"
  );

  // Credit calculations
  const isFree = !subscription || subscription.plan === "free";
  const totalTokens = subscription?.tokens_total ?? TOKENS_PER_CREDIT;
  const usedTokens = subscription?.tokens_used ?? 0;
  const remainingTokens = Math.max(0, totalTokens - usedTokens);
  const creditsRemaining = tokensToCredits(remainingTokens);
  const creditsTotal = tokensToCredits(totalTokens);
  const usagePercent = Math.min(100, (usedTokens / totalTokens) * 100);
  const isLowBalance = creditsRemaining < 1;
  const formatCredits = (credits: number) => credits.toFixed(2);

  // Figma export calculations
  const planKey = (subscription?.plan ||
    "free") as keyof typeof SUBSCRIPTION_PLANS;
  const figmaLimit = SUBSCRIPTION_PLANS[planKey]?.figmaLimit ?? 1;
  const figmaUsed = figmaUsage ?? 0;
  const figmaRemaining = Math.max(0, figmaLimit - figmaUsed);
  const figmaUsagePercent = Math.min(100, (figmaUsed / figmaLimit) * 100);
  const isLowFigma = figmaRemaining === 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="mx-auto max-w-7xl">
        {/* Liquid glass effect - light/dark adaptive */}
        <div className="relative rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-6 py-3 shadow-lg backdrop-blur-xl transition-all hover:bg-white/70 dark:hover:bg-black/30 before:absolute before:inset-0 before:rounded-2xl before:bg-linear-to-b before:from-white/20 before:to-transparent before:pointer-events-none dark:before:from-white/5">
          <div className="flex items-center justify-between relative">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <h1 className="text-lg font-sans tracking-tight bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Niana
                </h1>
              </Link>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">My Projects</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="h-9 w-9 rounded-lg text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className="rounded-full ring-2 ring-black/10 dark:ring-white/10 transition-all hover:ring-black/30 dark:hover:ring-white/30 hover:scale-105 active:scale-95">
                        <Avatar className="h-9 w-9 cursor-pointer border border-black/10 dark:border-white/10">
                          <AvatarImage
                            src={user?.profilePictureUrl || ""}
                            alt={user?.firstName || "User"}
                          />
                          <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-500 text-xs text-white">
                            {user?.firstName?.charAt(0) ||
                              user?.email?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/80 px-2 py-2 text-black/90 dark:text-white/90 backdrop-blur-xl"
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-black dark:text-white">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs leading-none text-black/50 dark:text-white/50">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>

                      {/* Usage Section - Credits & Figma */}
                      <div className="mx-1 my-2 p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-3">
                        {/* Plan Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-black/70 dark:text-white/70">
                            Current Plan
                          </span>
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              isFree
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {subscription?.plan?.toUpperCase() || "FREE"}
                          </span>
                        </div>

                        {/* Credits */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <Coins
                                className={`w-3.5 h-3.5 ${isLowBalance ? "text-red-500" : "text-amber-500"}`}
                              />
                              <span className="text-xs text-black/60 dark:text-white/60">
                                Credits
                              </span>
                            </div>
                            <span
                              className={`text-xs font-semibold ${isLowBalance ? "text-red-500" : "text-black dark:text-white"}`}
                            >
                              {formatCredits(creditsRemaining)} /{" "}
                              {formatCredits(creditsTotal)}
                            </span>
                          </div>
                          <Progress value={usagePercent} className="h-1" />
                        </div>

                        {/* Figma Exports */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <svg
                                className={`w-3.5 h-3.5 ${isLowFigma ? "text-red-500" : "text-purple-500"}`}
                                viewBox="0 0 15 15"
                                fill="currentColor"
                              >
                                <path d="M3.75 7.5C2.71447 7.5 1.875 8.33947 1.875 9.375C1.875 10.4105 2.71447 11.25 3.75 11.25H5.625V7.5H3.75Z" />
                                <path d="M3.75 3.75C2.71447 3.75 1.875 4.58947 1.875 5.625C1.875 6.66053 2.71447 7.5 3.75 7.5H5.625V3.75H3.75Z" />
                                <path d="M5.625 3.75V7.5H7.5V5.625C7.5 4.58947 6.66053 3.75 5.625 3.75Z" />
                                <path d="M5.625 11.25H7.5V7.5H5.625V11.25Z" />
                                <path d="M9.375 7.5C10.4105 7.5 11.25 8.33947 11.25 7.5C11.25 6.46053 10.4105 5.625 9.375 5.625C8.33947 5.625 7.5 6.46053 7.5 7.5C7.5 8.53947 8.33947 9.375 9.375 9.375Z" />
                              </svg>
                              <span className="text-xs text-black/60 dark:text-white/60">
                                Figma Exports
                              </span>
                            </div>
                            <span
                              className={`text-xs font-semibold ${isLowFigma ? "text-red-500" : "text-black dark:text-white"}`}
                            >
                              {figmaRemaining} / {figmaLimit}
                            </span>
                          </div>
                          <Progress value={figmaUsagePercent} className="h-1" />
                          {isLowFigma && (
                            <p className="text-[10px] text-red-500 mt-1">
                              No exports remaining this month
                            </p>
                          )}
                        </div>
                      </div>

                      <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          My Projects
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/pricing"
                          className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {isLowBalance ? "Refill Credits" : "Manage Plan"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-red-500 dark:text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-300"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/pricing"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/sign-in"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black transition-transform hover:scale-105 active:scale-95"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
