/**
 * Concentric frames flying out of the screen toward the viewer in an endless, slowly twisting depth tunnel.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";

const FRAME_COUNT = 6;
const DURATION = 6;

const DepthTunnel = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="relative"
      style={{ width: 160, height: 160, perspective: 500 }}
    >
      <div className="absolute inset-0 m-auto size-1 rounded-full bg-foreground/40" />
      {Array.from({ length: FRAME_COUNT }, (_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 m-auto size-32 rounded-xl border-2 border-foreground/40"
          animate={
            shouldReduceMotion
              ? {
                  z: -60 - i * 90,
                  rotate: i * 15,
                  opacity: 1 - i / FRAME_COUNT,
                }
              : {
                  z: [-700, 300],
                  rotate: [i * 15, i * 15 + 90],
                  opacity: [0, 1, 1, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: DURATION,
                  ease: "linear",
                  repeat: Infinity,
                  delay: -((i * DURATION) / FRAME_COUNT),
                }
          }
        />
      ))}
    </div>
  );
};

export default DepthTunnel;
