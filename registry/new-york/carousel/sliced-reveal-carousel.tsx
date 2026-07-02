"use client";

/**
 * Slide transitions slice the photo into vertical strips that cascade in one column at a time — the new image sweeps up while the old sweeps away, offset by a per-strip stagger. Auto-advances; arrows and dots take over on click.
 */

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const SLIDES = [
  { seed: "slice-01", title: "Cerulean Coast", tag: "Nº 01 — Voyage" },
  { seed: "slice-02", title: "Ash & Amber", tag: "Nº 02 — Terrain" },
  { seed: "slice-03", title: "Field Studies", tag: "Nº 03 — Botanic" },
  { seed: "slice-04", title: "Concrete Poems", tag: "Nº 04 — Metropolis" },
  { seed: "slice-05", title: "Quiet Hours", tag: "Nº 05 — Interior" },
];

const STRIPS = 8;
const EASE = [0.65, 0, 0.35, 1] as const;

const imageUrl = (seed: string) => `https://picsum.photos/seed/${seed}/1400/900`;

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
                <motion.div
                  className="h-full w-full"
                  custom={dir}
                  variants={stripVariants(s)}
                  style={{
                    backgroundImage: `url(${imageUrl(slide.seed)})`,
                    backgroundSize: `${STRIPS * 100}% 100%`,
                    backgroundPosition: `${(s / (STRIPS - 1)) * 100}% 50%`,
                  }}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute bottom-6 left-7 text-white">
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
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
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
            className="grid size-9 place-items-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => paginate(1)}
            className="grid size-9 place-items-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="absolute left-7 top-6 flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.seed}
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
