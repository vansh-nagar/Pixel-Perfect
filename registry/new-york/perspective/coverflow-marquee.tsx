/**
 * An endless coverflow: cards glide across the stage, swinging flat as they pass center, with floor reflections.
 */
"use client";

import { motion } from "framer-motion";

const CARD_COUNT = 5;
const DURATION = 6;

const CardArt = ({ index }: { index: number }) => (
  <div className="flex h-20 w-16 flex-col items-center justify-center gap-1.5 rounded-md border border-foreground/30 bg-muted">
    <span className="font-mono text-lg text-foreground/60">
      {String(index + 1).padStart(2, "0")}
    </span>
    <div className="h-1 w-8 rounded-full bg-foreground/25" />
    <div className="h-1 w-5 rounded-full bg-foreground/15" />
  </div>
);

const CoverflowMarquee = () => {
  return (
    <div style={{ perspective: 700 }}>
      <div
        className="relative h-48 w-56"
        style={{ transformStyle: "preserve-3d" }}
      >
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 m-auto h-fit w-fit"
            style={{ transformStyle: "preserve-3d" }}
            animate={{
              x: [150, -150],
              rotateY: [-55, -55, 0, 55, 55],
              z: [0, 0, 70, 0, 0],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: DURATION,
              ease: "linear",
              repeat: Infinity,
              delay: -((i * DURATION) / CARD_COUNT),
            }}
          >
            <CardArt index={i} />
            <div
              className="mt-0.5 opacity-60"
              style={{
                transform: "scaleY(-1)",
                maskImage:
                  "linear-gradient(to top, rgba(0,0,0,0.45), transparent 65%)",
                WebkitMaskImage:
                  "linear-gradient(to top, rgba(0,0,0,0.45), transparent 65%)",
              }}
            >
              <CardArt index={i} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CoverflowMarquee;
