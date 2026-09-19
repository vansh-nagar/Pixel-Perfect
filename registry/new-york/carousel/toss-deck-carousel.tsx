"use client";

/**
 * A messy pile of polaroids with flat colour prints — flick the top one away and it flies off with your throw while the pile shuffles up and a new one slips in underneath. Tosses itself when you leave it alone; the pile never runs out.
 */

import { AnimatePresence, motion } from "framer-motion";
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

const PHOTOS = [
  { swatch: SWATCHES[0], caption: "summer, somewhere" },
  { swatch: SWATCHES[1], caption: "the blue hour" },
  { swatch: SWATCHES[2], caption: "left the map at home" },
  { swatch: SWATCHES[3], caption: "3pm, no plans" },
  { swatch: SWATCHES[4], caption: "last one of the roll" },
  { swatch: SWATCHES[5], caption: "don't ask" },
];

const STACK = 4; // photos visible in the pile
const TOSS_DISTANCE = 100; // px of drag before a release commits
const TOSS_VELOCITY = 500; // px/s of flick that commits regardless

// deterministic per-photo tilt so the pile always looks the same kind of messy
const tiltOf = (i: number) => ((i * 37) % 9) - 4;

const tossVariants = {
  exit: (dir: number) => ({
    x: dir * 600,
    y: -80,
    rotate: dir * 32,
    opacity: 0,
    transition: { duration: 0.4, ease: "easeIn" as const },
  }),
};

const TossDeckCarousel = () => {
  const [[active, dir], setDeck] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);

  const toss = (d: number) => {
    setDeck(([a]) => [a + 1, d]);
  };

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => toss(active % 2 === 0 ? 1 : -1), 2800);
    return () => clearInterval(id);
  }, [paused, active]);

  return (
    <div
      className="relative flex h-[80vh] w-full select-none items-center justify-center overflow-hidden"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="relative h-80 w-64">
        <AnimatePresence initial={false} custom={dir}>
          {Array.from({ length: STACK }).map((_, p) => {
            const idx = active + p;
            const photo = PHOTOS[idx % PHOTOS.length];
            const isTop = p === 0;

            return (
              <motion.div
                key={idx}
                custom={dir}
                variants={tossVariants}
                initial={{
                  y: -STACK * 12 - 20,
                  scale: 1 - STACK * 0.05,
                  opacity: 0,
                  rotate: tiltOf(idx),
                }}
                animate={{
                  x: idx % 2 === 0 ? 4 : -4,
                  y: -p * 12,
                  scale: 1 - p * 0.05,
                  rotate: isTop ? tiltOf(idx) / 2 : tiltOf(idx),
                  opacity: 1,
                }}
                exit="exit"
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                style={{ zIndex: STACK - p }}
                className={`absolute inset-0 bg-white p-3 pb-12 ring-1 ring-black/5 ${
                  isTop ? "cursor-grab active:cursor-grabbing" : ""
                }`}
                drag={isTop}
                dragSnapToOrigin
                dragElastic={0.9}
                whileDrag={{ scale: 1.04 }}
                onDragEnd={(_, info) => {
                  const flung =
                    Math.abs(info.offset.x) > TOSS_DISTANCE ||
                    Math.abs(info.velocity.x) > TOSS_VELOCITY;
                  if (flung) toss(info.offset.x + info.velocity.x > 0 ? 1 : -1);
                }}
              >
                <div
                  role="img"
                  aria-label={photo.caption}
                  className="pointer-events-none h-full w-full"
                  style={{ background: `${photo.swatch.motif}, ${photo.swatch.bg}` }}
                />
                <p className="pointer-events-none absolute bottom-3.5 left-0 right-0 text-center font-serif text-sm italic text-neutral-600">
                  {photo.caption}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="pointer-events-none absolute bottom-8 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        flick the top card
      </p>
    </div>
  );
};

export default TossDeckCarousel;
