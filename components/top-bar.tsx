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
import { toast } from "sonner";

interface TopBarProps {
  topOffset?: string;
}

export default function TopBar({ topOffset = "0" }: TopBarProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Fetch subscription for credits display in dropdown
  const subscription = useQuery(
    api.quires.getUserSubscription,
    user ? { user_id: user.id } : "skip",
  );

  // Calculate start of current month for Figma usage
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  // Fetch Figma usage count for current month
  const figmaUsage = useQuery(
    api.figma.getFigmaUserCount,
    user ? { user_id: user.id, since: startOfMonth } : "skip",
  );

  const isFree = !subscription || subscription.plan === "free";

  // Use subscription tokens or default to 2 for free tier
  // Force 2 credits if plan is free, even if legacy data shows -1 (unlimited)
  const totalTokens =
    isFree && subscription?.tokens_total === -1
      ? 2
      : (subscription?.tokens_total ?? 2);
  const usedTokens = subscription?.tokens_used ?? 0;

  // Check if unlimited (for paid plans with unlimited credits)
  const isUnlimited = totalTokens === -1;
  const remainingTokens = isUnlimited
    ? -1
    : Math.max(0, totalTokens - usedTokens);
  const creditsRemaining = isUnlimited ? -1 : tokensToCredits(remainingTokens);
  const creditsTotal = isUnlimited ? -1 : tokensToCredits(totalTokens);
  const usagePercent = isUnlimited
    ? 0
    : Math.min(100, (usedTokens / totalTokens) * 100);
  const isLowBalance = !isUnlimited && creditsRemaining < 1;
  const formatCredits = (credits: number) =>
    credits === -1 ? "∞" : credits.toFixed(2);

  const planKey = (subscription?.plan ||
    "free") as keyof typeof SUBSCRIPTION_PLANS;
  const figmaLimit: number = SUBSCRIPTION_PLANS[planKey]?.figmaLimit ?? 1;
  const figmaUsed = figmaUsage ?? 0;
  // Handle unlimited Figma exports (-1)
  const figmaRemaining =
    figmaLimit === -1 ? -1 : Math.max(0, figmaLimit - figmaUsed);
  const figmaUsagePercent =
    figmaLimit === -1 ? 0 : Math.min(100, (figmaUsed / figmaLimit) * 100);
  const isLowFigma = figmaLimit !== -1 && figmaRemaining === 0;

  const handleToast = () => {
    toast.info("Gallery is not available yet");
  };

  return (
    <header
      className="fixed left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-4 bg-background/80 backdrop-blur-md border-b border-border/50"
      style={{ top: topOffset }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-2">
            {/* Assuming logo image is still wanted, otherwise just text */}
            <div className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Niana
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Pricing
            </Link>
            <Link
              onClick={handleToast}
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Gallery
            </Link>
            <Link
              href="https://discord.gg/qVvadyJY"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent"
              target="_blank"
            >
              Discord
            </Link>
            <Link
              href="https://form.typeform.com/to/iHQORpVR"
              target="_blank"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer hover:bg-muted"
            >
              Join Niana
            </Link>
          </nav>
        </div>

        {/* Right Section - Compact on mobile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <>
              <Link href="/dashboard" className="hidden sm:block">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium px-4 sm:px-6 text-sm">
                  Your projects
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none ml-2">
                  <Avatar className="h-9 w-9 border border-border cursor-pointer transition-transform hover:scale-105">
                    <AvatarImage src={user?.profilePictureUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.firstName?.charAt(0) ||
                        user?.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-2 rounded-xl border border-border bg-card shadow-lg"
                >
                  {/* ... Keep the dropdown content essentially the same but simpler style ... */}
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  {/* Usage Stats simplified */}
                  <div className="mx-2 my-2 p-3 rounded-xl bg-secondary/30 dark:bg-secondary/10 border border-border/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Current Plan
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[10px] tracking-wide">
                        {subscription?.plan?.toUpperCase() || "FREE"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Coins className="w-3 h-3 text-amber-500" />
                          Credits
                        </span>
                        <span className="font-medium font-mono text-foreground/90">
                          {formatCredits(creditsRemaining)}
                        </span>
                      </div>
                      <Progress
                        value={usagePercent}
                        className="h-1.5 bg-primary/5 [&>div]:bg-gradient-to-r [&>div]:from-primary/60 [&>div]:to-primary"
                      />
                    </div>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> My Projects
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" /> Manage Plan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
