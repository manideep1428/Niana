"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  "Google Search",
  "AI (ChatGPT, Perplexity...)",
  "X (Twitter)",
  "Reddit",
  "Instagram",
  "TikTok",
  "Facebook",
  "YouTube",
  "LinkedIn",
  "Blog",
  "Word of mouth",
  "Other",
];

export function HowDidYouFindUsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [otherDetails, setOtherDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSubmitted = useQuery(api.surveys.getSurveyStatus);
  const submitSurvey = useMutation(api.surveys.submitSurvey);

  useEffect(() => {
    if (hasSubmitted === false) {
      setIsOpen(true);
    }
  }, [hasSubmitted]);

  const handleSubmit = async () => {
    if (!selected) return;
    if (selected === "Other" && !otherDetails.trim()) return;

    setIsSubmitting(true);
    try {
      await submitSurvey({
        answer: selected,
        details: selected === "Other" ? otherDetails : undefined,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to submit survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if we're loading or if the user has already submitted
  if (hasSubmitted === undefined || hasSubmitted === true) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden interact-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">How did you find us?</DialogTitle>
          <DialogDescription>
            Help us understand where you discovered Niana
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {OPTIONS.map((option) => (
            <div
              key={option}
              className={cn(
                "flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                selected === option
                  ? "border-primary bg-primary/10"
                  : "border-input",
              )}
              onClick={() => setSelected(option)}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded-full border border-primary flex items-center justify-center shrink-0",
                  selected === option
                    ? "border-primary"
                    : "border-muted-foreground",
                )}
              >
                {selected === option && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {option}
              </span>
            </div>
          ))}
        </div>

        {selected === "Other" && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label htmlFor="other-details" className="mb-2 block">
              Please specify
            </Label>
            <Input
              id="other-details"
              value={otherDetails}
              onChange={(e) => setOtherDetails(e.target.value)}
              placeholder="Tell us more..."
              autoFocus
            />
          </div>
        )}

        <Button
          className="w-full bg-[#A83D0D] hover:bg-[#A83D0D]/90 text-white"
          onClick={handleSubmit}
          disabled={
            !selected ||
            (selected === "Other" && !otherDetails.trim()) ||
            isSubmitting
          }
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Continue"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
