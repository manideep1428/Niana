"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  artifacts?: { id: string; title: string }[];
  attachments?: { name: string; url: string; contentType: string }[];
}

interface Design {
  _id: string;
  artifact_id: string;
  title: string;
  content: string;
}

interface ExportDialogProps {
  projectId: string;
  projectTitle: string;
  messages: Message[];
  designs: Design[];
  onFigmaExport?: () => void;
}

type ExportTarget = "prompt" | "bolt" | "lovable" | "figma";

export function ExportDialog({
  projectId,
  projectTitle,
  messages,
  designs,
  onFigmaExport,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<ExportTarget | null>(null);
  const { theme } = useTheme();

  // Generate export content for prompt-based exports
  const generateExportContent = () => {
    let content = `# ${projectTitle}\n\n`;
    content += `## Conversation History\n\n`;

    messages.forEach((msg, index) => {
      const role = msg.role === "user" ? "👤 User" : "🤖 Assistant";
      content += `### ${role}\n\n`;
      content += `${msg.content}\n\n`;

      // Include artifact references
      if (msg.artifacts && msg.artifacts.length > 0) {
        content += `**Generated Screens:** ${msg.artifacts.map((a) => a.title).join(", ")}\n\n`;
      }
    });

    // Add all HTML designs
    content += `## Generated HTML Code\n\n`;

    designs.forEach((design) => {
      content += `### ${design.title}\n\n`;
      content += "```html\n";
      content += design.content;
      content += "\n```\n\n";
    });

    return content;
  };

  // Copy content to clipboard
  const handleExport = async (target: ExportTarget) => {
    if (target === "figma") {
      onFigmaExport?.();
      setOpen(false);
      return;
    }

    const content = generateExportContent();

    try {
      await navigator.clipboard.writeText(content);
      setCopiedTarget(target);

      const targetNames: Record<ExportTarget, string> = {
        prompt: "Prompt",
        bolt: "Bolt.new",
        lovable: "Lovable",
        figma: "Figma",
      };

      toast.success(`Copied to clipboard!`, {
        description: `Paste this into ${targetNames[target]} to recreate your design.`,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedTarget(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const exportOptions = [
    {
      id: "prompt" as ExportTarget,
      title: "Prompt",
      description: "Copy as plain text prompt",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Copy className="w-5 h-5 text-white" />
        </div>
      ),
      action: "Copy Prompt",
    },
    {
      id: "bolt" as ExportTarget,
      title: "Bolt.new",
      description: "Export to Bolt.new editor",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center overflow-hidden">
          <Image
            src="/Bolt.new.png"
            alt="Bolt.new"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      ),
      action: "Copy for Bolt.new",
    },
    {
      id: "lovable" as ExportTarget,
      title: "Lovable",
      description: "Export to Lovable.dev",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-pink-500 to-rose-500 flex items-center justify-center overflow-hidden">
          <Image
            src={
              theme === "dark"
                ? "/lovable-logo-bg-dark.png"
                : "/lovable-logo-bg-light.png"
            }
            alt="Lovable"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      ),
      action: "Copy for Lovable",
    },
    {
      id: "figma" as ExportTarget,
      title: "Figma",
      description: "Export design to Figma",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            viewBox="0 0 15 15"
            fill="currentColor"
          >
            <path d="M3.75 7.5C2.71447 7.5 1.875 8.33947 1.875 9.375C1.875 10.4105 2.71447 11.25 3.75 11.25H5.625V7.5H3.75Z" />
            <path d="M3.75 3.75C2.71447 3.75 1.875 4.58947 1.875 5.625C1.875 6.66053 2.71447 7.5 3.75 7.5H5.625V3.75H3.75Z" />
            <path d="M5.625 3.75V7.5H7.5V5.625C7.5 4.58947 6.66053 3.75 5.625 3.75Z" />
            <path d="M5.625 11.25H7.5V7.5H5.625V11.25Z" />
            <path d="M9.375 7.5C10.4105 7.5 11.25 8.33947 11.25 7.5C11.25 6.46053 10.4105 5.625 9.375 5.625C8.33947 5.625 7.5 6.46053 7.5 7.5C7.5 8.53947 8.33947 9.375 9.375 9.375Z" />
          </svg>
        </div>
      ),
      action: "Export to Figma",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 px-4 bg-linear-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:border-violet-500/40 hover:bg-linear-to-r hover:from-violet-500/20 hover:to-purple-500/20 transition-all duration-300"
        >
          <Share2 className="w-4 h-4 text-violet-500" />
          <span className="bg-linear-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent font-medium">
            Export
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-violet-500" />
            Export Design
          </DialogTitle>
          <DialogDescription>
            Export your design and conversation to other platforms
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleExport(option.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                "hover:border-violet-500/50 hover:bg-violet-500/5 hover:shadow-lg hover:shadow-violet-500/10",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                "group cursor-pointer",
                "bg-card",
              )}
            >
              <div className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                {option.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-sm">{option.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <div className="shrink-0">
                {copiedTarget === option.id ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Copied!</span>
                  </div>
                ) : option.id === "figma" ? (
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: The exported content includes your conversation history and
            all generated HTML code
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
