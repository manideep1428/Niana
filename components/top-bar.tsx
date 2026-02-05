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

  // Legacy fix: If plan is free but tokens_total is -1 (unlimited), force it to 40,000
  let totalTokens = subscription?.tokens_total ?? 40000;
  if (isFree && totalTokens === -1) {
    totalTokens = 40000;
  }
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
      className="fixed left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50"
      style={{ top: topOffset }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            {/* Assuming logo image is still wanted, otherwise just text */}
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Niana
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
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

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <>
              <Link href="/dashboard">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium px-6">
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
                  <div className="mx-1 my-2 p-3 rounded-lg bg-muted/50 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-bold text-foreground">
                        {subscription?.plan?.toUpperCase() || "FREE"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Credits</span>
                        <span>{formatCredits(creditsRemaining)}</span>
                      </div>
                      <Progress
                        value={usagePercent}
                        className="h-1 bg-border"
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
