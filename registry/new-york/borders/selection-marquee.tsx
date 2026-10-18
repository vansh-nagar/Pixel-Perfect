/**
 * A design-tool selection: a marching-ants border with resize handles at the corners and edge midpoints.
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// Four dashed edges drawn as backgrounds, each sliding one dash length per loop so the ants
// march clockwise: top right, right down, bottom left, left up.
const CSS = `
  .selection-marquee-ants {
    background-image:
      linear-gradient(90deg, currentColor 50%, transparent 50%),
      linear-gradient(90deg, currentColor 50%, transparent 50%),
      linear-gradient(0deg, currentColor 50%, transparent 50%),
      linear-gradient(0deg, currentColor 50%, transparent 50%);
    background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
    background-size: 8px 1px, 8px 1px, 1px 8px, 1px 8px;
    background-position: 0 0, 100% 100%, 0 100%, 100% 0;
    animation: selection-marquee-march 800ms linear infinite;
  }
  @keyframes selection-marquee-march {
    to {
      background-position: 8px 0, calc(100% - 8px) 100%, 0 calc(100% - 8px), 100% 8px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .selection-marquee-ants { animation: none; }
  }
`;

// [left %, top %] of each handle's centre
const HANDLES = [
  [0, 0],
  [50, 0],
  [100, 0],
  [0, 50],
  [100, 50],
  [0, 100],
  [50, 100],
  [100, 100],
];

const SelectionMarquee = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => (
  <div className={cn("relative text-muted-foreground", className)}>
    <style>{CSS}</style>
    <div aria-hidden className="selection-marquee-ants pointer-events-none absolute inset-0" />
    {HANDLES.map(([x, y]) => (
      <span
        key={`${x}-${y}`}
        aria-hidden
        className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 border border-current bg-background"
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    ))}
    {children}
  </div>
);

export default SelectionMarquee;
