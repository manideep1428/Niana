"use client";

import { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Sparkles, Check, AlertTriangle, Loader2 } from "lucide-react";
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
  type?: "mobile" | "web";
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

  // Show skeleton when streaming; show iframe when content is ready and not streaming
  const hasValidContent = content && content.length > 100;
  const showSkeleton = isStreaming ? true : !hasValidContent;

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
        offset={16}
        className="transition-opacity duration-300"
      >
        <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-zinc-900/90 backdrop-blur-xl rounded-full shadow-xl border border-white/10 text-white animate-in slide-in-from-bottom-2 fade-in duration-300 scale-90 hover:scale-95 transition-transform origin-bottom">
          <span
            className="px-1.5 sm:px-2 text-[9px] sm:text-[11px] font-medium text-zinc-200 max-w-[80px] sm:max-w-[100px] truncate cursor-default select-none"
            title={title}
          >
            {title}
          </span>
          <div className="w-px h-2 sm:h-3 bg-white/10 mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGenerate}
            disabled={isStreaming}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Generate"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Button>

          <div className="w-px h-2 sm:h-3 bg-white/10 mx-0.5" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFigmaAction}
            disabled={isFigmaLoading || isStreaming || showSkeleton}
            className={cn(
              "h-6 sm:h-8 px-1.5 sm:px-2.5 gap-1 sm:gap-1.5 rounded-full font-medium text-[9px] sm:text-[10px] transition-all disabled:opacity-50",
              preparedFigmaData
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 border border-emerald-500/30"
                : "text-zinc-300 hover:bg-white/10 hover:text-white",
            )}
          >
            {isFigmaLoading ? (
              <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
            ) : figmaCopySuccess ? (
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
            ) : preparedFigmaData ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Copy</span>
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
            {!preparedFigmaData && (
              <span className="hidden sm:inline">
                {figmaCopySuccess ? "Copied" : "Figma"}
              </span>
            )}
          </Button>

          <div className="w-px h-2 sm:h-3 bg-white/10 mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full text-red-400/80 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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

      {/* Device Frame - Mobile vs Web */}
      {data.type === "web" ? (
        // WEB / DESKTOP FRAME
        <div
          className={cn(
            "relative transition-all duration-500 ease-out",
            selected ? "transform scale-[1.02]" : "",
          )}
        >
          {/* Glow Effect */}
          <div
            className={cn(
              "absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl transition-opacity duration-500",
              selected || isStreaming ? "opacity-100" : "opacity-0",
            )}
          />

          {/* Browser Window Frame */}
          <div
            className={cn(
              "relative rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all duration-300",
              selected &&
              "ring-2 ring-primary ring-offset-4 ring-offset-background",
            )}
            style={{ width: "1024px" }}
          >
            {/* Browser Toolbar */}
            <div className="h-9 bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                  {title}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div
              className="relative bg-white w-full"
              style={{ height: Math.max(600, iframeHeight) }}
            >
              <iframe
                ref={iframeRef}
                name={artifactId}
                srcDoc={contentWithScript} // Use contentWithScript here too
                className={cn(
                  "w-full h-full border-0 transition-opacity duration-500 bg-white",
                  showSkeleton ? "opacity-0" : "opacity-100",
                  isInteractive ? "pointer-events-auto" : "pointer-events-none",
                )}
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                title={title}
              />

              {/* Desktop Skeleton/Loading Logic */}
              {showSkeleton && (
                <div className="absolute inset-0 z-10 bg-zinc-950 flex flex-col">
                  {isStreaming ? (
                    // Supergent-style generating skeleton
                    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-8">
                      {/* Radial background glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_40%)]" />

                      {/* Shimmer sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_2.4s_ease-in-out_infinite] pointer-events-none" />

                      <div className="relative flex w-full max-w-xl flex-col items-center gap-8 text-center">
                        {/* Code skeleton card — supergent style */}
                        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-950/70 p-5 text-left shadow-2xl shadow-black">
                          <div className="mb-5 flex items-center gap-1.5">
                            <span className="size-3 rounded-full bg-zinc-700" />
                            <span className="size-3 rounded-full bg-zinc-700" />
                            <span className="size-3 rounded-full bg-zinc-700" />
                            <span className="ml-auto max-w-40 truncate font-mono text-xs text-zinc-400">
                              /{title.toLowerCase().replace(/\s+/g, "-") || "design"}.html
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="ml-10 h-4 w-40 rounded-full bg-zinc-700 animate-pulse" />
                            <div className="h-3 w-3 rounded-full bg-zinc-700 animate-pulse" />
                            <div className="ml-8 h-4 w-28 rounded-full bg-slate-500 animate-pulse" />
                            <div className="ml-12 h-4 w-20 rounded-full bg-zinc-500 animate-pulse" />
                            <div className="ml-12 h-4 w-24 rounded-full bg-zinc-500 animate-pulse" />
                            <div className="h-4 w-4 rounded-full bg-zinc-700 animate-pulse" />
                            <div className="flex items-center gap-2 pt-7">
                              <div className="h-4 w-12 rounded-full bg-teal-700 animate-pulse" />
                              <div className="h-4 w-24 rounded-full bg-slate-600 animate-pulse" />
                              <div className="h-4 w-4 rounded-full bg-zinc-700 animate-pulse" />
                            </div>
                          </div>
                        </div>

                        {/* Status text */}
                        <div className="space-y-2">
                          <h2 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2 justify-center">
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            Generating {title}
                          </h2>
                          <p className="text-sm text-zinc-500">
                            Building your design...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Empty state — same supergent code skeleton but static
                    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-8">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_38%)]" />
                      <div className="relative flex w-full max-w-xl flex-col items-center gap-8 text-center">
                        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-950/70 p-5 text-left shadow-2xl shadow-black">
                          <div className="mb-5 flex items-center gap-1.5">
                            <span className="size-3 rounded-full bg-zinc-700" />
                            <span className="size-3 rounded-full bg-zinc-700" />
                            <span className="size-3 rounded-full bg-zinc-700" />
                            <span className="ml-auto max-w-40 truncate font-mono text-xs text-zinc-400">
                              /{title.toLowerCase().replace(/\s+/g, "-") || "design"}.html
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="ml-10 h-4 w-40 rounded-full bg-zinc-700" />
                            <div className="h-3 w-3 rounded-full bg-zinc-700" />
                            <div className="ml-8 h-4 w-28 rounded-full bg-slate-500" />
                            <div className="ml-12 h-4 w-20 rounded-full bg-zinc-500" />
                            <div className="ml-12 h-4 w-24 rounded-full bg-zinc-500" />
                            <div className="h-4 w-4 rounded-full bg-zinc-700" />
                            <div className="flex items-center gap-2 pt-7">
                              <div className="h-4 w-12 rounded-full bg-teal-700" />
                              <div className="h-4 w-24 rounded-full bg-slate-600" />
                              <div className="h-4 w-4 rounded-full bg-zinc-700" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Ready to Design</h2>
                          <p className="text-sm text-zinc-500">Waiting for content generation...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // MOBILE FRAME (Titanium)
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
                    isInteractive
                      ? "pointer-events-auto"
                      : "pointer-events-none",
                  )}
                  sandbox="allow-scripts allow-same-origin"
                  scrolling="no"
                  title={title}
                />

                {/* Sophisticated Loading / Empty State Overlay */}
                {showSkeleton && (
                  <div className="absolute inset-0 z-10 bg-zinc-950 flex flex-col">
                    {isStreaming ? (
                      // Supergent-style generating skeleton for mobile
                      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_38%)]" />

                        {/* Shimmer sweep */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.05] to-transparent translate-y-[-100%] animate-[shimmerY_2.4s_ease-in-out_infinite] pointer-events-none" />

                        <div className="relative flex w-full flex-col items-center gap-6 text-center">
                          {/* Code skeleton card */}
                          <div className="w-full rounded-xl border border-white/10 bg-zinc-950/70 p-4 text-left shadow-2xl shadow-black">
                            <div className="mb-4 flex items-center gap-1.5">
                              <span className="size-2.5 rounded-full bg-zinc-700" />
                              <span className="size-2.5 rounded-full bg-zinc-700" />
                              <span className="size-2.5 rounded-full bg-zinc-700" />
                              <span className="ml-auto max-w-[130px] truncate font-mono text-[10px] text-zinc-400">
                                /{title.toLowerCase().replace(/\s+/g, "-") || "design"}.html
                              </span>
                            </div>
                            <div className="space-y-2.5">
                              <div className="ml-8 h-3.5 w-32 rounded-full bg-zinc-700 animate-pulse" />
                              <div className="h-3 w-3 rounded-full bg-zinc-700 animate-pulse" />
                              <div className="ml-6 h-3.5 w-24 rounded-full bg-slate-500 animate-pulse" />
                              <div className="ml-10 h-3.5 w-16 rounded-full bg-zinc-500 animate-pulse" />
                              <div className="ml-10 h-3.5 w-20 rounded-full bg-zinc-500 animate-pulse" />
                              <div className="h-3.5 w-3.5 rounded-full bg-zinc-700 animate-pulse" />
                              <div className="flex items-center gap-1.5 pt-4">
                                <div className="h-3.5 w-10 rounded-full bg-teal-700 animate-pulse" />
                                <div className="h-3.5 w-20 rounded-full bg-slate-600 animate-pulse" />
                                <div className="h-3.5 w-3 rounded-full bg-zinc-700 animate-pulse" />
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="space-y-1.5">
                            <h3 className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5 justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                              Generating {title}
                            </h3>
                            <p className="text-[11px] text-zinc-500">Building your design...</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Empty state
                      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_38%)]" />
                        <div className="relative flex w-full flex-col items-center gap-6 text-center">
                          <div className="w-full rounded-xl border border-white/10 bg-zinc-950/70 p-4 text-left shadow-2xl shadow-black">
                            <div className="mb-4 flex items-center gap-1.5">
                              <span className="size-2.5 rounded-full bg-zinc-700" />
                              <span className="size-2.5 rounded-full bg-zinc-700" />
                              <span className="size-2.5 rounded-full bg-zinc-700" />
                              <span className="ml-auto max-w-[130px] truncate font-mono text-[10px] text-zinc-400">
                                /{title.toLowerCase().replace(/\s+/g, "-") || "design"}.html
                              </span>
                            </div>
                            <div className="space-y-2.5">
                              <div className="ml-8 h-3.5 w-32 rounded-full bg-zinc-700" />
                              <div className="h-3 w-3 rounded-full bg-zinc-700" />
                              <div className="ml-6 h-3.5 w-24 rounded-full bg-slate-500" />
                              <div className="ml-10 h-3.5 w-16 rounded-full bg-zinc-500" />
                              <div className="ml-10 h-3.5 w-20 rounded-full bg-zinc-500" />
                              <div className="h-3.5 w-3.5 rounded-full bg-zinc-700" />
                              <div className="flex items-center gap-1.5 pt-4">
                                <div className="h-3.5 w-10 rounded-full bg-teal-700" />
                                <div className="h-3.5 w-20 rounded-full bg-slate-600" />
                                <div className="h-3.5 w-3 rounded-full bg-zinc-700" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Ready to Design</h3>
                            <p className="text-[11px] text-zinc-500">Waiting for content generation...</p>
                          </div>
                        </div>
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
      )}
    </div>
  );
}

export const DesignNode = memo(DesignNodeComponent);
