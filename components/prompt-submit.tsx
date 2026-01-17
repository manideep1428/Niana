import React from "react";
import { Button } from "./ui/button";
import { ArrowUp, Square, Loader2 } from "lucide-react";

interface PromptSubmitProps {
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onStop?: () => void;
  status: string;
  className: string;
  isResponding?: boolean;
}

export default function PromptSubmit({
  onSubmit,
  onStop,
  status,
  className,
  isResponding = false,
}: PromptSubmitProps) {
  const isLoading = status === "loading";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading && isResponding && onStop) {
      e.preventDefault();
      onStop();
    } else if (!isLoading) {
      onSubmit(e);
    }
  };

  return (
    <div>
      <Button
        onClick={handleClick}
        disabled={isLoading && !isResponding}
        className={`${className} rounded-full ${isResponding ? "bg-red-500 hover:bg-red-600" : ""}`}
        title={
          isResponding
            ? "Stop generating"
            : isLoading
              ? "Loading..."
              : "Send message"
        }
      >
        {isLoading ? (
          isResponding ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )
        ) : (
          <ArrowUp className="w-8 h-8" />
        )}
      </Button>
    </div>
  );
}
