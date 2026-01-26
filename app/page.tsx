"use client";

import { PromptInput } from "@/components/prompt-input";
import { Suggestions } from "@/components/suggestions";
import { CommunitySection } from "@/components/community-section";
import TopBar from "@/components/top-bar";
import { setLocalStore, getLocalStore } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import type { Attachment } from "@/components/preview-attachment";

import { GreetingHeader } from "@/components/greeting-header";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedPrompt = getLocalStore("pendingPrompt");
    if (savedPrompt && user) {
      setInput(savedPrompt);
      localStorage.removeItem("pendingPrompt");
      toast.success("Welcome back! Your prompt has been restored.");
    }
  }, [user]);

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    attachments: Attachment[] = [],
  ) => {
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    const isPublic = formData.get("isPublic") === "true";

    if (!content?.trim() && attachments.length === 0) {
      toast.error("Please enter a prompt or attach a file");
      return;
    }

    if (!user) {
      setLocalStore("pendingPrompt", content);
      toast.info("Please sign in to continue");
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          isPublic,
          attachments: attachments.map((a) => ({
            name: a.name,
            url: a.url,
            contentType: a.contentType,
            storageId: a.storageId,
          })),
        }),
      });

      const data = await response.json();

      if (data.success && data.projectId) {
        setLocalStore("initialMessage", input);
        setInput("");
        router.push(`/design/${data.projectId}`);
      } else {
        toast.error(data.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/20">
      {/* Background Pattern - Subtle diagonal lines if possible, or just clean white */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 font-sans">
        <TopBar />

        <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-4 pb-10">
          <div className="w-full">
            <GreetingHeader />
          </div>

          <div className="w-full max-w-3xl animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150">
            <PromptInput
              input={input}
              setInput={setInput}
              onSubmit={onSubmit}
              isLoading={isLoading}
              variant="hero"
            />
            <div className="mt-4 text-center">
              <Suggestions onSelect={(prompt) => setInput(prompt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
