"use client";

/**
 * Cards Slider — an infinite deck of product cards. The active card sits
 * front-and-centre while the rest fan out behind it, each one stepped back
 * with less scale, a touch of rotation and a soft blur. Drag, click a peeking
 * card, or let it auto-advance; the index wraps forever so the deck never ends.
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Card = { title: string };

// Flat, high-contrast swatches: a solid fill, one hard-edged motif, and a text colour that reads on it.
const SWATCHES = [
  { bg: "#ff5f1f", ink: "#151515", motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px" },
  { bg: "#2d4bff", ink: "#ffffff", motif: "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px" },
  { bg: "#f6a8f2", ink: "#151515", motif: "repeating-radial-gradient(circle at 30% 70%, #ff5f1f 0 12px, transparent 12px 34px)" },
  { bg: "#ffb000", ink: "#151515", motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)" },
  { bg: "#6b3ce6", ink: "#ffffff", motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px" },
  { bg: "#9dbbff", ink: "#151515", motif: "repeating-linear-gradient(0deg, #2d4bff 0 6px, transparent 6px 22px)" },
];

const CARDS: Card[] = [
  { title: "ZV210" },
  { title: "AX90" },
  { title: "NOVA" },
  { title: "DRIFT" },
  { title: "PULSE" },
];

const VISIBLE = 2; // cards shown on each side of the active one
const SPACING = 56; // px each step fans sideways
const DRAG_THRESHOLD = 70; // px before a drag commits to a step

const offsetFrom = (i: number, active: number, len: number) => {
  let d = (((i - active) % len) + len) % len;
  if (d > len / 2) d -= len;
  return d;
};

const CardsSlider = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = CARDS.length;

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
          const swatch = SWATCHES[i % SWATCHES.length];

          return (
            <motion.div
              key={card.title}
              className={`absolute inset-0 overflow-hidden rounded-3xl ${
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
                background: `${swatch.motif}, ${swatch.bg}`,
                color: swatch.ink,
              }}
              drag={isActive ? "x" : false}
              dragSnapToOrigin
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -DRAG_THRESHOLD) setActive((a) => a + 1);
                else if (info.offset.x > DRAG_THRESHOLD) setActive((a) => a - 1);
              }}
            >
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-6">
                <h3
                  className="rounded-xl px-3 py-1 text-4xl font-bold tracking-tight"
                  style={{ backgroundColor: swatch.bg }}
                >
                  {card.title}
                </h3>
                <button
                  type="button"
                  className="w-full rounded-full py-3 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: swatch.ink, color: swatch.bg }}
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
