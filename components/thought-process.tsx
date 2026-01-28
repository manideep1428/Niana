"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThoughtProcessProps {
  thoughts: string;
  className?: string;
  defaultOpen?: boolean;
  isThinking?: boolean;
}

export function ThoughtProcess({
  thoughts,
  className,
  defaultOpen = false,
  isThinking = false,
}: ThoughtProcessProps) {
  // If thinking, we default to open to show the stream
  const [isOpen, setIsOpen] = useState(defaultOpen || isThinking);

  if (!thoughts && !isThinking) return null;

  return (
    <div className={cn("group/thought", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none w-fit"
      >
        <div
          className={cn(
            "flex items-center justify-center transition-colors duration-200",
            isOpen
              ? "text-primary"
              : "text-muted-foreground/40 group-hover/thought:text-primary/70",
            isThinking && "animate-pulse",
          )}
        >
          <Sparkles
            className={cn("w-3 h-3", isThinking && "animate-spin-slow")}
          />
        </div>
        <span className="font-medium">
          {isThinking ? "Thinking..." : "Thought for a few seconds"}
        </span>
        <ChevronRight
          className={cn(
            "w-3 h-3 transition-transform duration-200 opacity-50",
            isOpen ? "rotate-90" : "",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out font-mono text-xs overflow-hidden",
          isOpen
            ? "grid-rows-[1fr] opacity-100 mt-2"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 pl-[2px] border-l border-white/10 ml-[5px]">
          <div className="pl-3 py-1 text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
            {thoughts}
          </div>
        </div>
      </div>
    </div>
  );
}
