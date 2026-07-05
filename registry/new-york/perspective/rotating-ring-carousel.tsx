/**
 * Numbered panels arranged in a 3D ring, slowly orbiting the Y axis like a cylindrical carousel.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";

const PANEL_COUNT = 8;
const PANEL_WIDTH = 56;
const PANEL_HEIGHT = 80;
const RADIUS = Math.round(
  PANEL_WIDTH / 2 / Math.tan(Math.PI / PANEL_COUNT) + 16,
);

const RotatingRingCarousel = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div style={{ perspective: 900 }}>
      <div
        style={{ transform: "rotateX(-14deg)", transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="relative"
          style={{
            width: PANEL_WIDTH,
            height: PANEL_HEIGHT,
            transformStyle: "preserve-3d",
          }}
          animate={shouldReduceMotion ? undefined : { rotateY: -360 }}
          transition={{ duration: 18, ease: "linear", repeat: Infinity }}
        >
          {Array.from({ length: PANEL_COUNT }, (_, i) => (
            <div
              key={i}
              className="absolute inset-0 flex flex-col justify-between border border-foreground/30 bg-background/60 p-1.5 backdrop-blur-sm"
              style={{
                transform: `rotateY(${(360 / PANEL_COUNT) * i}deg) translateZ(${RADIUS}px)`,
              }}
            >
              <span className="text-[9px] font-medium tabular-nums text-foreground/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="h-1 w-2/3 rounded-full bg-foreground/25" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default RotatingRingCarousel;
