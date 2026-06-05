"use client";

import { memo } from "react";
import { Loader2, Check, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignToolCallProps {
  title: string;
  status: "creating" | "completed";
  onClick?: () => void;
}

function PureDesignToolCall({ title, status, onClick }: DesignToolCallProps) {
  const slug = title.toLowerCase().replace(/\s+/g, "-") || "design";

  return (
    <button
      className={cn(
        "group my-1 flex w-full cursor-pointer flex-col rounded-md border px-3 py-2.5 text-left font-mono text-xs overflow-hidden min-w-0 transition-colors duration-150",
        status === "completed"
          ? "border-white/10 bg-zinc-950/60 hover:bg-zinc-900/60 dark:bg-zinc-950/60"
          : "border-amber-500/20 bg-amber-950/10 dark:bg-amber-950/10 hover:bg-amber-950/20",
      )}
      onClick={onClick}
      type="button"
    >
      {/* Header row — icon + label + status */}
      <div className="flex items-center gap-2 text-zinc-300">
        <FileCode2 className="size-3.5 shrink-0 text-zinc-400" />
        <span className="font-semibold truncate text-zinc-200">
          {status === "creating" ? "Generating design" : "Design generated"}
        </span>
        <span className="ml-auto shrink-0">
          {status === "creating" ? (
            <Loader2 className="size-3.5 animate-spin text-zinc-400" />
          ) : (
            <Check className="size-3.5 text-emerald-400" />
          )}
        </span>
      </div>

      {/* Body */}
      <div className="mt-1.5 space-y-0.5 pl-5 text-zinc-400 break-all">
        {status === "creating" ? (
          <div className="text-amber-400/90">Writing {slug}.html…</div>
        ) : (
          <div
            className={cn(
              "truncate transition-colors",
              "text-zinc-300 group-hover:text-zinc-100",
            )}
          >
            {slug}.html
          </div>
        )}
      </div>
    </button>
  );
}

export const DesignToolCall = memo(PureDesignToolCall);
