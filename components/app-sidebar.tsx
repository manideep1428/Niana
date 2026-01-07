"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PromptInput } from "./prompt-input";
import { DesignPreview } from "./design-preview";
import { Response } from "./elements/response";
import { cn } from "@/lib/utils";
import type { Attachment } from "./preview-attachment";
import Image from "next/image";
import {
  FileText,
  File,
  ArrowLeft,
  ArrowDown,
  Pencil,
  Square,
  Type,
  Save,
  Undo2,
  Redo2,
} from "lucide-react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VisualEditor, SelectedElement } from "./visual-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
  artifacts?: { id: string; title: string }[];
  attachments?: Attachment[];
}

interface PromptSidebarProps extends React.ComponentProps<typeof Sidebar> {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isMessagesLoading?: boolean;
  handleFormSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    attachments: Attachment[]
  ) => void;
  messages: Message[];
  onArtifactClick?: (artifactId: string) => void;

  // New props for Visual Editor
  activeTab: "chat" | "design";
  onTabChange: (tab: "chat" | "design") => void;
  selectedElement: SelectedElement | null;
  onUpdateStyle: (property: string, value: string) => void;
  onPreviewStyle?: (property: string, value: string) => void;
  onUpdateContent: (content: string) => void;
  onUpdateAttribute: (attribute: string, value: string) => void;
  onSelectParent: () => void;
  onSave: () => void;
  onCancel: () => void;
  hasUnsavedChanges: boolean;
}

// Sanitize text to remove any function call markers
function sanitizeText(text: string): string {
  return text
    .replace(/<has_function_call>/g, "")
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/g, "")
    .trim();
}

// Attachment display in messages (similar to nextjs-ai-chatbot)
function MessageAttachment({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.contentType?.startsWith("image/");

  if (isImage && attachment.url) {
    return (
      <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
        <Image
          src={attachment.url}
          alt={attachment.name || "Image attachment"}
          fill
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
          {attachment.name}
        </div>
      </div>
    );
  }

  const isPdf = attachment.contentType === "application/pdf";
  const isWord = attachment.contentType?.includes("word");

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative size-16 overflow-hidden rounded-lg border bg-muted flex flex-col items-center justify-center gap-1 hover:bg-accent transition-colors"
    >
      {isPdf ? (
        <FileText className="w-6 h-6 text-red-500" />
      ) : isWord ? (
        <FileText className="w-6 h-6 text-blue-500" />
      ) : (
        <File className="w-6 h-6 text-muted-foreground" />
      )}
      <div className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        {attachment.name}
      </div>
    </a>
  );
}

// Tag icon mapping for element display
const TAG_ICONS: Record<string, any> = {
  div: Square,
  span: Type,
  p: Type,
  h1: Type,
  h2: Type,
  h3: Type,
  h4: Type,
  h5: Type,
  h6: Type,
};

