"use client";

import React, { useRef, useState, useCallback, ChangeEvent } from "react";
import { Textarea } from "./ui/textarea";
import { Paperclip, Plus, Sparkles, MessageSquare } from "lucide-react";
import PromptSubmit from "./prompt-submit";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PreviewAttachment, type Attachment } from "./preview-attachment";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Allowed file types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PromptInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    attachments: Attachment[]
  ) => void;
  // Visual edits props
  activeTab?: "chat" | "design";
  onTabChange?: (tab: "chat" | "design") => void;
  hasSelectedElement?: boolean;
}

export function PromptInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  activeTab = "chat",
  onTabChange,
  hasSelectedElement,
}: PromptInputProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.mutations.generateUploadUrl);
  const saveFile = useMutation(api.mutations.saveFile);
  const deleteFile = useMutation(api.mutations.deleteFile);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported file type. Allowed: images, PDF, Word documents.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is too large. Maximum size is 10MB.`;
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<Attachment | undefined> => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return undefined;
      }

      try {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error("Upload failed");
        }

        const { storageId } = await result.json();

        // Save file metadata and get URL
        const fileData = await saveFile({
          storageId,
          name: file.name,
          contentType: file.type,
        });

        return {
          name: fileData.name,
          url: fileData.url,
          contentType: fileData.contentType,
          storageId: fileData.storageId,
        };
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(`Failed to upload "${file.name}"`);
        return undefined;
      }
    },
    [generateUploadUrl, saveFile, validateFile]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Check max files limit
      const remainingSlots = MAX_FILES - attachments.length;
      if (files.length > remainingSlots) {
        toast.error(
          `You can only upload ${MAX_FILES} files. ${remainingSlots} slots remaining.`
        );
        files.splice(remainingSlots);
      }

      if (files.length === 0) return;

      setUploadQueue(files.map((f) => f.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const results = await Promise.all(uploadPromises);
        const successful = results.filter(
          (r): r is Attachment => r !== undefined
        );

        setAttachments((prev) => [...prev, ...successful]);
      } catch (err) {
        console.error("Error uploading files:", err);
      } finally {
        setUploadQueue([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [attachments.length, uploadFile]
  );

  const handleRemoveAttachment = useCallback(
    async (attachment: Attachment) => {
      setAttachments((prev) => prev.filter((a) => a.url !== attachment.url));

      // Delete from Convex storage if we have storageId
      if (attachment.storageId) {
        try {
          await deleteFile({ storageId: attachment.storageId as any });
        } catch (err) {
          console.error("Failed to delete file:", err);
        }
      }
    },
    [deleteFile]
  );

  // Handle paste for images
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) return;

      event.preventDefault();

      const remainingSlots = MAX_FILES - attachments.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      const filesToUpload = imageItems
        .slice(0, remainingSlots)
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);

      if (filesToUpload.length === 0) return;

      setUploadQueue(filesToUpload.map((f) => f.name || "Pasted image"));

      try {
        const results = await Promise.all(filesToUpload.map(uploadFile));
        const successful = results.filter(
          (r): r is Attachment => r !== undefined
        );
        setAttachments((prev) => [...prev, ...successful]);
      } catch (err) {
        console.error("Error uploading pasted images:", err);
      } finally {
        setUploadQueue([]);
      }
    },
    [attachments.length, uploadFile]
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const remainingSlots = MAX_FILES - attachments.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      const filesToUpload = files.slice(0, remainingSlots);
      setUploadQueue(filesToUpload.map((f) => f.name));

      try {
        const results = await Promise.all(filesToUpload.map(uploadFile));
        const successful = results.filter(
          (r): r is Attachment => r !== undefined
        );
        setAttachments((prev) => [...prev, ...successful]);
      } catch (err) {
        console.error("Error uploading dropped files:", err);
      } finally {
        setUploadQueue([]);
      }
    },
    [attachments.length, uploadFile]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() || attachments.length > 0) {
      toast.success("Message sent!");
      onSubmit(e, attachments);
      setAttachments([]);
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = inputContainerRef.current?.closest("form");
    if (form) {
      form.requestSubmit();
    }
  };

  const isUploading = uploadQueue.length > 0;
  const canAttach =
    attachments.length < MAX_FILES && !isLoading && !isUploading;

  return (
    <div className="p-4 pt-0">
      <form onSubmit={handleSubmit}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          ref={inputContainerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative bg-card rounded-3xl border-2 transition-all duration-200
            ${isFocused ? "border-primary/60 shadow-lg shadow-primary/20 ring-2 ring-primary/10" : "border-border shadow-sm"}
            ${isDragging ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10" : ""}
          `}
        >
          {/* Attachments preview */}
          {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div className="flex flex-row items-center gap-2 overflow-x-auto p-3 pb-0">
              {attachments.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                  onRemove={() => handleRemoveAttachment(attachment)}
                />
              ))}
              {uploadQueue.map((filename) => (
                <PreviewAttachment
                  key={filename}
                  attachment={{ url: "", name: filename, contentType: "" }}
                  isUploading
                />
              ))}
            </div>
          )}

          <div className="p-3">
            <Textarea
              ref={textareaRef}
              name="content"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={handlePaste}
              placeholder={isDragging ? "Drop files here..." : "Ask Niana..."}
              className="w-full bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[60px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent focus:outline-none dark:bg-transparent focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() || attachments.length > 0) {
                    const form = e.currentTarget.form;
                    if (form) form.requestSubmit();
                  }
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              {/* Add/Attach button */}
              <button
                type="button"
                disabled={!canAttach}
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-lg border border-border hover:border-primary flex items-center justify-center transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Visual edits button - only show in chat mode */}
              {onTabChange && activeTab === "chat" && (
                <button
                  type="button"
                  onClick={() => onTabChange("design")}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs flex items-center gap-2 transition-all",
                    hasSelectedElement
                      ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                      : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Visual edits</span>
                </button>
              )}

              {/* Chat button - only show in design mode */}
              {onTabChange && activeTab === "design" && (
                <button
                  type="button"
                  onClick={() => onTabChange("chat")}
                  className="h-8 px-3 rounded-lg text-xs flex items-center gap-2 transition-all border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              )}
            </div>

            <PromptSubmit
              status={isLoading ? "loading" : "streaming"}
              onSubmit={handleButtonClick}
              className="bg-linear-to-r from-primary/60 to-primary/40 hover:from-primary/70 hover:to-primary/50 text-primary-foreground h-8 w-8 rounded-lg transition-colors shadow-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
