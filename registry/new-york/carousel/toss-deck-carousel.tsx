"use client";

/**
 * A messy pile of polaroids — flick the top one away and it flies off with your throw while the pile shuffles up and a new photo slips in underneath. Tosses itself when you leave it alone; the pile never runs out.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const PHOTOS = [
  { seed: "toss-01", caption: "summer, somewhere" },
  { seed: "toss-02", caption: "the blue hour" },
  { seed: "toss-03", caption: "left the map at home" },
  { seed: "toss-04", caption: "3pm, no plans" },
  { seed: "toss-05", caption: "last one of the roll" },
  { seed: "toss-06", caption: "don't ask" },
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
                className={`absolute inset-0 bg-white p-3 pb-12 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5 ${
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${photo.seed}/520/560`}
                  alt={photo.caption}
                  draggable={false}
                  className="pointer-events-none h-full w-full object-cover"
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
        flick the top photo
      </p>
    </div>
  );
};

export default TossDeckCarousel;
