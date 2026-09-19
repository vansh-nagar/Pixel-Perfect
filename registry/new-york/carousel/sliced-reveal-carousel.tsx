"use client";

/**
 * Slide transitions slice the flat colour card into vertical strips that cascade in one column at a time — the new card sweeps up while the old sweeps away, offset by a per-strip stagger. Auto-advances; arrows and dots take over on click.
 */

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Flat, high-contrast swatches: a solid fill, one hard-edged motif, and a text colour that reads on it.
const SWATCHES = [
  { bg: "#ff5f1f", ink: "#151515", motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px" },
  { bg: "#2d4bff", ink: "#ffffff", motif: "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px" },
  { bg: "#f6a8f2", ink: "#151515", motif: "repeating-radial-gradient(circle at 30% 70%, #ff5f1f 0 12px, transparent 12px 34px)" },
  { bg: "#ffb000", ink: "#151515", motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)" },
  { bg: "#6b3ce6", ink: "#ffffff", motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px" },
  { bg: "#9dbbff", ink: "#151515", motif: "repeating-linear-gradient(0deg, #2d4bff 0 6px, transparent 6px 22px)" },
];

// The loop wraps (5 → 1), so no two neighbours share a swatch.
const SLIDES = [
  { swatch: SWATCHES[1], title: "Cerulean Coast", tag: "Nº 01 — Voyage" },
  { swatch: SWATCHES[3], title: "Ash & Amber", tag: "Nº 02 — Terrain" },
  { swatch: SWATCHES[2], title: "Field Studies", tag: "Nº 03 — Botanic" },
  { swatch: SWATCHES[0], title: "Concrete Poems", tag: "Nº 04 — Metropolis" },
  { swatch: SWATCHES[5], title: "Quiet Hours", tag: "Nº 05 — Interior" },
];

const STRIPS = 8;
const EASE = [0.65, 0, 0.35, 1] as const;

const stripVariants = (s: number) => ({
  enter: (dir: number) => ({ y: dir > 0 ? "102%" : "-102%" }),
  center: {
    y: "0%",
    transition: { duration: 0.7, ease: EASE, delay: s * 0.055 },
  },
  exit: (dir: number) => ({
    y: dir > 0 ? "-102%" : "102%",
    transition: { duration: 0.7, ease: EASE, delay: s * 0.055 },
  }),
});

const SlicedRevealCarousel = () => {
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);

  const paginate = useCallback((d: number) => {
    setState(([i]) => [(i + d + SLIDES.length) % SLIDES.length, d]);
  }, []);

  useEffect(() => {
    const id = setInterval(() => paginate(1), 4200);
    return () => clearInterval(id);
  }, [index, paginate]);

  const slide = SLIDES[index];

  return (
    <div className="relative flex h-[80vh] w-full items-center justify-center overflow-hidden">
      <div className="relative h-[85%] w-[min(1100px,92%)] overflow-hidden rounded-2xl bg-neutral-950">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            className="absolute inset-0 flex"
            custom={dir}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {Array.from({ length: STRIPS }).map((_, s) => (
              <div key={s} className="h-full flex-1 overflow-hidden">
                {/* each strip is a window onto one card-wide swatch, shifted left by s strips,
                    so the motif runs unbroken across the strips once they settle */}
                <motion.div
                  className="h-full"
                  custom={dir}
                  variants={stripVariants(s)}
                  style={{
                    width: `${STRIPS * 100}%`,
                    marginLeft: `${-s * 100}%`,
                    background: `${slide.swatch.motif}, ${slide.swatch.bg}`,
                  }}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-6 left-7">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={index}
              initial={{ y: 24, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: { duration: 0.6, ease: EASE, delay: 0.35 },
              }}
              exit={{ y: -18, opacity: 0, transition: { duration: 0.3 } }}
              className="rounded-lg px-3 py-2"
              style={{ backgroundColor: slide.swatch.bg, color: slide.swatch.ink }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-60">
                {slide.tag}
              </p>
              <h3 className="mt-1 text-3xl font-semibold tracking-tight">
                {slide.title}
              </h3>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 right-7 flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => paginate(-1)}
            className="grid size-9 place-items-center rounded-full bg-[#151515] text-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => paginate(1)}
            className="grid size-9 place-items-center rounded-full bg-[#151515] text-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="absolute left-5 top-4 flex gap-1.5 rounded-full bg-[#151515] px-2 py-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => paginate(i - index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? "w-8 bg-white" : "w-3 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlicedRevealCarousel;
