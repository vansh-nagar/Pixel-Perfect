/**
 * A hanging shop sign swinging toward and away from the camera on its strings like a pendulum.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";

const SwingingSign = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div style={{ perspective: 700 }}>
      <div className="flex flex-col items-center">
        <div className="h-1.5 w-28 rounded-full bg-foreground/50" />
        <motion.div
          className="-mt-0.5 flex flex-col items-center"
          style={{
            transformOrigin: "top center",
            transformStyle: "preserve-3d",
          }}
          initial={{ rotateX: 32 }}
          animate={{ rotateX: shouldReduceMotion ? 0 : -32 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                }
          }
        >
          <div className="flex w-16 justify-between">
            <div className="h-9 w-px bg-foreground/40" />
            <div className="h-9 w-px bg-foreground/40" />
          </div>
          <div className="grid h-16 w-28 place-items-center rounded-md border-2 border-foreground/30 bg-muted">
            <span className="text-sm font-semibold tracking-[0.3em] text-foreground/80">
              OPEN
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SwingingSign;
