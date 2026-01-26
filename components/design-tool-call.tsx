"use client";

import { memo } from "react";
import { FileCode2, Check, Loader2 } from "lucide-react";
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
        "flex w-full cursor-pointer flex-row items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        status === "completed"
          ? "bg-background hover:bg-accent border-border"
          : "bg-muted/50 border-border/50",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className={cn(
            "text-muted-foreground",
            status === "completed" && "text-orange-500",
          )}
        >
          <FileCode2 className="w-4 h-4" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">
            {status === "creating" ? (
              <span className="flex items-center gap-0.5">
                Generating screen
                <span className="animate-pulse tracking-widest">...</span>
              </span>
            ) : (
              "Generated screen"
            )}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0",
          status === "completed" ? "text-orange-500" : "text-muted-foreground",
        )}
      >
        {status === "creating" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </div>
    </button>
  );
}

export const DesignToolCall = memo(PureDesignToolCall);
