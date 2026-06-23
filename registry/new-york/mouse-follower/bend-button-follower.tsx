"use client";

/**
 * A rounded button that smoothly trails the cursor, settling just to the bottom-right of it.
 */

import { useEffect, useRef } from "react";

const LABEL = "HOVER ME";
const GAP = 16; // how far below-right of the cursor the button settles
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const Page = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const btn = btnRef.current;
    if (!container || !btn) return;

    const target = { x: 0, y: 0 }; // cursor + offset
    const state = { x: 0, y: 0 }; // where the button actually is (lags behind)
    let inside = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      if (inside) {
        target.x = e.clientX - r.left + GAP;
        target.y = e.clientY - r.top + GAP;
      }
    };

    const tick = () => {
      state.x = lerp(state.x, target.x, 0.12);
      state.y = lerp(state.y, target.y, 0.12);
      btn.style.transform = `translate(${state.x}px, ${state.y}px)`;
      btn.style.opacity = inside ? "1" : "0";
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div
        ref={btnRef}
        className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full bg-foreground px-8 py-4 text-base font-semibold tracking-wide text-background opacity-0 shadow-lg transition-opacity"
      >
        {LABEL}
      </div>
    </div>
  );
};

export default Page;
