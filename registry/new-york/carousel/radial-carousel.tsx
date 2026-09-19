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

// Flat, high-contrast swatches: a solid fill, one hard-edged motif, and a text colour that reads on it.
const SWATCHES = [
  { bg: "#ff5f1f", ink: "#151515", motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px" },
  { bg: "#2d4bff", ink: "#ffffff", motif: "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px" },
  { bg: "#f6a8f2", ink: "#151515", motif: "repeating-radial-gradient(circle at 30% 70%, #ff5f1f 0 12px, transparent 12px 34px)" },
  { bg: "#ffb000", ink: "#151515", motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)" },
  { bg: "#6b3ce6", ink: "#ffffff", motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px" },
  { bg: "#9dbbff", ink: "#151515", motif: "repeating-linear-gradient(0deg, #2d4bff 0 6px, transparent 6px 22px)" },
];

// 15 cards over 6 swatches: the wrap (card 15 → card 1) never repeats a colour.
const SLIDES = Array.from({ length: COUNT }, (_, i) => ({
  label: `Slide ${String(i + 1).padStart(2, "0")}`,
  swatch: SWATCHES[i % SWATCHES.length],
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

      gsap.set(cards, { transformOrigin: `50% ${RADIUS}px` });

      let rotation = 0; // global wheel angle (deg)

      const render = () =>
        cards.forEach((card, i) => gsap.set(card, { rotation: i * GAP + rotation }));
      render();

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
      <div className="pointer-events-none absolute left-1/2 top-0 h-full -translate-x-1/2 border-l border-dashed border-neutral-300" />

      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="radial-card absolute left-1/2 -ml-[120px] flex h-40 w-60 items-end rounded-2xl p-4"
          style={{
            top: CARD_TOP,
            background: `${s.swatch.motif}, ${s.swatch.bg}`,
            color: s.swatch.ink,
          }}
        >
          <span
            className="rounded-md px-2 py-1 text-sm font-medium"
            style={{ backgroundColor: s.swatch.bg }}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RadialCarousel;
