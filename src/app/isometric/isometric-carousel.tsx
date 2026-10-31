"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SlideContext } from "./ill-art";

export type Slide = { title: string; node: ReactNode };

// Wrapped distance from the centred slide: with 5 slides, offsets run -2..2.
const offsetOf = (i: number, active: number, n: number) => {
  let o = (((i - active) % n) + n) % n;
  if (o > n / 2) o -= n;
  return o;
};

// Centre slide large; neighbours shrink and slide out to the sides, the outer ring hides.
const pose = (o: number) => {
  const d = Math.abs(o);
  if (d === 0) return { x: "0vw", "--slide-scale": 0.74, opacity: 1 };
  if (d === 1) return { x: `${Math.sign(o) * 43}vw`, "--slide-scale": 0.26, opacity: 0.5 };
  return { x: `${Math.sign(o) * 62}vw`, "--slide-scale": 0.16, opacity: 0 };
};

const SPRING = { type: "spring", stiffness: 170, damping: 26, mass: 1 } as const;

export function IsometricCarousel({ slides }: { slides: Slide[] }) {
  const n = slides.length;
  // `from` is the slide centred before the last move, to spot slides that wrap round.
  const [{ active, from }, setNav] = useState({ active: 0, from: 0 });
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const go = (step: number) => setNav((s) => ({ active: (((s.active + step) % n) + n) % n, from: s.active }));

  // Horizontal trackpad swipes and touch swipes move one slide per gesture.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 24 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now < lock) return;
      lock = now + 650;
      go(Math.sign(e.deltaX));
    };
    let start: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") start = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
    // go only reads n and the state setter, so binding once per slide count is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const offsets = slides.map((_, i) => offsetOf(i, active, n));
  const wrapped = offsets.map((o, i) => Math.abs(o - offsetOf(i, from, n)) > 1);

  return (
    <div ref={rootRef} className="relative h-svh overflow-hidden" aria-roledescription="carousel">
      {slides.map((s, i) => {
        const o = offsets[i];
        const isActive = o === 0;
        return (
          <motion.div
            key={s.title}
            className="absolute inset-0"
            style={{ zIndex: n - Math.abs(o) }}
            initial={false}
            animate={pose(o)}
            // A slide that wraps from one edge to the other jumps while hidden instead of crossing the screen.
            transition={reduce || wrapped[i] ? { duration: 0 } : SPRING}
            aria-roledescription="slide"
            aria-label={`${s.title}, ${i + 1} of ${n}`}
            aria-hidden={!isActive}
          >
            <div inert={!isActive} className="h-full">
              <SlideContext.Provider value={{ active: isActive, visible: Math.abs(o) <= 1 }}>{s.node}</SlideContext.Provider>
            </div>
          </motion.div>
        );
      })}

      {/* Hit areas over the neighbours: the centred slide's box covers the whole stage, so they sit above it. */}
      {n > 1 && (
        <>
          <button type="button" tabIndex={-1} onClick={() => go(-1)} aria-label={`Show ${slides[(active - 1 + n) % n].title}`} className="absolute top-1/4 bottom-1/4 left-0 z-40 w-[18vw] cursor-pointer" />
          <button type="button" tabIndex={-1} onClick={() => go(1)} aria-label={`Show ${slides[(active + 1) % n].title}`} className="absolute top-1/4 right-0 bottom-1/4 z-40 w-[18vw] cursor-pointer" />
        </>
      )}

      <nav className="pointer-events-none absolute inset-x-0 bottom-6 z-50 flex justify-center font-mono text-xs tracking-[0.12em] text-[#8a8f98] uppercase select-none">
        <div className="pointer-events-auto flex items-center gap-5">
          <button type="button" onClick={() => go(-1)} aria-label="Previous illustration" className="px-1 transition-colors hover:text-[#d0d6e0]">
            ←
          </button>
          <span className="flex w-40 justify-between tabular-nums" aria-live="polite">
            <span className="text-[#d0d6e0]">{slides[active].title}</span>
            <span>
              {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
          </span>
          <button type="button" onClick={() => go(1)} aria-label="Next illustration" className="px-1 transition-colors hover:text-[#d0d6e0]">
            →
          </button>
        </div>
      </nav>
    </div>
  );
}
