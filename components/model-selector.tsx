"use client";

import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chatModels, type ChatModel } from "@/lib/models";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  hasSubscription?: boolean;
}

export function ModelSelector({
  selectedModelId,
  onModelChange,
  hasSubscription = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedModel =
    chatModels.find((m) => m.id === selectedModelId) ?? chatModels[0];

  const handleModelSelect = (model: ChatModel) => {
    // New Year Special: Allow Pro model for everyone!
    // if (model.requiresSubscription && !hasSubscription) {
    //   return;
    // }
    onModelChange(model.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 gap-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span>{selectedModel.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Model</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {chatModels.map((model) => {
            const isSelected = model.id === selectedModelId;
            // New Year Special: No locks!
            const isLocked = false; // model.requiresSubscription && !hasSubscription;

            return (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                disabled={isLocked}
                className={cn(
                  "w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                  isLocked && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {model.tier === "pro" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-orange-500 to-pink-500 px-2 py-0.5 text-xs font-medium text-white">
                        <Sparkles className="h-3 w-3" />
                        Free Today!
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {model.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              🎉 New Year Special!
            </span>{" "}
            Pro model is FREE for everyone for 24 hours. Enjoy!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
