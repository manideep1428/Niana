"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  Bot,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  MessageCircle,
  Users,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const OPTIONS = [
  { label: "Google Search", icon: Search },
  { label: "AI (ChatGPT, Perplexity)", icon: Bot },
  { label: "X (Twitter)", icon: Twitter },
  { label: "Reddit", icon: MessageCircle },
  { label: "Instagram", icon: Instagram },
  { label: "TikTok", icon: Users }, // Fallback for TikTok
  { label: "Facebook", icon: Facebook },
  { label: "YouTube", icon: Youtube },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Blog", icon: Globe },
  { label: "Word of mouth", icon: Users },
  { label: "Other", icon: Globe },
];

function DiscordLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 127.14 96.36" fill="currentColor" {...props}>
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c1.24-23.69-5.26-47.5-21.87-72.2ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

export function HowDidYouFindUsModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"survey" | "discord">("survey");
  const [selected, setSelected] = useState<string | null>(null);
  const [otherDetails, setOtherDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pass userId to the query; skip if not logged in
  const hasSubmitted = useQuery(api.surveys.getSurveyStatus, {
    userId: user?.id,
  });
  const submitSurvey = useMutation(api.surveys.submitSurvey);

  useEffect(() => {
    // Only open if we have a definitive "false" on submission status
    // AND the user is actually loaded and logged in
    if (user && hasSubmitted === false) {
      setIsOpen(true);
    }
  }, [hasSubmitted, user]);

  const handleNext = async () => {
    if (!selected) return;
    if (selected === "Other" && !otherDetails.trim()) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      await submitSurvey({
        userId: user.id,
        email: user.email || "",
        answer: selected,
        details: selected === "Other" ? otherDetails : undefined,
      });
      setStep("discord");
    } catch (error) {
      console.error("Failed to submit survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscordJoin = () => {
    window.open("https://discord.gg/YPDw68jf", "_blank");
  };

  const handleFinish = () => {
    setIsOpen(false);
  };

  // Don't render anything if we're loading or if the user has already submitted
  // Note: We check if step is 'survey' because if we are in 'discord' step,
  // hasSubmitted might become true appearing to close the modal, so we want to keep it open until user finishes.
  // Actually, once survey is submitted, `hasSubmitted` will eventually become true.
  // But we want to show the Discord step. So if isOpen is true, we keep showing it.
  if (!isOpen && (hasSubmitted === undefined || hasSubmitted === true)) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[78rem] [&>button]:hidden p-0 border-none shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden rounded-[2rem]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative p-0 overflow-hidden">
          <div className="relative z-10 p-8 sm:p-12">
            <AnimatePresence mode="wait">
              {step === "survey" ? (
                <motion.div
                  key="survey"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="space-y-3 text-center sm:text-left">
                    <DialogTitle className="text-4xl sm:text-5xl font-lobster-two text-foreground tracking-tight">
                      How did you find us?
                    </DialogTitle>
                    <DialogDescription className="text-lg text-muted-foreground font-light">
                      Help us understand where you discovered Niana.
                    </DialogDescription>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selected === option.label;
                      return (
                        <motion.div
                          key={option.label}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelected(option.label)}
                          className={cn(
                            "group cursor-pointer rounded-2xl border-2 transition-all duration-300 p-4 flex flex-col items-center justify-center gap-3 text-center h-32 relative overflow-hidden",
                            isSelected
                              ? "border-[#FF9F68] bg-[#FF9F68]/5"
                              : "border-border/40 hover:border-[#FF9F68]/30 hover:bg-muted/50 bg-background/50",
                          )}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="selected-indicator"
                              className="absolute inset-0 bg-[#FF9F68]/5 z-0"
                              initial={false}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            />
                          )}
                          <div
                            className={cn(
                              "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
                              isSelected
                                ? "bg-linear-to-br from-[#FF9F68] to-[#FF7B54] text-white shadow-lg shadow-orange-500/20"
                                : "bg-muted text-muted-foreground group-hover:bg-[#FF9F68]/10 group-hover:text-[#FF9F68]",
                            )}
                          >
                            <Icon className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <span
                            className={cn(
                              "relative z-10 text-sm font-medium leading-tight transition-colors",
                              isSelected
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            {option.label}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-[#FF9F68]">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {selected === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <Label
                        htmlFor="other-details"
                        className="mb-2 block text-base font-medium pl-1"
                      >
                        Please specify
                      </Label>
                      <Input
                        id="other-details"
                        value={otherDetails}
                        onChange={(e) => setOtherDetails(e.target.value)}
                        placeholder="Tell us more about how you found us..."
                        autoFocus
                        className="h-12 rounded-xl border-border/60 focus-visible:ring-[#FF9F68]/50 text-base"
                      />
                    </motion.div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="lg"
                      onClick={handleNext}
                      disabled={
                        !selected ||
                        (selected === "Other" && !otherDetails.trim()) ||
                        isSubmitting
                      }
                      className="rounded-xl px-8 h-12 text-base font-medium bg-linear-to-r from-[#FF9F68] to-[#FF7B54] hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 text-white"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="discord"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center text-center space-y-10 py-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#5865F2] blur-3xl opacity-20 rounded-full" />
                    <DiscordLogo className="h-16 w-16 text-white" />
                  </div>

                  <div className="space-y-4 max-w-lg mx-auto">
                    <DialogTitle className="text-4xl sm:text-5xl font-lobster-two tracking-tight">
                      Join the Family!
                    </DialogTitle>
                    <DialogDescription className="text-xl text-muted-foreground font-light leading-relaxed">
                      Connect with other designers, share your creations, and
                      get direct help from our team in our Discord server.
                    </DialogDescription>
                  </div>

                  <div className="flex flex-col w-full max-w-sm gap-3">
                    <Button
                      size="lg"
                      onClick={handleDiscordJoin}
                      className="w-full h-14 rounded-xl text-lg font-medium bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-xl shadow-[#5865F2]/20 transition-all hover:scale-[1.02]"
                    >
                      <DiscordLogo className="mr-2 h-6 w-6" />
                      Join Discord Server
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleFinish}
                      className="w-full h-12 rounded-xl text-base text-muted-foreground hover:text-foreground hover:bg-transparent"
                    >
                      Maybe later
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
