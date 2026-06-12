"use client";

/**
 * Cards Slider — an infinite deck of product cards. The active card sits
 * front-and-centre while the rest fan out behind it, each one stepped back
 * with less scale, a touch of rotation and a soft blur. Drag, click a peeking
 * card, or let it auto-advance; the index wraps forever so the deck never ends.
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Card = { title: string; image: string };

const CARDS: Card[] = [
  {
    title: "ZV210",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "AX90",
    image:
      "https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "NOVA",
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "DRIFT",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "PULSE",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop",
  },
];

const VISIBLE = 2; // cards shown on each side of the active one
const SPACING = 56; // px each step fans sideways
const DRAG_THRESHOLD = 70; // px before a drag commits to a step

// Signed, wrapped distance of card `i` from `active`, e.g. -2..2 for 5 cards.
const offsetFrom = (i: number, active: number, len: number) => {
  let d = (((i - active) % len) + len) % len;
  if (d > len / 2) d -= len;
  return d;
};

const CardsSlider = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = CARDS.length;

  // Auto-advance forever; index grows unbounded and the wrap keeps it seamless.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => a + 1), 2600);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative flex h-[80vh] w-full select-none items-center justify-center overflow-hidden"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="relative h-96 w-72">
        {CARDS.map((card, i) => {
          const offset = offsetFrom(i, active, len);
          const abs = Math.abs(offset);
          const hidden = abs > VISIBLE;
          const isActive = offset === 0;

          return (
            <motion.div
              key={card.title}
              className={`absolute inset-0 overflow-hidden rounded-3xl shadow-2xl ${
                isActive ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              onClick={() => !hidden && !isActive && setActive((a) => a + offset)}
              initial={false}
              animate={{
                x: offset * SPACING,
                y: abs * 10,
                scale: 1 - abs * 0.1,
                rotate: offset * 4,
                opacity: hidden ? 0 : 1,
                filter: `blur(${abs * 1.6}px) brightness(${1 - abs * 0.12})`,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              style={{
                zIndex: 100 - abs,
                pointerEvents: hidden ? "none" : "auto",
              }}
              // Only the front card is draggable — grab the top image itself
              // and swipe; release past the threshold to commit a step.
              drag={isActive ? "x" : false}
              dragSnapToOrigin
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -DRAG_THRESHOLD) setActive((a) => a + 1);
                else if (info.offset.x > DRAG_THRESHOLD) setActive((a) => a - 1);
              }}
            >
              <img
                src={card.image}
                alt={card.title}
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-6 text-white">
                <h3 className="text-4xl font-bold tracking-tight">
                  {card.title}
                </h3>
                <button
                  type="button"
                  className="w-full rounded-full bg-black/70 py-3 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-black"
                >
                  Get this product
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CardsSlider;
