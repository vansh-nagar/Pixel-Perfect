/**
 * A grid of two-faced tiles flipping in a diagonal 3D wave, revealing their dark side and back again.
 */
"use client";

import { motion } from "framer-motion";

const GRID_SIZE = 4;
const TILE = 30;

const FlipTileWave = () => {
  return (
    <div style={{ perspective: 600 }}>
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE}px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const row = Math.floor(i / GRID_SIZE);
          const col = i % GRID_SIZE;
          return (
            <motion.div
              key={i}
              className="relative"
              style={{
                width: TILE,
                height: TILE,
                transformStyle: "preserve-3d",
              }}
              animate={{ rotateY: 180 }}
              transition={{
                duration: 0.7,
                ease: "easeInOut",
                delay: (row + col) * 0.12,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 1.2,
              }}
            >
              <div
                className="absolute inset-0 rounded-sm border border-foreground/30 bg-foreground/5"
                style={{ backfaceVisibility: "hidden" }}
              />
              <div
                className="absolute inset-0 rounded-sm bg-foreground/80"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FlipTileWave;
