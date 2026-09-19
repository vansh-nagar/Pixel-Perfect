"use client";

/**
 * The flat colour card is split into horizontal louver slats that flip 180° about their own axis in a stagger — the new slide rides in on the back of each slat like rotating window blinds. Auto-advances; arrows flip the louvers in either direction.
 */

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

// Flat, high-contrast swatches: a solid fill, one hard-edged motif, and a text colour that reads on it.
const SWATCHES = [
  { bg: "#ff5f1f", ink: "#151515", motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px" },
  { bg: "#2d4bff", ink: "#ffffff", motif: "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px" },
  { bg: "#f6a8f2", ink: "#151515", motif: "repeating-radial-gradient(circle at 30% 70%, #ff5f1f 0 12px, transparent 12px 34px)" },
  { bg: "#ffb000", ink: "#151515", motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)" },
  { bg: "#6b3ce6", ink: "#ffffff", motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px" },
  { bg: "#9dbbff", ink: "#151515", motif: "repeating-linear-gradient(0deg, #2d4bff 0 6px, transparent 6px 22px)" },
];

type Swatch = (typeof SWATCHES)[number];

// The loop wraps (5 → 1), so no two neighbours share a swatch.
const SLIDES = [
  { swatch: SWATCHES[3], title: "Ridge Line" },
  { swatch: SWATCHES[1], title: "Tidal Glass" },
  { swatch: SWATCHES[0], title: "Copper Canyon" },
  { swatch: SWATCHES[5], title: "Still Water" },
  { swatch: SWATCHES[4], title: "Pine Static" },
];

const SLATS = 6;

// Each slat face is a window onto one card-tall swatch, shifted up by `s` slats, so the
// motif runs on from slat to slat once they land.
const sliceStyle = (swatch: Swatch, s: number): React.CSSProperties => ({
  top: `${-s * 100}%`,
  height: `${SLATS * 100}%`,
  background: `${swatch.motif}, ${swatch.bg}`,
});

const SlatFlipCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [flight, setFlight] = useState<{ index: number; dir: number } | null>(
    null,
  );

  const advance = (dir: number) => {
    // no-op while the slats are mid-flip — let them land first
    setFlight(
      (f) =>
        f ?? { index: (current + dir + SLIDES.length) % SLIDES.length, dir },
    );
  };

  const land = () => {
    if (!flight) return;
    setCurrent(flight.index);
    setFlight(null); // slats remount at 0° already showing the new slide
  };

  useEffect(() => {
    if (flight) return;
    const id = setInterval(() => advance(1), 4200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, flight]);

  const backSlide = flight ? SLIDES[flight.index] : SLIDES[current];

  return (
    <div className="relative flex h-[80vh] w-full items-center justify-center overflow-hidden">
      <div className="relative flex h-[78%] w-[min(1000px,90%)] flex-col gap-[3px]">
        {Array.from({ length: SLATS }).map((_, s) => (
          <div
            key={s}
            className="min-h-0 flex-1"
            style={{ perspective: "1100px" }}
          >
            <motion.div
              key={current}
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d", willChange: "transform" }}
              initial={{ rotateX: 0 }}
              animate={{ rotateX: flight ? flight.dir * -180 : 0 }}
              transition={{
                duration: 0.85,
                ease: [0.45, 0, 0.15, 1],
                delay: s * 0.075,
              }}
              onAnimationComplete={s === SLATS - 1 ? land : undefined}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-[3px]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div
                  className="absolute inset-x-0"
                  style={sliceStyle(SLIDES[current].swatch, s)}
                />
              </div>
              <div
                className="absolute inset-0 overflow-hidden rounded-[3px]"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateX(180deg)",
                }}
              >
                <div
                  className="absolute inset-x-0"
                  style={sliceStyle(backSlide.swatch, s)}
                />
              </div>
            </motion.div>
          </div>
        ))}

        <div
          className="absolute bottom-5 left-6 rounded-lg px-3 py-2"
          style={{
            backgroundColor: SLIDES[current].swatch.bg,
            color: SLIDES[current].swatch.ink,
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60">
            {String(current + 1).padStart(2, "0")} /{" "}
            {String(SLIDES.length).padStart(2, "0")}
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight">
            {SLIDES[current].title}
          </h3>
        </div>

        <div className="absolute bottom-5 right-6 flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => advance(-1)}
            className="grid size-9 place-items-center rounded-full bg-[#151515] text-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => advance(1)}
            className="grid size-9 place-items-center rounded-full bg-[#151515] text-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlatFlipCarousel;
