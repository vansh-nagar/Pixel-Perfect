/**
 * An endless coverflow: cards glide across the stage, swinging flat as they pass center, with floor reflections.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";

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
  const shouldReduceMotion = useReducedMotion();

  return (
    <div style={{ perspective: 700 }}>
      <div
        className="relative h-48 w-56"
        style={{ transformStyle: "preserve-3d" }}
      >
        {Array.from({ length: CARD_COUNT }, (_, i) => {
          const loop = {
            duration: DURATION,
            repeat: Infinity,
            delay: -((i * DURATION) / CARD_COUNT),
          };
          return (
          <motion.div
            key={i}
            className="absolute inset-0 m-auto h-fit w-fit"
            style={{ transformStyle: "preserve-3d" }}
            animate={
              shouldReduceMotion
                ? { x: 0, rotateY: 0, z: 70, opacity: i === 0 ? 1 : 0 }
                : {
                    x: [150, -150],
                    rotateY: [-55, -55, 0, 55, 55],
                    z: [0, 0, 70, 0, 0],
                    opacity: [0, 1, 1, 1, 0],
                  }
            }
            // the conveyor (x) stays linear like a marquee; the swing
            // through center eases so cards don't snap flat mechanically
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    ...loop,
                    ease: "linear",
                    rotateY: { ...loop, ease: "easeInOut" },
                    z: { ...loop, ease: "easeInOut" },
                  }
            }
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
          );
        })}
      </div>
    </div>
  );
};

export default CoverflowMarquee;
