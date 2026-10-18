/**
 * Hairlines that run past a box's edges and fade out, with a plus mark where they cross at each corner.
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// The lines run 2rem past the box and fade out over exactly that overhang.
const FADE_X =
  "linear-gradient(to right, transparent, currentColor 2rem, currentColor calc(100% - 2rem), transparent)";
const FADE_Y =
  "linear-gradient(to bottom, transparent, currentColor 2rem, currentColor calc(100% - 2rem), transparent)";

const LINES = [
  { className: "-inset-x-8 top-0 h-px", backgroundImage: FADE_X },
  { className: "-inset-x-8 bottom-0 h-px", backgroundImage: FADE_X },
  { className: "-inset-y-8 left-0 w-px", backgroundImage: FADE_Y },
  { className: "-inset-y-8 right-0 w-px", backgroundImage: FADE_Y },
];

const CORNERS = [
  "top-0 left-0",
  "top-0 left-full",
  "top-full left-0",
  "top-full left-full",
];

const CrosshairFrame = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => (
  <div className={cn("relative text-muted-foreground", className)}>
    {LINES.map(({ className, backgroundImage }) => (
      <span
        key={className}
        aria-hidden
        className={cn("absolute opacity-40", className)}
        style={{ backgroundImage }}
      />
    ))}
    {CORNERS.map((corner) => (
      <span
        key={corner}
        aria-hidden
        className={cn("absolute size-[15px] -translate-x-[7px] -translate-y-[7px]", corner)}
      >
        <span className="absolute inset-x-0 top-[7px] h-px bg-current" />
        <span className="absolute inset-y-0 left-[7px] w-px bg-current" />
      </span>
    ))}
    {children}
  </div>
);

export default CrosshairFrame;
