/**
 * Viewfinder brackets that close in on the corners when you hover or focus inside, with a reticle fading in at the centre.
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// At rest each bracket sits 8px out from its corner; hover or focus pulls it home.
const BRACKETS = [
  "top-0 left-0 border-t border-l -translate-x-2 -translate-y-2",
  "top-0 right-0 border-t border-r translate-x-2 -translate-y-2",
  "bottom-0 left-0 border-b border-l -translate-x-2 translate-y-2",
  "bottom-0 right-0 border-b border-r translate-x-2 translate-y-2",
];

const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

const FocusBrackets = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => (
  <div className={cn("group relative text-muted-foreground", className)}>
    {BRACKETS.map((bracket) => (
      <span
        key={bracket}
        aria-hidden
        className={cn(
          "absolute size-5 border-current transition-[translate,color] duration-300 group-focus-within:translate-x-0 group-focus-within:translate-y-0 group-focus-within:text-foreground group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-foreground motion-reduce:transition-none",
          EASE,
          bracket,
        )}
      />
    ))}
    <span
      aria-hidden
      className={cn(
        "absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 scale-75 text-foreground opacity-0 transition-[opacity,scale] duration-300 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none",
        EASE,
      )}
    >
      <span className="absolute inset-[7px] rounded-full border border-current" />
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
    </span>
    {children}
  </div>
);

export default FocusBrackets;
