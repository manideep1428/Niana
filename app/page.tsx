"use client";

import { PromptInput } from "@/components/prompt-input";
import { Suggestions } from "@/components/suggestions";
import TopBar from "@/components/top-bar";
import {
  RepublicDayBanner,
  useRepublicDayBanner,
} from "@/components/republic-day-banner";
import { setLocalStore, getLocalStore } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import type { Attachment } from "@/components/preview-attachment";

import { GreetingHeader } from "@/components/greeting-header";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use the banner hook for layout calculations
  const { showBanner, bannerHeight, contentPadding } = useRepublicDayBanner();

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
      {/* Background Pattern */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[60vh] h-[60vh] bg-primary/15 rounded-full blur-[120px] opacity-60 dark:opacity-40" />
      </div>

      {/* Republic Day Offer Banner */}
      <RepublicDayBanner />

      <div className="relative z-10 font-sans">
        {/* TopBar with dynamic offset based on banner visibility */}
        <TopBar topOffset={bannerHeight} />

        {/* Main content with padding for both banner and topbar */}
        <div
          className="flex flex-col items-center justify-center min-h-screen px-4 pb-10"
          style={{ paddingTop: contentPadding }}
        >
          <div className="w-full">
            <GreetingHeader />
          </div>

          <div className="w-full max-w-3xl animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150">
            <PromptInput
              input={input}
              disable={isLoading}
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
