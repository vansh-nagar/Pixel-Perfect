/**
 * Printer's crop marks: hairlines just outside each corner, with a registration target above and below.
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// Each corner gets two 16px marks on the box's edge lines, held 6px off the corner.
const MARKS = [
  "top-0 -left-[22px] h-px w-4",
  "-top-[22px] left-0 h-4 w-px",
  "top-0 -right-[22px] h-px w-4",
  "-top-[22px] right-0 h-4 w-px",
  "bottom-0 -left-[22px] h-px w-4",
  "-bottom-[22px] left-0 h-4 w-px",
  "bottom-0 -right-[22px] h-px w-4",
  "-bottom-[22px] right-0 h-4 w-px",
];

const Target = ({ className }: { className: string }) => (
  <span className={cn("absolute left-1/2 size-5 -translate-x-1/2", className)}>
    <span className="absolute inset-[5px] rounded-full border border-current" />
    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
  </span>
);

const CropMarks = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => (
  <div className={cn("relative text-muted-foreground", className)}>
    {MARKS.map((mark) => (
      <span key={mark} aria-hidden className={cn("absolute bg-current", mark)} />
    ))}
    <Target className="-top-8" />
    <Target className="-bottom-8" />
    {children}
  </div>
);

export default CropMarks;
