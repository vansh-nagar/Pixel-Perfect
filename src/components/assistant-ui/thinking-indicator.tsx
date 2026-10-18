"use client";

import { useEffect, useState } from "react";

import { DotmSquare11 } from "@/components/ui/dotm-square-11";

const STATUSES = ["Connecting", "Thinking", "Generating"];

export function ThinkingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((n) => Math.min(n + 1, STATUSES.length - 1)),
      1300,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div
      data-slot="aui_assistant-message-indicator"
      className="flex items-center gap-3 py-1"
      aria-label="Assistant is thinking"
    >
      <DotmSquare11 size={20} dotSize={2.8} className="shrink-0" />
      <span className="shimmer text-muted-foreground text-sm font-normal">
        {STATUSES[step]}
      </span>
    </div>
  );
}
