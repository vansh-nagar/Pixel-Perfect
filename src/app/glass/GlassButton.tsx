"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Glass } from "./Glass";
import { generateLensMap } from "./lib/displacement";
import { cn } from "@/lib/utils";

export function GlassButton({
  children,
  className,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  ...props
}: React.ComponentProps<"button">) {
  const ref = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const radius = size.h / 2; // pill
  const map = useMemo(() => {
    if (typeof window === "undefined" || size.w < 4 || size.h < 4) return null;
    return generateLensMap({
      width: size.w,
      height: size.h,
      borderRadius: radius,
      scale: pressed ? 0.42 : 0.26,
      depth: Math.max(4, size.h * 0.22),
      curvature: 14,
      splay: 1.1,
    });
  }, [size.w, size.h, radius, pressed]);

  const version = size.w * 100000 + size.h * 10 + (pressed ? 1 : 0);

  return (
    <button
      ref={ref}
      className={cn(
        "relative isolate inline-flex cursor-pointer select-none items-center justify-center rounded-full px-8 py-3 text-base font-medium text-white transition-transform duration-150 active:scale-[0.97]",
        className
      )}
      style={{ touchAction: "manipulation" }}
      onPointerDown={(e) => {
        setPressed(true);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        onPointerLeave?.(e);
      }}
      {...props}
    >
      <Glass
        map={map}
        version={version}
        width={size.w}
        height={size.h}
        borderRadius={radius}
        x={0}
        y={0}
        chroma={1}
        blur={0.5}
        glow={0.5}
        edgeHighlight={0.85}
        specular={0.7}
        specularAngle={115}
      />
      <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {children}
      </span>
    </button>
  );
}
