"use client";

/**
 * The image is split into horizontal louver slats that flip 180° about their own axis in a stagger — the new slide rides in on the back of each slat like rotating window blinds. Auto-advances; arrows flip the louvers in either direction.
 */

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const SLIDES = [
  { seed: "louver-01", title: "Ridge Line" },
  { seed: "louver-02", title: "Tidal Glass" },
  { seed: "louver-03", title: "Copper Canyon" },
  { seed: "louver-04", title: "Still Water" },
  { seed: "louver-05", title: "Pine Static" },
];

const SLATS = 6;

const imageUrl = (seed: string) =>
  `https://picsum.photos/seed/${seed}/1300/860`;

const stripStyle = (seed: string, s: number): React.CSSProperties => ({
  backgroundImage: `url(${imageUrl(seed)})`,
  backgroundSize: `100% ${SLATS * 100}%`,
  backgroundPosition: `50% ${(s / (SLATS - 1)) * 100}%`,
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
                className="absolute inset-0 rounded-[3px]"
                style={{
                  ...stripStyle(SLIDES[current].seed, s),
                  backfaceVisibility: "hidden",
                }}
              />
              <div
                className="absolute inset-0 rounded-[3px]"
                style={{
                  ...stripStyle(backSlide.seed, s),
                  backfaceVisibility: "hidden",
                  transform: "rotateX(180deg)",
                }}
              />
            </motion.div>
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute bottom-5 left-6 text-white">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
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
            className="grid size-9 place-items-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => advance(1)}
            className="grid size-9 place-items-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* warm the cache so the slat backs never flash while flipping */}
      <div className="hidden">
        {SLIDES.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.seed} src={imageUrl(s.seed)} alt="" aria-hidden />
        ))}
      </div>
    </div>
  );
};

export default SlatFlipCarousel;
