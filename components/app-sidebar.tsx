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
import { DesignToolCall } from "./design-tool-call";
import { Response } from "./elements/response";
import type { Attachment } from "./preview-attachment";
import Image from "next/image";
import {
  FileText,
  File,
  ArrowLeft,
  ArrowDown,
  Square,
  Type,
  GitFork,
  Lock,
} from "lucide-react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VisualEditor, SelectedElement } from "./visual-editor";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  artifacts?: { id: string; title: string }[];
  streamingDesigns?: {
    id: string;
    title: string;
    status: "creating" | "completed";
  }[];
  attachments?: Attachment[];
}

interface PromptSidebarProps extends React.ComponentProps<typeof Sidebar> {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isResponding?: boolean;
  isMessagesLoading?: boolean;
  handleFormSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    attachments: Attachment[]
  ) => void;
  onStop?: () => void;
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

  // Read-only mode for community designs
  isReadOnly?: boolean;
  onFork?: () => void;
  projectTitle?: string;
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
  isResponding = false,
  isMessagesLoading,
  handleFormSubmit,
  onStop,
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
  isReadOnly = false,
  onFork,
  projectTitle,
  ...props
}: PromptSidebarProps) {
  const { user } = useAuth();

  // Use the scroll-to-bottom hook for auto-scroll during streaming
  const { containerRef, endRef, isAtBottom, scrollToBottom } =
    useScrollToBottom();

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
            <Image src="/logo.png" alt="Niana Logo" width={24} height={24} />
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
                className="absolute inset-0 touch-pan-y overflow-y-auto scrollbar-thin"
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
                        key={`${message.role}-${index}`}
                        className="flex gap-3 w-full pb-4 border-b border-white/10"
                      >
                        {/* Large avatar on the left */}
                        {message.role === "assistant" ? (
                          <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
                            <Image
                              src="/logo.png"
                              alt="Niana Logo"
                              width={24}
                              height={24}
                            />
                          </div>
                        ) : (
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarImage
                              src={user?.profilePictureUrl || ""}
                              alt={user?.firstName || "User"}
                            />
                            <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-500 text-xs text-white">
                              {user?.firstName?.charAt(0) ||
                                user?.email?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {/* Message content */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground mb-1 block">
                            {message.role === "assistant"
                              ? "Niana"
                              : user?.firstName || "You"}
                          </span>
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
                          {/* Render streaming design status (Creating/Created indicators) */}
                          {message.streamingDesigns &&
                            message.streamingDesigns.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.streamingDesigns.map((design) => (
                                  <DesignToolCall
                                    key={design.id}
                                    title={design.title}
                                    status={design.status}
                                    onClick={() => onArtifactClick?.(design.id)}
                                  />
                                ))}
                              </div>
                            )}
                          {/* Render completed artifacts (from database/after generation) */}
                          {message.artifacts &&
                            message.artifacts.length > 0 &&
                            (!message.streamingDesigns ||
                              message.streamingDesigns.length === 0) && (
                              <div className="mt-3 space-y-2">
                                {message.artifacts.map((artifact) => (
                                  <DesignToolCall
                                    key={artifact.id}
                                    title={artifact.title}
                                    status="completed"
                                    onClick={() =>
                                      onArtifactClick?.(artifact.id)
                                    }
                                  />
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                  {/* Show loading indicator only when waiting for first response (no assistant message yet) */}
                  {isLoading &&
                    (() => {
                      // Check if the last message is from assistant with content
                      const lastMessage = messages[messages.length - 1];
                      const hasAssistantResponse =
                        lastMessage?.role === "assistant" &&
                        (lastMessage?.content?.trim() ||
                          (lastMessage?.streamingDesigns &&
                            lastMessage.streamingDesigns.length > 0));

                      // Only show loading dots if there's no assistant response yet
                      if (hasAssistantResponse) return null;

                      return (
                        <div className="flex gap-3 w-full pb-4 border-b border-white/10">
                          <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
                            <Image
                              src="/logo.png"
                              alt="Niana Logo"
                              width={24}
                              height={24}
                              className="animate-pulse"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-muted-foreground mb-1 block">
                              Niana
                            </span>
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
                      );
                    })()}
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

        {/* Footer - Show fork button in read-only mode or prompt input in edit mode */}
        <SidebarFooter className="border-t border-white/5">
          {isReadOnly ? (
            // Read-only mode - Show fork button
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>View-only mode</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This is a community design. Fork it to make your own editable
                copy.
              </p>
              <Button
                onClick={onFork}
                className="w-full gap-2 bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                <GitFork className="w-4 h-4" />
                Fork "{projectTitle}"
              </Button>
            </div>
          ) : (
            // Normal mode - Show prompt input
            <PromptInput
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              isResponding={isResponding}
              onSubmit={handleFormSubmit}
              onStop={onStop}
              activeTab={activeTab}
              onTabChange={onTabChange}
              hasSelectedElement={!!selectedElement}
            />
          )}
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
