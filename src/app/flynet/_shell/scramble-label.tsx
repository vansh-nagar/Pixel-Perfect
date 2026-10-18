"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Hover scramble for mono button labels (docs/flynet/integrate-motion-blueprint.md).
 *   0ms        pointer enters the parent link/button
 *   +16ms/char letters turn to random A–Z, left → right
 *   330ms      real letters resolve left → right, 8ms apart
 * Spaces never scramble, and the mono font keeps the width fixed.
 * Mouse hover only: no touch, no keyboard focus, nothing under reduced motion.
 */
const TIMING = {
  scrambleStep: 16,
  rerollEvery: 50,
  resolveStart: 330,
  resolveStep: 8,
};

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export function ScrambleLabel({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const trigger = ref.current?.closest("a,button");
    if (!trigger) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const run = (e: Event) => {
      if ((e as PointerEvent).pointerType !== "mouse" || !canHover.matches || reduce.matches) return;
      cancelAnimationFrame(frame);
      const chars = [...text];
      const glyphs = chars.map(randomGlyph);
      const rolled = chars.map(() => 0);
      const start = performance.now();

      const tick = (now: number) => {
        const t = now - start;
        let done = true;
        const next = chars.map((c, i) => {
          if (c === " ") return c;
          if (t >= TIMING.resolveStart + i * TIMING.resolveStep) return c;
          done = false;
          if (t < i * TIMING.scrambleStep) return c;
          const roll = Math.floor(t / TIMING.rerollEvery);
          if (roll !== rolled[i]) {
            rolled[i] = roll;
            glyphs[i] = randomGlyph();
          }
          return glyphs[i];
        });
        setDisplay(next.join(""));
        if (!done) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    trigger.addEventListener("pointerenter", run);
    return () => {
      trigger.removeEventListener("pointerenter", run);
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return (
    <span ref={ref}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{display}</span>
    </span>
  );
}
