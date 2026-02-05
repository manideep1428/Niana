"use client";

import React, { useRef, useState, useCallback, ChangeEvent } from "react";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import {
  Paperclip,
  Plus,
  Sparkles,
  MessageSquare,
  SquareDashedMousePointer,
  Globe,
  Lock,
  Rocket,
} from "lucide-react";
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
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface PromptInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isResponding?: boolean;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    attachments: Attachment[],
  ) => void;
  onStop?: () => void;
  activeTab?: "chat" | "design";
  onTabChange?: (tab: "chat" | "design") => void;
  hasSelectedElement?: boolean;
  disable: boolean;
  variant?: "hero" | "chat";
}

export function PromptInput({
  input,
  setInput,
  onSubmit,
  onStop,
  isLoading,
  disable,
  isResponding = false,
  activeTab = "chat",
  onTabChange,
  variant = "chat",
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
    [generateUploadUrl, saveFile, validateFile],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Check max files limit
      const remainingSlots = MAX_FILES - attachments.length;
      if (files.length > remainingSlots) {
        toast.error(
          `You can only upload ${MAX_FILES} files. ${remainingSlots} slots remaining.`,
        );
        files.splice(remainingSlots);
      }

      if (files.length === 0) return;

      setUploadQueue(files.map((f) => f.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const results = await Promise.all(uploadPromises);
        const successful = results.filter(
          (r): r is Attachment => r !== undefined,
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
    [attachments.length, uploadFile],
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
    [deleteFile],
  );

  // Handle paste for images
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/"),
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
          (r): r is Attachment => r !== undefined,
        );
        setAttachments((prev) => [...prev, ...successful]);
      } catch (err) {
        console.error("Error uploading pasted images:", err);
      } finally {
        setUploadQueue([]);
      }
    },
    [attachments.length, uploadFile],
  );

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
          (r): r is Attachment => r !== undefined,
        );
        setAttachments((prev) => [...prev, ...successful]);
      } catch (err) {
        console.error("Error uploading dropped files:", err);
      } finally {
        setUploadQueue([]);
      }
    },
    [attachments.length, uploadFile],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() || attachments.length > 0) {
      // toast.success("Message sent!"); // Optional
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

  const [isPublic, setIsPublic] = useState(false); // Default to private

  if (variant === "hero") {
    return (
      <div className="relative w-full group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-500" />
        <form onSubmit={handleSubmit} className="relative w-full">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
          <input type="hidden" name="isPublic" value={String(isPublic)} />

          <div
            ref={inputContainerRef}
            onDrop={handleDrop}
            className={`
                relative flex flex-col min-h-[140px] rounded-[1.5rem] border transition-all duration-300
                bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-xl
                ${isFocused ? "border-primary/50 ring-4 ring-primary/10" : "border-white/20 dark:border-white/10 hover:border-primary/30"}
                ${isDragging ? "border-primary ring-4 ring-primary/10 scale-[1.01]" : ""}
              `}
          >
            {/* Attachments preview */}
            {(attachments.length > 0 || uploadQueue.length > 0) && (
              <div className="flex flex-row items-center gap-4 overflow-x-auto p-4 pb-0 scrollbar-none">
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

            <div className="flex-1 p-6">
              <ScrollArea className="max-h-[200px] w-full">
                <Textarea
                  ref={textareaRef}
                  name="content"
                  value={input}
                  disabled={disable}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onPaste={handlePaste}
                  placeholder={
                    isDragging
                      ? "Drop files here..."
                      : "Describe your dream app..."
                  }
                  className="w-full text-2xl sm:text-3xl font-medium bg-transparent dark:bg-transparent border-none text-foreground placeholder:text-muted-foreground/40 resize-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none min-h-[80px] max-h-[200px] scrollbar-none"
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
              </ScrollArea>
            </div>

            <div className="flex items-center justify-between px-6 pb-6 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canAttach}
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
                  title="Attach files"
                >
                  <div className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-border">
                    <Paperclip className="w-5 h-5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full transition-all duration-300 border shadow-sm cursor-pointer",
                    isPublic
                      ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                      : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground",
                  )}
                  title={isPublic ? "Switch to Private" : "Switch to Public"}
                >
                  {isPublic ? (
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Private
                    </span>
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading && !isResponding}
                onClick={handleButtonClick}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-primary/25 cursor-pointer",
                  isLoading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-gradient-to-r from-primary to-[#FF7B54] hover:brightness-110 text-white border-b-4 border-b-[#E56A40]/30 active:border-b-0 active:translate-y-[2px]",
                )}
              >
                {isLoading ? (
                  isResponding ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Dreaming...</span>
                    </>
                  )
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>Design</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // CHAT VARIANT (Default)
  return (
    <div className="p-4 pt-0 w-full">
      <form onSubmit={handleSubmit} className="w-full">
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
            relative rounded-3xl border transition-all duration-200
            file:bg-card bg-[#fffcfb] dark:bg-card
            ${isFocused ? "border-primary shadow-md ring-1 ring-primary/20" : "border-primary/20 shadow-sm hover:border-primary/50"}
            ${isDragging ? "border-primary bg-background shadow-md" : ""}
          `}
        >
          {/* Attachments preview */}
          {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div className="flex flex-row items-center gap-3 overflow-x-auto p-3 pb-2 scrollbar-none">
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
            <ScrollArea className="max-h-[200px] w-full">
              <Textarea
                ref={textareaRef}
                name="content"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onPaste={handlePaste}
                placeholder={isDragging ? "Drop files here..." : "Ask Niana..."}
                className="w-full bg-transparent dark:bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[44px] max-h-[200px] focus:outline-none focus:border-none focus:ring-0 shadow-none scrollbar-none"
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
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canAttach}
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-lg border border-border hover:border-primary flex items-center justify-center transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Plus className="w-4 h-4" />
              </button>

              {onTabChange && activeTab === "chat" && (
                <button
                  type="button"
                  onClick={() => toast.info("Visual Edit Coming Soon")}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs flex items-center gap-2 transition-all border border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <SquareDashedMousePointer className="w-3.5 h-3.5" />
                  <span>Visual edits</span>
                </button>
              )}

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
              onStop={onStop}
              isResponding={isResponding}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 rounded-lg transition-colors shadow-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
