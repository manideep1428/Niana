import React from "react";
import { Button } from "./ui/button";
import { ArrowUp, Square } from "lucide-react";

interface PromptSubmitProps {
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onStop?: () => void;
  status: string;
  className: string;
}

export default function PromptSubmit({
  onSubmit,
  onStop,
  status,
  className,
}: PromptSubmitProps) {
  const isLoading = status === "loading";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading && onStop) {
      e.preventDefault();
      onStop();
    } else {
      onSubmit(e);
    }
  };

  return (
    <div>
      <Button
        onClick={handleClick}
        className={`${className} rounded-full ${isLoading ? "bg-red-500 hover:bg-red-600" : ""}`}
        title={isLoading ? "Stop generating" : "Send message"}
      >
        {isLoading ? (
          <Square className="h-4 w-4 fill-current" />
        ) : (
          <ArrowUp className="w-8 h-8" />
        )}
      </Button>
    </div>
  );
}
