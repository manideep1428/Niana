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
import { generateUUID } from "@/lib/utils";

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

    const generatedProjectId = generateUUID();

    // Redirect immediately in parallel
    setLocalStore("initialMessage", input);
    setInput("");
    router.push(`/design/${generatedProjectId}?new=true`);

    // Call API in the background (parallelized)
    fetch("/api/project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: generatedProjectId,
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
    })
      .then(async (response) => {
        const data = await response.json();
        if (!data.success) {
          toast.error(data.message || "Failed to initialize project");
        }
      })
      .catch((error) => {
        console.error("Error creating project in background:", error);
        toast.error("Failed to initialize project");
      });
  };

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#050505] selection:bg-primary/20 overflow-x-hidden font-sans transition-colors duration-300">
      {/* Premium Minimal Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Top Center Brand Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(circle_at_top,rgba(255,159,104,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,159,104,0.06),transparent_50%)]" />
        
        {/* Accent purple glow on the right */}
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/5 dark:bg-purple-900/5 blur-[100px]" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        <TopBar />

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 pt-28 sm:pt-32">
          <div className="w-full max-w-3xl flex flex-col items-center gap-8 sm:gap-10">
            <GreetingHeader />

            <div className="w-full animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150">
              <PromptInput
                input={input}
                disable={isLoading}
                setInput={setInput}
                onSubmit={onSubmit}
                isLoading={isLoading}
                variant="hero"
              />
              <div className="mt-8 text-center">
                <Suggestions onSelect={(prompt) => setInput(prompt)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
