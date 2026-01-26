"use client";

import { memo } from "react";
import { FileCode2, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignToolResultProps {
  type: "create" | "update";
  result: { id: string; title: string };
  onClick?: () => void;
}

function PureDesignToolResult({
  type,
  result,
  onClick,
}: DesignToolResultProps) {
  return (
    <button
      className={cn(
        "flex w-fit cursor-pointer flex-row items-center gap-3 rounded-xl border bg-background px-3 py-2.5 transition-all duration-200",
        "hover:bg-accent hover:shadow-md hover:shadow-primary/10 hover:border-primary/50"
      )}
      onClick={onClick}
      type="button"
    >
      <div className="text-green-500">
        {type === "create" ? (
          <FileCode2 className="w-4 h-4" />
        ) : (
          <Pencil className="w-4 h-4" />
        )}
      </div>

      <div className="text-left text-sm">
        <span className="text-foreground">
          {type === "create" ? "Created" : "Updated"} "{result.title}"
        </span>
      </div>

      <div className="text-green-500">
        <Check className="w-4 h-4" />
      </div>
    </button>
  );
}

export const DesignToolResult = memo(PureDesignToolResult);
