import React from "react";
import { Button } from "./ui/button";
import { ArrowUp, CircleSlash, Loader2 } from "lucide-react";

interface PromptSubmitProps {
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  status: string;
  className: string;
}

export default function PromptSubmit({
  onSubmit,
  status,
  className,
}: PromptSubmitProps) {
  return (
    <div>
      <Button onClick={onSubmit} className={`${className} rounded-full`}>
        {status == "loading" ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <ArrowUp className="w-8 h-8" />
        )}
      </Button>
    </div>
  );
}
