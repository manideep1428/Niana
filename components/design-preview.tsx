"use client";

import { cn } from "@/lib/utils";
import { FileIcon, ExternalLink, Loader2 } from "lucide-react";

interface DesignPreviewProps {
    artifactId: string;
    title: string;
    isStreaming?: boolean;
    onClick?: (artifactId: string) => void;
}

export function DesignPreview({
    artifactId,
    title,
    isStreaming,
    onClick,
}: DesignPreviewProps) {
    return (
        <button
            type="button"
            onClick={() => onClick?.(artifactId)}
            className={cn(
                "flex items-center gap-3 w-full max-w-[300px] p-3 rounded-xl border-2 transition-all duration-200",
                "bg-muted/50 hover:bg-muted hover:border-primary/50",
                "text-left group cursor-pointer"
            )}
        >
            <div
                className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    isStreaming ? "bg-primary/10" : "bg-primary/5"
                )}
            >
                {isStreaming ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                    <FileIcon className="w-5 h-5 text-primary" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs text-muted-foreground">
                    {isStreaming ? "Generating..." : "Click to view"}
                </span>
            </div>
        </button>
    );
}
