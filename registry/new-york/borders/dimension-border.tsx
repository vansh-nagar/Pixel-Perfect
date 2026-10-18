"use client";

/**
 * A redline that measures its own box: live width and height on dimension lines, with extension lines from the corners.
 */

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

// The annotation colour; override `--dim` on the element to recolour it.
const LABEL =
  "absolute rounded-[3px] bg-(--dim) px-1 py-px font-mono text-[9px] leading-none text-white tabular-nums";

const DimensionBorder = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() =>
      setSize({ w: el.offsetWidth, h: el.offsetHeight }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("relative [--dim:var(--color-rose-500)]", className)}>
      <div aria-hidden className="absolute inset-0 border border-dashed border-(--dim) opacity-50" />

      {/* width: extension lines up from the top corners, the dimension line 14px above */}
      <span aria-hidden className="absolute -top-5 left-0 h-5 w-px bg-(--dim) opacity-50" />
      <span aria-hidden className="absolute -top-5 right-0 h-5 w-px bg-(--dim) opacity-50" />
      <span aria-hidden className="absolute inset-x-0 -top-3.5 h-px bg-(--dim)" />

      {/* height: extension lines out from the right corners, the dimension line 14px right */}
      <span aria-hidden className="absolute top-0 -right-5 h-px w-5 bg-(--dim) opacity-50" />
      <span aria-hidden className="absolute bottom-0 -right-5 h-px w-5 bg-(--dim) opacity-50" />
      <span aria-hidden className="absolute inset-y-0 -right-3.5 w-px bg-(--dim)" />

      {size && (
        <>
          <span className={cn(LABEL, "-top-3.5 left-1/2 -translate-x-1/2 -translate-y-1/2")}>
            {size.w}
          </span>
          <span className={cn(LABEL, "top-1/2 -right-3.5 translate-x-1/2 -translate-y-1/2")}>
            {size.h}
          </span>
        </>
      )}
      {children}
    </div>
  );
};

export default DimensionBorder;
