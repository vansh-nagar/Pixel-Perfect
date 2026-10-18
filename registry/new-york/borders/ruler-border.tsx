/**
 * Design-tool rulers along the top and left edges: a tick every 8px and a numbered major tick every 40px.
 */

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

// Ticks hang off the ruler's inner edge: 4px minors every 8px, 8px majors every 40px.
const TICKS_X: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 8px), repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 40px)",
  backgroundSize: "100% 4px, 100% 8px",
  backgroundPosition: "0 100%, 0 100%",
  backgroundRepeat: "no-repeat",
};
const TICKS_Y: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 8px), repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 40px)",
  backgroundSize: "4px 100%, 8px 100%",
  backgroundPosition: "100% 0, 100% 0",
  backgroundRepeat: "no-repeat",
};
// Enough labels for a 1000px edge; the ruler clips whatever doesn't fit.
const MAJORS = Array.from({ length: 25 }, (_, i) => i * 40);

const RulerBorder = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => (
  <div className={cn("relative border pt-4 pl-4", className)}>
    <div
      aria-hidden
      className="absolute top-0 right-0 left-4 h-4 overflow-hidden border-b text-muted-foreground/70"
      style={TICKS_X}
    >
      {MAJORS.map((n) => (
        <span
          key={n}
          className="absolute top-0.5 font-mono text-[7px] leading-none tabular-nums"
          style={{ left: n + 2 }}
        >
          {n}
        </span>
      ))}
    </div>
    <div
      aria-hidden
      className="absolute top-4 bottom-0 left-0 w-4 overflow-hidden border-r text-muted-foreground/70"
      style={TICKS_Y}
    >
      {MAJORS.map((n) => (
        <span
          key={n}
          className="absolute left-0.5 rotate-180 font-mono text-[7px] leading-none tabular-nums [writing-mode:vertical-rl]"
          style={{ top: n + 2 }}
        >
          {n}
        </span>
      ))}
    </div>
    <div aria-hidden className="absolute top-0 left-0 size-4 border-r border-b" />
    {children}
  </div>
);

export default RulerBorder;
