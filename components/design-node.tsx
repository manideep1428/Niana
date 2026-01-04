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
  isInteractive?: boolean;
  onDelete?: (artifactId: string) => void;
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
    isInteractive,
    onElementSelect,
  } = data;
  // Default height for 6.1 inch diagonal phone (375 x 812px like iPhone 14)
  const [iframeHeight, setIframeHeight] = useState(812);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Show skeleton only when there's no content
  const showSkeleton = !content;

  // Inject inspector and resize script into content
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
            
            // Remove scripts that we injected (optional, but cleaner)
            // Ideally we should keep the user's scripts but remove our inspector script
            // For now, simpler to just return innerHTML of body/head excluding inspector
            
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
    <div
      className={cn(
        "transition-all duration-200 cursor-grab active:cursor-grabbing rounded-2xl",
        // Solid bg for skeleton, glass effect for generated design
        showSkeleton
          ? "bg-background border border-border shadow-lg"
          : "bg-transparent"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 border-b relative",
          showSkeleton ? "bg-muted/50 rounded-t-2xl" : "bg-transparent/50"
        )}
      >
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
          "relative overflow-hidden rounded-b-2xl",
          // Solid bg for skeleton, transparent for generated
          showSkeleton ? "bg-background" : "bg-transparent",
          selected
            ? "border-primary border-2 ring-2 ring-primary/20 shadow-xl"
            : "border-border hover:border-primary/50"
        )}
      >
        {/* Iframe Preview - always render but hide when no content */}
        <iframe
          name={artifactId}
          srcDoc={contentWithScript}
          className={cn(
            "w-[375px] border-0 transition-all duration-300 block",
            showSkeleton ? "opacity-0" : "opacity-100",
            // Enable pointer events when interactive, otherwise disable
            isInteractive ? "pointer-events-auto" : "pointer-events-none"
          )}
          style={{ height: iframeHeight }}
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
          title={title}
        />

        {/* Skeleton Loader - Shows only when no content */}
        {showSkeleton && (
          <div className="absolute inset-0 z-10 bg-background flex flex-col items-center justify-center p-6 space-y-4 min-h-[812px] w-[375px]">
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

        {/* Overlay to allow dragging over iframe. 
            When interactive, we hide this overlay or disable pointer events on it 
            so the iframe receives the events.
        */}
        <div
          className={cn(
            "absolute inset-0 transparent",
            isInteractive ? "pointer-events-none" : "pointer-events-auto"
          )}
        />
      </div>
    </div>
  );
}

export const DesignNode = memo(DesignNodeComponent);
