/**
 * A radial arc carousel: cards fan along a circle's top arc and the whole wheel spins around its center as you scroll, carrying velocity momentum — every card shares one far-below transform-origin, so a single rotation value drives them all.
 */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

const COUNT = 15; // cards spread evenly around the full circle (fewer = more spacing)
const GAP = 360 / COUNT; // degrees between neighbours (→ seamless wrap)
const RADIUS = 760; // px from the circle center up to each card's top edge
const CARD_TOP = "22%"; // where the top-of-arc card sits vertically
const SPEED = 8; // degrees per second of automatic rotation

const PALETTE = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#3B82F6", "#8B5CF6"];

const SLIDES = Array.from({ length: COUNT }, (_, i) => ({
  label: `Slide ${String(i + 1).padStart(2, "0")}`,
  color: PALETTE[i % PALETTE.length],
}));

const RadialCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const cards = gsap.utils.toArray<HTMLElement>(
        container.querySelectorAll(".radial-card"),
      );

      // Every card pivots around the SAME point — the circle's center, RADIUS px
      // below each card's top edge at its horizontal middle. Because the pivot is
      // shared, one rotation value sweeps the entire fan along the arc.
      gsap.set(cards, { transformOrigin: `50% ${RADIUS}px` });

      let rotation = 0; // global wheel angle (deg)

      const render = () =>
        cards.forEach((card, i) => gsap.set(card, { rotation: i * GAP + rotation }));
      render();

      // Spin forever on its own at a constant speed. deltaTime (ms) keeps it
      // frame-rate independent; COUNT cards evenly spaced over 360° make the
      // wrap seamless, so it loops infinitely with no scroll needed.
      const tick = (_time: number, deltaTime: number) => {
        rotation = (rotation + SPEED * (deltaTime / 1000)) % 360;
        render();
      };
      gsap.ticker.add(tick);

      return () => gsap.ticker.remove(tick);
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="relative h-[80vh] w-full select-none overflow-hidden"
    >
      {/* Faint vertical guide through the peak of the arc. */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-full -translate-x-1/2 border-l border-dashed border-neutral-300" />

      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="radial-card absolute left-1/2 -ml-[120px] flex h-40 w-60 items-end rounded-2xl p-4 text-white shadow-lg"
          style={{ top: CARD_TOP, backgroundColor: s.color }}
        >
          <span className="text-sm font-medium text-white/90">{s.label}</span>
        </div>
      ))}
    </div>
  );
};

export default RadialCarousel;
