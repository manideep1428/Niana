"use client";

import { cn } from "@/lib/utils";
import { FileIcon, ExternalLink, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DesignPreviewProps {
  artifactId: string;
  title: string;
  isStreaming?: boolean;
  onClick?: (artifactId: string) => void;
}

// Skeleton component for loading state
function DesignPreviewSkeleton() {
  return (
    <div className="w-full max-w-[300px] rounded-xl border-2 border-primary/20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Animated header */}
      <div className="flex items-center gap-3 p-3 border-b border-primary/10">
        <div className="relative">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary/50 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Skeleton content area - mimics design generation */}
      <div className="p-3 space-y-3">
        {/* Hero image skeleton */}
        <Skeleton className="h-20 w-full rounded-lg" />

        {/* Content lines skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-4/5" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>

        {/* Button skeleton */}
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />

      {/* Generating indicator */}
      <div className="flex items-center justify-center gap-2 py-2 bg-primary/5 border-t border-primary/10">
        <div className="flex gap-1">
          <span
            className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-xs text-primary/70 font-medium">
          Creating design...
        </span>
      </div>
    </div>
  );
}

export function DesignPreview({
  artifactId,
  title,
  isStreaming,
  onClick,
}: DesignPreviewProps) {
  // Show skeleton while streaming/generating
  if (isStreaming) {
    return <DesignPreviewSkeleton />;
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(artifactId)}
      className={cn(
        "flex items-center gap-3 w-full max-w-[300px] p-3 rounded-xl border-2 transition-all duration-300",
        "bg-muted/50 hover:bg-muted hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
        "text-left group cursor-pointer animate-in fade-in-0 slide-in-from-bottom-2"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          "bg-primary/10 group-hover:bg-primary/20"
        )}
      >
        <FileIcon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{title}</span>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-xs text-muted-foreground">Click to view</span>
      </div>
    </button>
  );
}
