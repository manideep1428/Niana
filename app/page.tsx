"use client";

import { PromptInput } from "@/components/prompt-input";
import { Suggestions } from "@/components/suggestions";
import { AppLayout } from "@/components/app-layout";
import { setLocalStore, getLocalStore } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, Linkedin, Instagram, Github } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import type { Attachment } from "@/components/preview-attachment";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const phrases = [
    "Design anything with Niana",
    "Build stunning web apps",
    "Create modern interfaces",
    "Generate production code"
  ];

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      setDisplayText(
        isDeleting
          ? fullText.substring(0, displayText.length - 1)
          : fullText.substring(0, displayText.length + 1)
      );

      setTypingSpeed(isDeleting ? 40 : 100);

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(100);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, phrases, typingSpeed]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

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
          attachments: attachments.map((a) => ({
            name: a.name,
            url: a.url,
            contentType: a.contentType,
            storageId: a.storageId,
          })),
          isPublic,
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
    <AppLayout>
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        {/* Peach Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FDBA74]/30 blur-[120px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col min-h-screen">


          <main className="flex-1 flex flex-col items-center px-4 pt-24 sm:pt-32 md:pt-40">
            {/* Hero Section */}
            <div className="w-full max-w-4xl mx-auto text-center space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">

              <div className="space-y-6">
                {greeting && (
                  <div className="fade-in slide-in-from-bottom-3 duration-1000">
                    <span className="text-5xl md:text-6xl font-[family-name:var(--font-dancing-script)] text-amber-600 dark:text-amber-400">
                      {greeting}{user?.firstName ? `, ${user.firstName}` : ""}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance min-h-[1.2em]">
                  {displayText}
                  <span className="animate-pulse">|</span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance font-light">
                  Create stunning designs and interfaces by chatting with AI
                </p>
              </div>

              <div className="w-full max-w-2xl mx-auto pt-8">
                <div className="relative">
                  <PromptInput
                    input={input}
                    setInput={setInput}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    isPublic={isPublic}
                    setIsPublic={setIsPublic}
                  />
                </div>

                <div className="mt-8">
                  <Suggestions onSelect={(prompt) => setInput(prompt)} />
                </div>
              </div>
            </div>
          </main>

          <footer className="w-full py-8 text-center text-xs text-black/30 dark:text-white/30 space-y-4">
            <div className="flex items-center justify-center gap-6">
              <a href="https://x.com/Niana_design/" target="_blank" rel="noopener noreferrer" className="hover:text-black/60 dark:hover:text-white/60 transition-colors">
                <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <title>X</title>
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-black/60 dark:hover:text-white/60 transition-colors">
                <Instagram className="w-4 h-4" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-black/60 dark:hover:text-white/60 transition-colors">
                <Linkedin className="w-4 h-4" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-black/60 dark:hover:text-white/60 transition-colors">
                <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <title>Discord</title>
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                </svg>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-black/60 dark:hover:text-white/60 transition-colors">
                <Github className="w-4 h-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
            <p>© {new Date().getFullYear()} Niana. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </AppLayout>
  );
}