export function PromptSidebar({
  input,
  setInput,
  isLoading,
  isMessagesLoading,
  handleFormSubmit,
  messages,
  onArtifactClick,
  activeTab,
  onTabChange,
  selectedElement,
  onUpdateStyle,
  onPreviewStyle,
  onUpdateContent,
  onUpdateAttribute,
  onSelectParent,
  onSave,
  onCancel,
  hasUnsavedChanges,
  ...props
}: PromptSidebarProps) {
  const { user } = useAuth();
  
  // Use the scroll-to-bottom hook for auto-scroll during streaming
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
  } = useScrollToBottom();

  // Auto-switch to design tab when an element is selected
  React.useEffect(() => {
    if (selectedElement) {
      onTabChange("design");
    }
  }, [selectedElement, onTabChange]);

  const handleBackToChat = React.useCallback(() => {
    if (hasUnsavedChanges) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to go back to chat?"
        )
      ) {
        onCancel();
        onTabChange("chat");
      }
    } else {
      onTabChange("chat");
    }
  }, [hasUnsavedChanges, onCancel, onTabChange]);

  const TagIcon = selectedElement
    ? TAG_ICONS[selectedElement.tagName] || Square
    : Square;

  return (
    <Sidebar {...props}>
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <SidebarHeader className="border-b border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-400 via-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <h2 className="font-semibold bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Niana
            </h2>
          </div>

          {/* Design Mode Header with breadcrumb */}
          {activeTab === "design" && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleBackToChat}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Chat</span>
                </button>
              </div>

              {/* Design breadcrumb when element is selected */}
              {selectedElement && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Design</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-foreground font-medium">
                    Visual edits
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 ml-auto gap-1.5"
                    onClick={onSelectParent}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Select parent
                  </Button>
                </div>
              )}
            </>
          )}
        </SidebarHeader>

        {/* Content Area */}
        <SidebarContent className="p-0 overflow-hidden flex-1">
          {activeTab === "chat" ? (
            // Chat Content with auto-scroll
            <div className="relative h-full">
              <div
                className="absolute inset-0 touch-pan-y overflow-y-auto"
                ref={containerRef}
              >
                <div className="p-4 space-y-4">
                  {isMessagesLoading ? (
                    <div className="flex flex-col gap-3">
                      {[44, 32, 28, 64, 52].map((item, index) => (
                        <div key={index} className="flex gap-2 justify-start">
                          <div className="shrink-0 w-6 h-6 rounded-full bg-muted animate-pulse" />
                          <div
                            className="h-10 flex-1 rounded-2xl bg-muted animate-pulse"
                            style={{ maxWidth: `${item}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Start a conversation to create mobile UI designs
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-2",
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="shrink-0 w-6 h-6 rounded-full bg-linear-to-br from-pink-400 via-purple-400 to-pink-400 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                              N
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {/* Render attachments */}
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {message.attachments.map((attachment, i) => (
                                  <MessageAttachment
                                    key={i}
                                    attachment={attachment}
                                  />
                                ))}
                              </div>
                            )}
                          <div className="text-sm">
                            <Response>{sanitizeText(message.content)}</Response>
                          </div>
                          {/* Render artifact previews */}
                          {message.artifacts && message.artifacts.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.artifacts.map((artifact) => {
                                // Show streaming skeleton for artifacts in the last assistant message while loading
                                const isLastMessage =
                                  index === messages.length - 1;
                                const isArtifactStreaming =
                                  isLoading &&
                                  isLastMessage &&
                                  message.role === "assistant";

                                return (
                                  <DesignPreview
                                    key={artifact.id}
                                    artifactId={artifact.id}
                                    title={artifact.title}
                                    isStreaming={isArtifactStreaming}
                                    onClick={onArtifactClick}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {message.role === "user" && (
                          <Avatar className="w-6 h-6 shrink-0">
                            <AvatarImage
                              src={user?.profilePictureUrl || ""}
                              alt={user?.firstName || "User"}
                            />
                            <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-500 text-[10px] text-white">
                              {user?.firstName?.charAt(0) ||
                                user?.email?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-linear-to-br from-pink-400 via-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white animate-pulse">
                          N
                        </span>
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-2">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* End ref for scroll tracking */}
                  <div
                    className="min-h-[24px] min-w-[24px] shrink-0"
                    ref={endRef}
                  />
                </div>
              </div>

              {/* Scroll to bottom button */}
              <button
                aria-label="Scroll to bottom"
                className={`-translate-x-1/2 absolute bottom-4 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted ${
                  isAtBottom
                    ? "pointer-events-none scale-0 opacity-0"
                    : "pointer-events-auto scale-100 opacity-100"
                }`}
                onClick={() => scrollToBottom("smooth")}
                type="button"
              >
                <ArrowDown className="size-4" />
              </button>
            </div>
          ) : (
            // Design/Visual Editor Content
            <VisualEditor
              selectedElement={selectedElement}
              onUpdateStyle={onUpdateStyle}
              onPreviewStyle={onPreviewStyle}
              onUpdateContent={onUpdateContent}
              onUpdateAttribute={onUpdateAttribute}
              onSelectParent={onSelectParent}
              onSave={onSave}
              onCancel={onCancel}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          )}
        </SidebarContent>

        {/* Footer - Always show prompt input with visual edits buttons */}
        <SidebarFooter className="border-t border-white/5">
          <PromptInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSubmit={handleFormSubmit}
            activeTab={activeTab}
            onTabChange={onTabChange}
            hasSelectedElement={!!selectedElement}
          />
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
