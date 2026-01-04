"use client";

import { PromptInput } from "@/components/prompt-input";
import { Suggestions } from "@/components/suggestions";
import TopBar from "@/components/top-bar";
import { setLocalStore, getLocalStore } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Restore saved prompt after sign-in
  useEffect(() => {
    const savedPrompt = getLocalStore("pendingPrompt");
    if (savedPrompt && user) {
      setInput(savedPrompt);
      localStorage.removeItem("pendingPrompt");
      toast.success("Welcome back! Your prompt has been restored.");
    }
  }, [user]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;

    if (!content?.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    // If user is not signed in, save prompt and redirect to sign-in
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
        body: JSON.stringify({ content }),
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
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      {/* Gradient Background - Lovable style */}
      <div className="absolute inset-0">
        {/* Base gradient - white in light mode, black in dark mode */}
        <div className="absolute inset-0 bg-linear-to-b from-white via-white to-transparent dark:from-black dark:via-black dark:to-transparent" />

        {/* Bottom glow effect - orange/pink gradient like Lovable */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%]">
          <div className="absolute inset-0 bg-linear-to-t from-orange-600/40 via-pink-600/20 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-linear-to-t from-orange-500/50 via-pink-500/30 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[300px] bg-orange-600/40 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[300px] bg-pink-600/30 rounded-full blur-[100px]" />
        </div>
      </div>

      <div className="relative z-10">
        <TopBar />

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center h-screen px-4">
          {/* Hero Section */}
          <div className="text-center mb-6 space-y-4 max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-xs text-black/80 dark:text-white/80">
                AI-Powered Design Studio
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="text-black dark:text-white">
                Design anything with{" "}
              </span>
              <span className="bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Niana
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-black/60 dark:text-white/60 max-w-xl mx-auto">
              Create stunning designs and interfaces by chatting with AI
            </p>
          </div>

          {/* Prompt Input */}
          <div className="w-full max-w-2xl">
            <PromptInput
              input={input}
              setInput={setInput}
              onSubmit={onSubmit}
              isLoading={isLoading}
            />

            {/* Suggestions */}
            <Suggestions onSelect={(prompt) => setInput(prompt)} />
          </div>
        </div>
      </div>
    </div>
  );
}
