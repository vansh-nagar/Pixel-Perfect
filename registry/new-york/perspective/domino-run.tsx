/**
 * A receding row of dominoes toppling toward the camera one by one, then standing back up in a wave.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";

const DOMINO_COUNT = 6;
const SPACING = 26;

const DominoRun = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div style={{ perspective: 600 }}>
      <div
        className="relative size-40"
        style={{
          transform: "rotateX(6deg) rotateY(-30deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {Array.from({ length: DOMINO_COUNT }, (_, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translateZ(${-i * SPACING}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <motion.div
              className="flex h-14 w-9 flex-col justify-between rounded-sm border border-foreground/30 bg-muted p-1.5"
              style={{ transformOrigin: "bottom" }}
              initial={{ rotateX: 0 }}
              animate={shouldReduceMotion ? undefined : { rotateX: -78 }}
              transition={{
                duration: 0.5,
                ease: "easeIn",
                delay: (DOMINO_COUNT - 1 - i) * 0.22,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 1.6,
              }}
            >
              <div className="flex justify-center">
                <div className="size-1.5 rounded-full bg-foreground/50" />
              </div>
              <div className="h-px w-full bg-foreground/25" />
              <div className="flex justify-between">
                <div className="size-1.5 rounded-full bg-foreground/50" />
                <div className="size-1.5 rounded-full bg-foreground/50" />
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DominoRun;
