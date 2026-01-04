"use client";

import React from "react";
import { Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewYearBannerProps {
  className?: string;
}

export function NewYearBanner({ className }: NewYearBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-orange-500/20 bg-linear-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 p-3",
        className
      )}
    >
      {/* Animated sparkles background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-2 -right-2 h-16 w-16 animate-pulse rounded-full bg-orange-500/20 blur-xl" />
        <div
          className="absolute -bottom-2 -left-2 h-20 w-20 animate-pulse rounded-full bg-pink-500/20 blur-xl"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative flex items-center gap-3 text-left">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-pink-500 shadow-lg shadow-orange-500/20">
          <Gift className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-foreground">
              🎉 New Year Special!
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-orange-500">
              FREE Pro access
            </span>
          </p>
        </div>

        {/* Badge */}
        <div className="shrink-0 hidden sm:block">
          <div className="rounded-full bg-linear-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            24h Only
          </div>
        </div>
      </div>
    </div>
  );
}
