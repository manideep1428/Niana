"use client";

import { X, FileText, File, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
};

interface PreviewAttachmentProps {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/"))
    return <ImageIcon className="w-8 h-8 text-muted-foreground/50" />;
  if (contentType === "application/pdf")
    return <FileText className="w-8 h-8 text-red-500/80" />;
  if (
    contentType === "application/msword" ||
    contentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <FileText className="w-8 h-8 text-blue-500/80" />;
  }
  return <File className="w-8 h-8 text-orange-500/80" />;
}

export function PreviewAttachment({
  attachment,
  isUploading = false,
  onRemove,
}: PreviewAttachmentProps) {
  const { name, url, contentType } = attachment;

  // Determine if it's an image based on contentType or extension (for uploads)
  const isImage =
    contentType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  return (
    <div className="relative group flex flex-col items-center justify-center -mr-2 mt-2">
      {/* Button outside the container */}
      {onRemove && !isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "absolute -right-2 -top-2 z-50 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition-all hover:bg-destructive hover:text-white hover:border-destructive",
            "opacity-0 group-hover:opacity-100",
            "md:opacity-0 md:group-hover:opacity-100",
          )}
          title="Remove attachment"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background/50 shadow-sm transition-all",
          isImage
            ? "aspect-square size-20 items-center justify-center"
            : "h-20 w-52 items-center gap-3 px-3",
          isUploading && "opacity-80",
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-muted/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
            {/* Optional: Add a pulsing skeleton background if desired, but simple loader is often cleaner */}
            <div className="absolute inset-0 bg-muted/10 animate-pulse" />
          </div>
        ) : isImage && url ? (
          <Image
            alt={name || "Attachment"}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            height={80}
            width={80}
            src={url}
          />
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-center rounded-lg bg-muted/50 p-2">
              {getFileIcon(contentType)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <span className="truncate text-xs font-medium text-foreground/90">
                {name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {contentType.split("/")[1]?.toUpperCase() || "FILE"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
