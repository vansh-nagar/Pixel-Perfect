/**
 * A split-flap clock digit that folds down every tick like a mechanical departure board.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const WIDTH = 72;
const HEIGHT = 96;

const DigitHalf = ({
  digit,
  part,
}: {
  digit: number;
  part: "top" | "bottom";
}) => (
  <div
    className="absolute inset-x-0 flex justify-center overflow-hidden font-mono text-5xl font-semibold text-foreground"
    style={{ height: HEIGHT, top: part === "top" ? 0 : -HEIGHT / 2 }}
  >
    <span className="leading-[96px]">{digit}</span>
  </div>
);

const FlipClockCounter = () => {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1400);
    return () => clearInterval(id);
  }, []);

  const current = count % 10;
  const next = (count + 1) % 10;

  return (
    <div style={{ perspective: 400 }}>
      <div
        className="relative"
        style={{ width: WIDTH, height: HEIGHT, transformStyle: "preserve-3d" }}
      >
        {/* static top half — shows the digit revealed once the flap falls */}
        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-lg border border-b-0 border-foreground/15 bg-muted">
          <DigitHalf digit={next} part="top" />
        </div>
        {/* static bottom half — shows the current digit until the flap lands */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-lg border border-t-0 border-foreground/15 bg-muted">
          <DigitHalf digit={current} part="bottom" />
        </div>

        {/* the flap that folds down on every tick */}
        <motion.div
          key={count}
          className="absolute inset-x-0 top-0 z-10 h-1/2"
          style={{ transformOrigin: "bottom", transformStyle: "preserve-3d" }}
          initial={{ rotateX: 0 }}
          animate={{ rotateX: -180 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.55, ease: "easeIn" }
          }
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-t-lg border border-b-0 border-foreground/15 bg-muted"
            style={{
              backfaceVisibility: "hidden",
              transform: "translateZ(0.4px)",
            }}
          >
            <DigitHalf digit={current} part="top" />
          </div>
          <div
            className="absolute inset-0 overflow-hidden rounded-b-lg border border-t-0 border-foreground/15 bg-muted"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateX(180deg) translateZ(0.4px)",
            }}
          >
            <DigitHalf digit={next} part="bottom" />
          </div>
        </motion.div>

        <div className="absolute inset-x-0 top-1/2 z-20 h-px -translate-y-1/2 bg-background" />
      </div>
    </div>
  );
};

export default FlipClockCounter;
