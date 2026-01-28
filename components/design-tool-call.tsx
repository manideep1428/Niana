"use client";

import { memo } from "react";
import { FileCode2, Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignToolCallProps {
  title: string;
  status: "creating" | "completed";
  onClick?: () => void;
}

function PureDesignToolCall({ title, status, onClick }: DesignToolCallProps) {
  return (
    <button
      className={cn(
        "group flex w-full cursor-pointer flex-row items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-all duration-200",
        status === "completed"
          ? "bg-muted/50 hover:bg-muted border-border hover:border-border/80"
          : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex flex-row items-center gap-3 overflow-hidden">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
            status === "completed"
              ? "bg-background border-border text-muted-foreground group-hover:text-foreground"
              : "bg-amber-500/10 border-amber-500/30 text-amber-500",
          )}
        >
          {status === "creating" ? (
            <Sparkles className="w-4 h-4 animate-pulse" />
          ) : (
            <FileCode2 className="w-4 h-4" />
          )}
        </div>

        <div className="flex flex-col text-left overflow-hidden">
          <span className="text-xs font-medium text-foreground truncate">
            {title}
          </span>
          <span className="text-[10px] text-muted-foreground truncate">
            {status === "creating" ? (
              <span className="flex items-center gap-1 text-amber-500">
                Generating screen
                <span className="flex gap-0.5">
                  <span className="animate-bounce delay-0">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              </span>
            ) : (
              "Generated screen"
            )}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 transition-opacity",
          status === "completed"
            ? "text-muted-foreground opacity-0 group-hover:opacity-100"
            : "text-amber-500 opacity-100",
        )}
      >
        {status === "creating" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
      </div>
    </button>
  );
}

export const DesignToolCall = memo(PureDesignToolCall);
