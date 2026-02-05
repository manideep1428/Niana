"use client";

import { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Sparkles, Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NodeToolbar, Position } from "@xyflow/react";
import { convertHtmlToFigma } from "@/app/actions/figma";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export interface DesignNodeData extends Record<string, unknown> {
  artifactId: string;
  projectId: string; // Added for Figma export caching
  title: string;
  content: string;
  isStreaming?: boolean;
  isInteractive?: boolean;
  onDelete?: (artifactId: string) => void;
}

interface DesignNodeProps {
  data: DesignNodeData;
  selected?: boolean;
}

function DesignNodeComponent({ data, selected }: DesignNodeProps) {
  const {
    artifactId,
    projectId,
    title,
    content,
    onDelete,
    isInteractive,
    isStreaming,
  } = data;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(812);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [isFigmaLoading, setIsFigmaLoading] = useState(false);
  const [preparedFigmaData, setPreparedFigmaData] = useState<string | null>(
    null,
  );
  const [figmaCopySuccess, setFigmaCopySuccess] = useState(false);
  const clipboardDataRef = useRef<string | null>(null);

  // Show skeleton when no content, or streaming with insufficient content
  const hasValidContent = content && content.length > 100;
  const showSkeleton = !hasValidContent;

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (clipboardDataRef.current) {
        e.clipboardData?.setData("text/html", clipboardDataRef.current);
        e.preventDefault();
        clipboardDataRef.current = null;
        setFigmaCopySuccess(true);
        setTimeout(() => {
          setFigmaCopySuccess(false);
          setPreparedFigmaData(null); // Reset to initial state
        }, 2000);
      }
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  const handleFigmaAction = async () => {
    if (preparedFigmaData) {
      clipboardDataRef.current = preparedFigmaData;
      document.execCommand("copy");
      toast.success("Design copied! Paste in Figma (Cmd/Ctrl + V)");
      setPreparedFigmaData(null); // Reset
      return;
    }

    // Phase 1: Fetch content
    if (!content || isFigmaLoading) return;

    setIsFigmaLoading(true);
    try {
      const result = await convertHtmlToFigma(content, artifactId, projectId);

      if (result.success && result.data) {
        // Attempt direct async copy (Modern Browsers: Chrome, Edge, Safari 13.1+)
        try {
          if (
            typeof navigator !== "undefined" &&
            navigator.clipboard &&
            navigator.clipboard.write
          ) {
            // Create blobs for both HTML and Plain Text for maximum compatibility
            const blobHtml = new Blob([result.data], { type: "text/html" });
            const blobText = new Blob([result.data], { type: "text/plain" });

            const item = new ClipboardItem({
              "text/html": blobHtml,
              "text/plain": blobText,
            });

            await navigator.clipboard.write([item]);

            setFigmaCopySuccess(true);
            toast.success("Design copied! Paste in Figma (Cmd/Ctrl + V)");

            setTimeout(() => setFigmaCopySuccess(false), 2000);
            return; // Success!
          }
          throw new Error("Clipboard API unavailable");
        } catch (copyErr: any) {
          console.warn(
            "Async copy failed, falling back to manual copy:",
            copyErr,
          );

          // If the error is due to usage interaction (NotAllowedError), we MUST use the fallback
          setPreparedFigmaData(result.data);

          if (copyErr.name === "NotAllowedError") {
            toast.message("Click 'Copy Now' to finish", {
              description: "Browser blocked auto-copy. One more click needed!",
            });
          } else {
            toast.message("Design ready!", {
              description: "Click the button again to copy to clipboard.",
            });
          }
        }
      } else {
        console.error("Failed to convert:", result.error);
        // Check if the error is about plan limit
        if (result.error?.includes("Plan limit reached")) {
          toast.error("Figma Export Limit Reached", {
            description: result.error,
          });
        } else {
          toast.error("Failed to prepare design. Please try again.");
        }
      }
    } catch (err) {
      console.error("Copy handler error:", err);
      toast.error("An error occurred while preparing.");
    } finally {
      setIsFigmaLoading(false);
    }
  };

  const contentWithScript = content
    ? `${content}
    <style>
      /* Ensure html and body can expand to full height */
      html, body {
        min-height: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      
      #inspector-highlight {
        position: absolute;
        border: 2px solid #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
        pointer-events: none;
        z-index: 99999;
        display: none;
        transition: all 0.1s ease;
        box-sizing: border-box;
      }
    </style>
    <div id="inspector-highlight"></div>
    <script>
      (function() {
        let lastSentHeight = 0;
        let debounceTimer = null;
        
        // Resize logic - capture full document height with comprehensive measurements
        function calculateHeight() {
          try {
            const body = document.body;
            const html = document.documentElement;
            
            // Get all possible height measurements
            const heights = [
              body.scrollHeight,
              body.offsetHeight,
              body.clientHeight,
              html.scrollHeight,
              html.offsetHeight,
              html.clientHeight
            ];
            
            // Get the maximum height
            const maxHeight = Math.max(...heights);
            return Math.ceil(maxHeight);
          } catch(e) {
            console.error('Height calculation error:', e);
            return 0;
          }
        }
        
        function sendHeight() {
          const height = calculateHeight();
          
          // Only send if height has actually changed by more than 5px
          // This prevents feedback loops from observers
          if (Math.abs(height - lastSentHeight) > 5) {
            lastSentHeight = height;
            window.parent.postMessage({ 
              type: 'resize', 
              artifactId: '${artifactId}', 
              height 
            }, '*');
          }
        }
        
        // Debounced version for observers
        function debouncedSendHeight() {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(sendHeight, 100);
        }
        
        // Send height on load (immediate)
        window.addEventListener('load', sendHeight);
        
        // Send height on DOM ready (immediate)
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', sendHeight);
        } else {
          sendHeight();
        }
        
        // Send height on DOM changes (debounced)
        const resizeObserver = new ResizeObserver(debouncedSendHeight);
        resizeObserver.observe(document.body);
        
        // MutationObserver to catch DOM changes that might affect height (debounced)
        const mutationObserver = new MutationObserver(debouncedSendHeight);
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Initial delayed checks (immediate, not debounced)
        setTimeout(sendHeight, 100);
        setTimeout(sendHeight, 300);
        setTimeout(sendHeight, 500);

        // Initial delayed checks (immediate, not debounced)
        setTimeout(sendHeight, 100);
        setTimeout(sendHeight, 300);
        setTimeout(sendHeight, 500);
        
      })();
    </script>`
    : "<html><body></body></html>";

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.artifactId !== artifactId) return;

      if (event.data?.type === "resize") {
        setIframeHeight(Math.max(812, event.data.height));
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

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(artifactId);
    }
    setShowDeleteDialog(false);
  };

  // Handle Generate - Coming Soon
  const handleGenerate = () => {
    toast.info("Coming Soon!", {
      description: "AI-powered regeneration will be available soon.",
    });
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 cursor-grab active:cursor-grabbing rounded-[3rem] relative group",
        showSkeleton
          ? "bg-transparent scale-[0.98] opacity-90"
          : "hover:scale-[1.01]",
      )}
    >
      <NodeToolbar
        isVisible={selected || isStreaming || showMoreMenu}
        position={Position.Top}
        offset={24}
        className="transition-opacity duration-300"
      >
        <div className="flex items-center gap-1 p-1 bg-zinc-900/90 backdrop-blur-xl rounded-full shadow-xl border border-white/10 text-white animate-in slide-in-from-bottom-2 fade-in duration-300 scale-90 hover:scale-95 transition-transform origin-bottom">
          <span
            className="px-2 text-[11px] font-medium text-zinc-200 max-w-[100px] truncate cursor-default select-none"
            title={title}
          >
            {title}
          </span>
          <div className="w-px h-3 bg-white/10 mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGenerate}
            disabled={isStreaming}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Generate"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-3 bg-white/10 mx-0.5" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFigmaAction}
            disabled={isFigmaLoading || isStreaming || showSkeleton}
            className={cn(
              "h-8 px-2.5 gap-1.5 rounded-full font-medium text-[10px] transition-all disabled:opacity-50",
              preparedFigmaData
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 border border-emerald-500/30"
                : "text-zinc-300 hover:bg-white/10 hover:text-white",
            )}
          >
            {isFigmaLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : figmaCopySuccess ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : preparedFigmaData ? (
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                <span>Copy</span>
              </div>
            ) : (
              <Image
                src="/figma.svg"
                alt="Figma"
                width={12}
                height={12}
                className="opacity-80 group-hover:opacity-100 transition-opacity"
              />
            )}
            {!preparedFigmaData && (figmaCopySuccess ? "Copied" : "Figma")}
          </Button>

          <div className="w-px h-3 bg-white/10 mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="w-8 h-8 rounded-full text-red-400/80 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </NodeToolbar>

      {/* Delete Confirmation Dialog - Keeping existing structure but checking styles */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-md shadow-2xl backdrop-blur-md">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="space-y-1">
                <DialogTitle>Delete Design</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4 text-sm text-zinc-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">"{title}"</span>?
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-white/10 hover:bg-white/5 hover:text-white text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Delete Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Mobile Device Frame */}
      <div
        className={cn(
          "relative transition-all duration-500 ease-out",
          selected ? "transform scale-[1.02]" : "",
        )}
      >
        {/* Glow Effect behind device when selected/streaming */}
        <div
          className={cn(
            "absolute -inset-4 bg-primary/20 rounded-[3.5rem] blur-2xl transition-opacity duration-500",
            selected || isStreaming ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Device Frame - Titanium Finish */}
        <div
          className={cn(
            "relative rounded-[48px] p-[10px] transition-all duration-300",
            "bg-gradient-to-br from-[#4a4a4a] via-[#2a2a2a] to-[#1a1a1a]",
            "shadow-[0_0_2px_1px_rgba(255,255,255,0.1),0_20px_40px_-12px_rgba(0,0,0,0.8)]",
            selected &&
              "shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] scale-[1.02]",
          )}
        >
          {/* Hardware Buttons */}
          {/* Silent Switch */}
          <div className="absolute left-[-2px] top-[100px] w-[3px] h-[26px] bg-[#3a3a3a] rounded-l-md shadow-inner" />
          {/* Volume Up */}
          <div className="absolute left-[-2px] top-[144px] w-[3px] h-[48px] bg-[#3a3a3a] rounded-l-md shadow-inner" />
          {/* Volume Down */}
          <div className="absolute left-[-2px] top-[208px] w-[3px] h-[48px] bg-[#3a3a3a] rounded-l-md shadow-inner" />
          {/* Power Button */}
          <div className="absolute right-[-2px] top-[160px] w-[3px] h-[80px] bg-[#3a3a3a] rounded-r-md shadow-inner" />

          {/* Inner Bezel */}
          <div
            className={cn(
              "relative rounded-[38px] overflow-hidden bg-black",
              "border-[4px] border-black", // Physical bezel
              "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.1)]", // Inner reflective edge
            )}
          >
            {/* Dynamic Island Area Removed */}

            {/* Screen Content */}
            <div
              className="relative overflow-hidden bg-white w-[375px]"
              style={{ height: Math.max(812, iframeHeight) }}
            >
              {/* Iframe Preview */}
              <iframe
                ref={iframeRef}
                name={artifactId}
                srcDoc={contentWithScript}
                className={cn(
                  "w-full h-full border-0 transition-opacity duration-500 bg-white",
                  showSkeleton ? "opacity-0" : "opacity-100",
                  isInteractive ? "pointer-events-auto" : "pointer-events-none",
                )}
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                title={title}
              />

              {/* Sophisticated Loading / Empty State Overlay */}
              {!hasValidContent && (
                <div className="absolute inset-0 z-10 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
                  {isStreaming ? (
                    // High-Fidelity Skeleton Animation
                    <div className="w-full h-full relative overflow-hidden flex flex-col">
                      {/* Animated Shimmer Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] z-20 pointer-events-none" />

                      {/* Skeleton UI Structure - Top Bar */}
                      <div className="h-14 px-6 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 mt-8">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="w-32 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      </div>

                      {/* Skeleton UI - Body */}
                      <div className="p-6 space-y-8">
                        {/* Hero Card */}
                        <div className="w-full aspect-video rounded-2xl bg-zinc-200 dark:bg-zinc-800 shadow-sm" />

                        {/* List Items */}
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                              <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                              <div className="flex-1 space-y-2 py-1">
                                <div className="w-3/4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                <div className="w-1/2 h-4 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60" />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bottom Cards */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="aspect-[3/4] rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                          <div className="aspect-[3/4] rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                      </div>

                      {/* Status pill overlay */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 cursor-default select-none">
                        <div className="p-4 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg ring-1 ring-black/5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          Designing {title}...
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Empty State
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50 dark:bg-zinc-950">
                      <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6 shadow-inner">
                        <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                      </div>
                      <h3 className="text-zinc-900 dark:text-zinc-100 font-medium mb-1">
                        Ready to Design
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Waiting for content generation...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reflection Overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-transparent to-transparent pointer-events-none opacity-50 rounded-[38px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const DesignNode = memo(DesignNodeComponent);
