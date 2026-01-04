"use client";

import { cn } from "@/lib/utils";

interface TokenUsageDisplayProps {
  tokensUsed: number;
  maxTokens: number;
  className?: string;
}

export function TokenUsageDisplay({
  tokensUsed,
  maxTokens,
  className,
}: TokenUsageDisplayProps) {
  const percentage = (tokensUsed / maxTokens) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        isAtLimit && "text-red-500",
        isNearLimit && !isAtLimit && "text-orange-500",
        className
      )}
    >
      <span>{tokensUsed.toLocaleString()}</span>
      <span>/</span>
      <span>{maxTokens.toLocaleString()}</span>
      <span className="opacity-60">{percentage.toFixed(0)}%</span>
    </div>
  );
}
