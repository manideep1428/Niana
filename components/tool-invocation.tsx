"use client";

import { memo } from "react";
import { FileCode2, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolInvocationProps {
  type: "createDesign" | "updateDesign";
  args: {
    id?: string;
    title?: string;
    content?: string;
  };
  result?: any;
  isLoading?: boolean;
}

function PureToolInvocation({
  type,
  args,
  result,
  isLoading = true,
}: ToolInvocationProps) {
  const isCreate = type === "createDesign";
  const title = args.title || args.id || "design";

  return (
    <div
      className={cn(
        "flex w-fit flex-row items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        isLoading
          ? "bg-muted/50 border-border/50"
          : "bg-background border-border"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className={cn(
            "text-muted-foreground",
            !isLoading && "text-green-500"
          )}
        >
          {isCreate ? (
            <FileCode2 className="w-4 h-4" />
          ) : (
            <Pencil className="w-4 h-4" />
          )}
        </div>

        <div className="text-left text-sm">
          {isLoading ? (
            <span className="text-muted-foreground">
              {isCreate ? "Creating" : "Updating"} "{title}"...
            </span>
          ) : (
            <span className="text-foreground">
              {isCreate ? "Created" : "Updated"} "{title}"
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "shrink-0",
          isLoading ? "text-muted-foreground" : "text-green-500"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        )}
      </div>
    </div>
  );
}

export const ToolInvocation = memo(PureToolInvocation);
