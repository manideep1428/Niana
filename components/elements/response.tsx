"use client";

import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        // Base styles
        "size-full",
        // First and last child margin handling
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        // Code styling
        "[&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        // Prose-like typography styling for markdown
        "[&_p]:leading-relaxed [&_p]:mb-3",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic [&_em]:text-muted-foreground",
        // Headings
        "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4",
        "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3",
        "[&_h3]:text-base [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-2",
        // Lists
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1",
        "[&_li]:leading-relaxed",
        // Horizontal rule
        "[&_hr]:my-4 [&_hr]:border-border [&_hr]:opacity-50",
        // Blockquote
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
