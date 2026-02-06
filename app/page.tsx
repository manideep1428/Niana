"use client";

import { PromptInput } from "@/components/prompt-input";
import { Suggestions } from "@/components/suggestions";
import TopBar from "@/components/top-bar";
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
    const type = formData.get("type") as "mobile" | "web";

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
          type,
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
    <div className="relative min-h-screen bg-background selection:bg-primary/20 overflow-hidden font-sans">
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Main Gradient Blob - Smaller on mobile */}
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] sm:w-[50vw] h-[70vw] sm:h-[50vw] bg-primary/15 sm:bg-primary/20 rounded-full blur-[80px] sm:blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[float_10s_ease-in-out_infinite]" />
        {/* Secondary Blob - Smaller on mobile */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] sm:w-[50vw] h-[70vw] sm:h-[50vw] bg-purple-500/8 dark:bg-purple-900/15 sm:bg-purple-500/10 sm:dark:bg-purple-900/20 rounded-full blur-[80px] sm:blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[float_15s_ease-in-out_infinite_reverse]" />
        {/* Accent Blob - Hidden on mobile, visible on tablet+ */}
        <div className="hidden sm:block absolute top-[20%] right-[20%] w-[30vh] h-[30vh] bg-pink-400/10 dark:bg-pink-800/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen animate-[pulse-glow_8s_ease-in-out_infinite]" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full">
        <TopBar />

        {/* Main content - Optimized mobile spacing */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-3 sm:px-4 pb-6 sm:pb-10 pt-20 sm:pt-24">
          <div className="w-full flex-col flex items-center gap-6 sm:gap-8">
            <GreetingHeader />

            <div className="w-full max-w-3xl animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150 backdrop-blur-sm">
              <PromptInput
                input={input}
                disable={isLoading}
                setInput={setInput}
                onSubmit={onSubmit}
                isLoading={isLoading}
                variant="hero"
              />
              <div className="mt-6 sm:mt-8 text-center">
                <Suggestions onSelect={(prompt) => setInput(prompt)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
