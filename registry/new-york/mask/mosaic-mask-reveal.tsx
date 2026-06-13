"use client";

/**
 * A mosaic mask reveal — the image is rebuilt from a grid of square tiles that pop in with a staggered order (from the center, edges, randomly, or a corner) until the picture is whole.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";
const COLS = 8;
const ROWS = 5;

export type MosaicOrder = "center" | "edges" | "random" | "start" | "end";

// every tile carries the full image, scaled up COLS×ROWS and offset to its own
// cell, so the grid reconstructs the picture (sprite-sheet math).
const tiles = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    key: i,
    backgroundImage: `url(${SRC})`,
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(c / (COLS - 1)) * 100}% ${(r / (ROWS - 1)) * 100}%`,
  };
});

const MosaicMaskReveal = ({
  order = "center",
}: {
  order?: MosaicOrder;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const reveal = () => {
    const grid = gridRef.current;
    if (!grid) return;
    gsap.fromTo(
      grid.children,
      { opacity: 0, scale: 0.4 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "power3.out",
        stagger: { each: 0.025, grid: [ROWS, COLS], from: order },
      },
    );
  };

  useEffect(() => {
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  return (
    <button
      onClick={reveal}
      className="relative aspect-video w-[40rem] max-w-[92%] cursor-pointer overflow-hidden rounded-xl"
      aria-label="Replay reveal"
    >
      <div
        ref={gridRef}
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {tiles.map((t) => (
          <div
            key={t.key}
            style={{
              backgroundImage: t.backgroundImage,
              backgroundSize: t.backgroundSize,
              backgroundPosition: t.backgroundPosition,
              opacity: 0,
              transform: "scale(0.4)",
            }}
          />
        ))}
      </div>
    </button>
  );
};

export default MosaicMaskReveal;
