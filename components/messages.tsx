"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { MessageContent } from "./message-content";
import { Response } from "./elements/response";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { FileText, File } from "lucide-react";

export type MessagePart = {
  type: "text" | "file";
  text?: string;
  filename?: string;
  mediaType?: string;
  url?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
};

type PreviewMessageProps = {
  message: ChatMessage;
  mode?: "view" | "edit";
};

// Sanitize text to remove any function call markers
function sanitizeText(text: string): string {
  return text.replace(/<has_function_call>/g, "").trim();
}

// Preview attachment component for displaying files in messages
function PreviewAttachment({ 
  attachment 
}: { 
  attachment: { url?: string; filename?: string; mediaType?: string } 
}) {
  const isImage = attachment.mediaType?.startsWith("image/");
  const isPdf = attachment.mediaType === "application/pdf";
  const isWord = attachment.mediaType?.includes("word");

  if (isImage && attachment.url) {
    return (
      <div className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
        <Image
          src={attachment.url}
          alt={attachment.filename || "Image attachment"}
          fill
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
          {attachment.filename}
        </div>
      </div>
    );
  }

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
        {attachment.filename || "File"}
      </div>
    </a>
  );
}

export const PreviewMessage = ({
  message,
  mode = "view",
}: PreviewMessageProps) => {
  const { user } = useAuth();
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-pink-400">
            <span className="text-xs font-bold text-white">N</span>
          </div>
        )}

        {message.role === "user" && mode !== "edit" && (
          <div className="order-2 -mt-0.5">
            <Avatar className="size-6">
              <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.firstName || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] text-white">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            ),
            "w-full":
              message.role === "assistant" &&
              message.parts?.some((p) => p.type === "text" && p.text?.trim()),
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid="message-attachments"
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={{
                    url: attachment.url,
                    filename: attachment.filename,
                    mediaType: attachment.mediaType,
                  }}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => {
            const key = `message-${message.id}-part-${index}`;

            if (part.type !== "text" || !part.text?.trim()) {
              return null;
            }

            return (
              <div key={key}>
                <MessageContent
                  className={cn({
                    "w-fit break-words rounded-2xl px-4 py-2 bg-secondary text-primary":
                      message.role === "user",
                    "bg-transparent px-0 py-0 text-left":
                      message.role === "assistant",
                  })}
                  data-testid="message-content"
                >
                  <Response>{sanitizeText(part.text)}</Response>
                </MessageContent>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PreviewMessage;
