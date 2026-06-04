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
  Smartphone,
  Monitor,
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
  const [projectType, setProjectType] = useState<"mobile" | "web">("mobile");

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
          <input type="hidden" name="type" value={projectType} />

          <div
            ref={inputContainerRef}
            onDrop={handleDrop}
            className={`
                relative flex flex-col min-h-[140px] rounded-2xl border transition-all duration-300
                bg-white/90 dark:bg-[#0c0c0e]/85 backdrop-blur-xl shadow-2xl dark:shadow-black/60
                ${isFocused ? "border-primary/50 dark:border-primary/40 ring-4 ring-primary/5" : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/15"}
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

            <div className="flex-1 p-5">
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
                      : projectType === "web"
                        ? "Describe your website or desktop app..."
                        : "Describe your mobile app..."
                  }
                  className="w-full text-lg sm:text-xl font-normal bg-transparent dark:bg-transparent border-none text-foreground placeholder:text-muted-foreground/35 resize-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none min-h-[80px] max-h-[200px] scrollbar-none"
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

            <div className="flex items-center justify-between px-5 pb-5 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canAttach}
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
                  title="Attach files"
                >
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/15 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200">
                    <Paperclip className="w-4 h-4" />
                  </div>
                </button>

                <div className="w-px h-5 bg-zinc-200 dark:bg-white/10 mx-1.5" />

                <button
                  type="button"
                  onClick={() =>
                    setProjectType(projectType === "mobile" ? "web" : "mobile")
                  }
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer",
                    projectType === "web"
                      ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                      : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-200",
                  )}
                  title={
                    projectType === "mobile"
                      ? "Switch to Web"
                      : "Switch to Mobile"
                  }
                >
                  {projectType === "web" ? (
                    <span className="flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" />
                      Web
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer",
                    isPublic
                      ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                      : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-200",
                  )}
                  title={isPublic ? "Switch to Private" : "Switch to Public"}
                >
                  {isPublic ? (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
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
                  "flex items-center gap-1.5 px-6 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform active:scale-95 shadow-sm active:translate-y-[1px] cursor-pointer",
                  isLoading
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-transparent"
                    : "bg-gradient-to-r from-primary to-[#FF7B54] hover:brightness-110 text-white hover:shadow-md hover:shadow-primary/15 border-b border-[#E56A40]/30",
                )}
              >
                {isLoading ? (
                  isResponding ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Dreaming...</span>
                    </>
                  )
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
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
            relative rounded-xl border transition-all duration-200
            bg-[#ffffff] dark:bg-[#0c0c0e]
            ${isFocused ? "border-primary/60 dark:border-primary/40 shadow-sm ring-1 ring-primary/10" : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/15"}
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

          <div className="p-2.5">
            <ScrollArea className="max-h-[160px] w-full">
              <Textarea
                ref={textareaRef}
                name="content"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onPaste={handlePaste}
                placeholder={isDragging ? "Drop files here..." : "Ask Niana..."}
                className="w-full bg-transparent dark:bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[40px] max-h-[160px] focus:outline-none focus:border-none focus:ring-0 shadow-none scrollbar-none"
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

          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!canAttach}
                onClick={() => fileInputRef.current?.click()}
                className="h-7 w-7 rounded-md border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors disabled:opacity-50 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {onTabChange && activeTab === "chat" && (
                <button
                  type="button"
                  onClick={() => toast.info("Visual Edit Coming Soon")}
                  className={cn(
                    "h-7 px-2.5 rounded-md text-[11px] flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer",
                  )}
                >
                  <SquareDashedMousePointer className="w-3 h-3" />
                  <span>Visual edits</span>
                </button>
              )}

              {onTabChange && activeTab === "design" && (
                <button
                  type="button"
                  onClick={() => onTabChange("chat")}
                  className="h-7 px-2.5 rounded-md text-[11px] flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Chat</span>
                </button>
              )}
            </div>

            <PromptSubmit
              status={isLoading ? "loading" : "streaming"}
              onSubmit={handleButtonClick}
              onStop={onStop}
              isResponding={isResponding}
              className="bg-primary hover:bg-primary/95 text-white h-7 w-7 rounded-md transition-colors shadow-sm cursor-pointer flex items-center justify-center"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
