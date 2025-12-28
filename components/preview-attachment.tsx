"use client";

import { X, FileText, File, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

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
  if (contentType.startsWith("image/")) return null; // Will show image preview
  if (contentType === "application/pdf") return <FileText className="w-6 h-6 text-red-500" />;
  if (
    contentType === "application/msword" ||
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <FileText className="w-6 h-6 text-blue-500" />;
  }
  return <File className="w-6 h-6 text-muted-foreground" />;
}

function getFileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "" : "";
}

export function PreviewAttachment({
  attachment,
  isUploading = false,
  onRemove,
}: PreviewAttachmentProps) {
  const { name, url, contentType } = attachment;
  const isImage = contentType.startsWith("image/");
  const extension = getFileExtension(name);

  return (
    <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted flex-shrink-0">
      {isImage && url ? (
        <Image
          alt={name || "Attachment"}
          className="size-full object-cover"
          height={64}
          width={64}
          src={url}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 p-1">
          {getFileIcon(contentType)}
          <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">
            {extension}
          </span>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      )}

      {onRemove && !isUploading && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-1 -right-1 size-5 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
