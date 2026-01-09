"use client";

import { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Columns3,
  MoreVertical,
  Trash2,
  Sparkles,
  Pencil,
  MoreHorizontal,
  Check,
  Loader2,
  Figma,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  title: string;
  content: string;
  isStreaming?: boolean;
  isInteractive?: boolean;
  onDelete?: (artifactId: string) => void;
  onEnableEdit?: (artifactId: string) => void;
  onElementSelect?: (
    artifactId: string,
    elementInfo: {
      tagName: string;
      id?: string;
      className?: string;
      textContent?: string;
      styles: Record<string, string>;
      path: string[];
    }
  ) => void;
}

interface DesignNodeProps {
  data: DesignNodeData;
  selected?: boolean;
}

function DesignNodeComponent({ data, selected }: DesignNodeProps) {
  const {
    artifactId,
    title,
    content,
    onDelete,
    onEnableEdit,
    isInteractive,
    isStreaming,
    onElementSelect,
  } = data;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(812);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [isFigmaLoading, setIsFigmaLoading] = useState(false);
  const [preparedFigmaData, setPreparedFigmaData] = useState<string | null>(
    null
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
      const result = await convertHtmlToFigma(content, artifactId);

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
            copyErr
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

        // Inspector logic
        let isInteractive = ${isInteractive};
        const highlight = document.getElementById('inspector-highlight');
        let selectedEl = null;

        function getElementPath(el) {
          const path = [];
          while (el && el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
              selector += '#' + el.id;
            } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
              selector += '.' + el.className.trim().split(/\s+/).join('.');
            }
            path.unshift(selector);
            el = el.parentNode;
          }
          return path;
        }

        function getComputedStyles(el) {
          const s = window.getComputedStyle(el);
          return {
            color: s.color,
            backgroundColor: s.backgroundColor,
            margin: s.margin,
            marginTop: s.marginTop,
            marginRight: s.marginRight,
            marginBottom: s.marginBottom,
            marginLeft: s.marginLeft,
            padding: s.padding,
            paddingTop: s.paddingTop,
            paddingRight: s.paddingRight,
            paddingBottom: s.paddingBottom,
            paddingLeft: s.paddingLeft,
            fontSize: s.fontSize,
            fontWeight: s.fontWeight,
            textAlign: s.textAlign,
            display: s.display,
            width: s.width,
            height: s.height,
            borderRadius: s.borderRadius,
            borderWidth: s.borderWidth,
            borderColor: s.borderColor,
            borderStyle: s.borderStyle,
            opacity: s.opacity,
            flexDirection: s.flexDirection,
            justifyContent: s.justifyContent,
            alignItems: s.alignItems,
            gap: s.gap,
          };
        }

        function getAttributes(el) {
          const tag = el.tagName.toLowerCase();
          const attrs = {};
          
          // Common attributes
          if (el.id) attrs.id = el.id;
          if (el.className && typeof el.className === 'string') attrs.className = el.className;
          
          // Tag-specific attributes
          if (tag === 'input') {
            attrs.type = el.type || 'text';
            attrs.name = el.name || '';
            attrs.placeholder = el.placeholder || '';
            attrs.value = el.value || '';
            attrs.disabled = el.disabled;
            attrs.required = el.required;
          } else if (tag === 'img') {
            attrs.src = el.src || '';
            attrs.alt = el.alt || '';
          } else if (tag === 'a') {
            attrs.href = el.href || '';
            attrs.target = el.target || '';
          } else if (tag === 'button') {
            attrs.type = el.type || 'button';
            attrs.disabled = el.disabled;
          } else if (tag === 'textarea') {
            attrs.name = el.name || '';
            attrs.placeholder = el.placeholder || '';
            attrs.rows = el.rows;
            attrs.disabled = el.disabled;
          } else if (tag === 'select') {
            attrs.name = el.name || '';
            attrs.disabled = el.disabled;
          } else if (tag === 'label') {
            attrs.for = el.htmlFor || '';
          } else if (tag === 'i' || tag === 'span') {
            // Icon elements - check for font-awesome classes
            if (el.className && el.className.includes('fa-')) {
              attrs.iconClass = el.className;
            }
          }
          
          return attrs;
        }

        window.addEventListener('message', (event) => {
          if (event.data.type === 'setInteractive') {
            isInteractive = event.data.value;
            if (!isInteractive) {
              highlight.style.display = 'none';
            }
          } else if (event.data.type === 'updateStyle' && selectedEl) {
             selectedEl.style[event.data.property] = event.data.value;
             updateHighlight(selectedEl);
          } else if (event.data.type === 'updateContent' && selectedEl) {
             selectedEl.textContent = event.data.value;
             updateHighlight(selectedEl);
          } else if (event.data.type === 'updateAttribute' && selectedEl) {
             selectedEl.setAttribute(event.data.attribute, event.data.value);
          } else if (event.data.type === 'selectParent' && selectedEl) {
             if (selectedEl.parentElement && selectedEl.parentElement.tagName !== 'BODY') {
                selectedEl = selectedEl.parentElement;
                updateHighlight(selectedEl);
                notifySelection(selectedEl);
             }
          } else if (event.data.type === 'getHtml') {
            // Clean up inspector elements before sending
            const clone = document.documentElement.cloneNode(true);
            const inspectorDiv = clone.querySelector('#inspector-highlight');
            if (inspectorDiv) inspectorDiv.remove();
            
            window.parent.postMessage({
              type: 'returnHtml', 
              artifactId: '${artifactId}',
              html: clone.innerHTML
            }, '*');
          }
        });

        function updateHighlight(el) {
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          const computedStyle = window.getComputedStyle(el);

          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
          highlight.style.top = (rect.top + scrollTop) + 'px';
          highlight.style.left = (rect.left + scrollLeft) + 'px';
          highlight.style.display = 'block';
          
          // Match element's border-radius for proper outline on circles/pills
          highlight.style.borderRadius = computedStyle.borderRadius || '0px';
        }
        
        function notifySelection(el) {
          window.parent.postMessage({
            type: 'elementSelected',
            artifactId: '${artifactId}',
            elementInfo: {
              tagName: el.tagName.toLowerCase(),
              id: el.id,
              className: el.className,
              textContent: el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE 
                ? el.textContent.trim().substring(0, 100) 
                : '',
              styles: getComputedStyles(el),
              attributes: getAttributes(el),
              path: getElementPath(el)
            }
          }, '*');
        }

        document.addEventListener('mouseover', (e) => {
          if (!isInteractive) return;
          if (e.target === highlight || highlight.contains(e.target)) return;
          if (e.target.tagName === 'BODY' || e.target.tagName === 'HTML') return;
          
          updateHighlight(e.target);
        });

        document.addEventListener('click', (e) => {
          if (!isInteractive) return;
          if (e.target === highlight || highlight.contains(e.target)) return;
          
          e.preventDefault();
          e.stopPropagation();
          
          selectedEl = e.target;
          updateHighlight(selectedEl);
          notifySelection(selectedEl);
        }, true);

        window.addEventListener('scroll', () => {
          if (selectedEl && isInteractive) updateHighlight(selectedEl);
        });
        
      })();
    </script>`
    : "<html><body></body></html>";

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.artifactId !== artifactId) return;

      if (event.data?.type === "resize") {
        // Use actual height from content, with minimum height for 6.1 inch phone (812px)
        setIframeHeight(Math.max(812, event.data.height));
        setIsLoaded(true);
      } else if (event.data?.type === "elementSelected") {
        if (onElementSelect) {
          onElementSelect(artifactId, event.data.elementInfo);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [artifactId, onElementSelect]);

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
  // Handle Edit - Enable visual editor mode
  const handleEdit = () => {
    if (onEnableEdit) {
      onEnableEdit(artifactId);
    }
    // Also trigger a click in the iframe to select the first element
    if (iframeRef.current?.contentDocument?.body) {
      const firstElement = iframeRef.current.contentDocument.body.querySelector(
        "div, section, main, header, article"
      );
      if (firstElement) {
        (firstElement as HTMLElement).click();
      }
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-200 cursor-grab active:cursor-grabbing rounded-2xl relative group",
        showSkeleton
          ? "bg-background border border-border shadow-lg"
          : "bg-transparent"
      )}
    >
      <NodeToolbar
        isVisible={selected || isStreaming}
        position={Position.Top}
        offset={20}
      >
        <div className="flex items-center gap-1 p-1 bg-gray-900 rounded-xl shadow-xl border border-gray-800 text-white animate-in slide-in-from-bottom-2 fade-in duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={isStreaming}
            className="text-white hover:bg-white/10 hover:text-white h-8 px-2.5 gap-2 rounded-lg font-medium text-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            disabled={isStreaming || showSkeleton}
            className="text-white hover:bg-white/10 hover:text-white h-8 px-2.5 gap-2 rounded-lg font-medium text-xs disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFigmaAction}
            disabled={isFigmaLoading || isStreaming || showSkeleton}
            className={cn(
              "h-8 px-2.5 gap-2 rounded-lg font-medium text-xs transition-all disabled:opacity-50",
              preparedFigmaData
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 border border-green-500/50"
                : "text-white hover:bg-white/10 hover:text-white"
            )}
          >
            {isFigmaLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : figmaCopySuccess ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : preparedFigmaData ? (
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                <span>Copy Now</span>
              </div>
            ) : (
              <Image
                src="/figma.svg"
                alt="Figma"
                width={20}
                height={20}
                className="rounded"
              />
            )}
            {!preparedFigmaData && (figmaCopySuccess ? "Copied!" : "Figma")}
          </Button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-400 hover:bg-red-500/20 hover:text-red-300 h-8 px-2.5 gap-2 rounded-lg font-medium text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </NodeToolbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <DialogTitle>Delete Design</DialogTitle>
            </div>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">"{title}"</span>?
              <br />
              <br />
              <span className="text-red-400">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Device Frame */}
      <div className={cn("relative", selected ? "ring-4 ring-primary/30" : "")}>
        {/* Phone Frame - Outer Shell */}
        <div
          className={cn(
            "relative rounded-[50px] p-[12px] transition-all duration-300",
            // Device frame gradient - titanium look
            "bg-linear-to-br from-zinc-700 via-zinc-800 to-zinc-900",
            // Outer shadow for depth
            "shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_80px_-20px_rgba(0,0,0,0.3)]",
            selected &&
              "shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_100px_-20px_rgba(124,58,237,0.3)]"
          )}
        >
          {/* Side Buttons - Left (Silent Switch + Volume) */}
          <div className="absolute left-0 top-[100px] w-[3px] h-[28px] bg-zinc-600 rounded-l-sm shadow-inner" />
          <div className="absolute left-0 top-[140px] w-[3px] h-[50px] bg-zinc-600 rounded-l-sm shadow-inner" />
          <div className="absolute left-0 top-[200px] w-[3px] h-[50px] bg-zinc-600 rounded-l-sm shadow-inner" />

          {/* Side Button - Right (Power) */}
          <div className="absolute right-0 top-[160px] w-[3px] h-[70px] bg-zinc-600 rounded-r-sm shadow-inner" />

          {/* Inner Screen Bezel */}
          <div
            className={cn(
              "relative rounded-[40px] overflow-hidden",
              "bg-black",
              // Inner bezel shadow
              "shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]",
              selected ? "ring-2 ring-primary/50" : ""
            )}
          >
            {/* Dynamic Island / Notch */}
            {/* <div className="absolute top-[12px] left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-[6px]">
              <div className="bg-black rounded-full px-[20px] py-[10px] flex items-center gap-[10px] shadow-lg">
                <div className="w-[10px] h-[10px] rounded-full bg-zinc-800 ring-1 ring-zinc-700 flex items-center justify-center">
                  <div className="w-[4px] h-[4px] rounded-full bg-zinc-600" />
                </div>
                <div className="w-[50px] h-[6px] rounded-full bg-zinc-800" />
              </div>
            </div> */}

            {/* Screen Content Area */}
            <div className="relative overflow-hidden bg-black">
              {/* Iframe Preview */}
              <iframe
                ref={iframeRef}
                name={artifactId}
                srcDoc={contentWithScript}
                className={cn(
                  "w-[375px] border-0 transition-all duration-300 block",
                  showSkeleton ? "opacity-0" : "opacity-100",
                  isInteractive ? "pointer-events-auto" : "pointer-events-none"
                )}
                style={{ height: iframeHeight }}
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                title={title}
              />

              {/* Skeleton Loader / Streaming Indicator */}
              {showSkeleton && (
                <div className="absolute inset-0 z-10 bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-4 min-h-[812px] w-[375px]">
                  {isStreaming ? (
                    // Streaming indicator - show that content is being generated
                    <div className="w-full space-y-4 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-pink-400 via-purple-400 to-pink-400 flex items-center justify-center animate-pulse">
                        <span className="text-lg font-bold text-white">N</span>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium text-white">
                          Generating {title}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Building your design...
                        </p>
                      </div>
                      {/* Animated progress bar */}
                      <div className="w-full max-w-[200px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"
                          style={{
                            width: "60%",
                            animation: "shimmer 1.5s ease-in-out infinite",
                          }}
                        />
                      </div>
                      {/* Shimmer skeleton preview */}
                      <div className="w-full space-y-3 mt-4 opacity-50">
                        <div className="h-[100px] w-full rounded-lg bg-zinc-800 animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Static skeleton - waiting for content
                    <div className="w-full space-y-3">
                      <div className="h-[200px] w-full rounded-lg bg-zinc-800 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-4">
                        <div className="h-24 rounded-md bg-zinc-800 animate-pulse" />
                        <div className="h-24 rounded-md bg-zinc-800 animate-pulse" />
                        <div className="h-24 rounded-md bg-zinc-800 animate-pulse" />
                        <div className="h-24 rounded-md bg-zinc-800 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Overlay for dragging */}
              <div
                className={cn(
                  "absolute inset-0 transparent",
                  isInteractive ? "pointer-events-none" : "pointer-events-auto"
                )}
              />
            </div>

            {/* Home Indicator Bar */}
            <div className="absolute bottom-[8px] left-1/2 transform -translate-x-1/2 z-30">
              <div className="w-[134px] h-[5px] rounded-full bg-white/30" />
            </div>
          </div>

          {/* Screen Reflection Overlay */}
          <div className="absolute inset-[12px] rounded-[40px] pointer-events-none bg-linear-to-br from-white/5 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
}

export const DesignNode = memo(DesignNodeComponent);
