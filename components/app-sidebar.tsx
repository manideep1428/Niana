"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptInput } from "./prompt-input";
import { DesignPreview } from "./design-preview";
import { Response } from "./elements/response";
import { cn } from "@/lib/utils";
import type { Attachment } from "./preview-attachment";
import Image from "next/image";
import { FileText, File } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>, attachments: Attachment[]) => void;
  messages: Message[];
  onArtifactClick?: (artifactId: string) => void;
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
        <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
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
      <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        {attachment.name}
      </div>
    </a>
  );
}

export function PromptSidebar({
  input,
  setInput,
  isLoading,
  isMessagesLoading,
  handleFormSubmit,
  messages,
  onArtifactClick,
  ...props
}: PromptSidebarProps) {
  const { user } = useAuth();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <h2 className="font-semibold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Niana
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {isMessagesLoading ? (
              <div className="flex flex-col gap-3">
                {[44, 32, 28, 64, 52].map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-2 justify-start"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted animate-pulse" />
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
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">N</span>
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
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {message.attachments.map((attachment, i) => (
                          <MessageAttachment key={i} attachment={attachment} />
                        ))}
                      </div>
                    )}
                    <div className="text-sm">
                      <Response>{sanitizeText(message.content)}</Response>
                    </div>
                    {/* Render artifact previews */}
                    {message.artifacts && message.artifacts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.artifacts.map((artifact) => (
                          <DesignPreview
                            key={artifact.id}
                            artifactId={artifact.id}
                            title={artifact.title}
                            onClick={onArtifactClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] text-white">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white animate-pulse">N</span>
                </div>
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <PromptInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleFormSubmit}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
