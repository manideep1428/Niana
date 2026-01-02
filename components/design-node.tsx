"use client";

import { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Columns3, MoreVertical, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export interface DesignNodeData extends Record<string, unknown> {
  artifactId: string;
  title: string;
  content: string;
  isStreaming?: boolean;
  onDelete?: (artifactId: string) => void;
}

interface DesignNodeProps {
  data: DesignNodeData;
  selected?: boolean;
}

function DesignNodeComponent({ data, selected }: DesignNodeProps) {
  const { artifactId, title, content, onDelete } = data;
  const [iframeHeight, setIframeHeight] = useState(667);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Show skeleton only when there's no content
  const showSkeleton = !content;

  // Inject resize script into content
  const contentWithScript = content
    ? `${content}
    <script>
      function sendHeight() {
        try {
          const height = document.documentElement.scrollHeight;
          window.parent.postMessage({ type: 'resize', artifactId: '${artifactId}', height }, '*');
        } catch(e) {}
      }
      window.addEventListener('load', sendHeight);
      new ResizeObserver(sendHeight).observe(document.body);
    </script>`
    : "<html><body></body></html>";

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "resize" &&
        event.data?.artifactId === artifactId &&
        typeof event.data?.height === "number"
      ) {
        setIframeHeight(Math.max(667, event.data.height));
        setIsLoaded(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [artifactId]);

  // Reset loaded state when content changes
  useEffect(() => {
    if (content) {
      // Small delay to let iframe render
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsLoaded(false);
    }
  }, [content]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(artifactId);
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-transparent transition-all duration-200 cursor-grab active:cursor-grabbing">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-transparent/50 border-b relative">
        <span className="text-2xl font-medium truncate max-w-[200px]">
          {title || "Untitled Design"}
        </span>

        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-50 overflow-hidden pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Design
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden bg-transparent min-h-[667px]",
          selected
            ? "border-primary border-2 ring-2 ring-primary/20 shadow-xl"
            : "border-border hover:border-primary/50"
        )}
      >
        {/* Iframe Preview - always render but hide when no content */}
        <iframe
          srcDoc={contentWithScript}
          className={cn(
            "w-[375px] border-0 transition-all duration-300 block pointer-events-none",
            showSkeleton ? "opacity-0" : "opacity-100"
          )}
          style={{ height: iframeHeight }}
          sandbox="allow-scripts allow-same-origin"
          title={title}
        />

        {/* Skeleton Loader - Shows only when no content */}
        {showSkeleton && (
          <div className="absolute inset-0 z-10 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-full space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4">
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
              </div>
            </div>
          </div>
        )}

        {/* Overlay to allow dragging over iframe */}
        <div className="absolute inset-0 transparent" />
      </div>
    </div>
  );
}

export const DesignNode = memo(DesignNodeComponent);
