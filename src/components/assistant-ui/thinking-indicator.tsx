"use client";

import { useEffect, useState } from "react";

import { DotmSquare11 } from "@/components/ui/dotm-square-11";

/* Thinking indicator — shown in place of assistant-ui's default running "●"
 * while the assistant is working but hasn't streamed any output yet.
 *
 * The official @dotmatrix DotmSquare11 loader (inherits currentColor, so it
 * follows the theme) sits next to a shimmering status label that advances
 * Connecting → Thinking → Generating. */

const STATUSES = ["Connecting", "Thinking", "Generating"];

export function ThinkingIndicator() {
  const [step, setStep] = useState(0);

  // Advance the label like real progress; hold on the last status.
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
