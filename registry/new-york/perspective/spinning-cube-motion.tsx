/**
 * A 3D cube continuously spinning on its Y axis, built with CSS 3D transforms and driven by Framer Motion.
 */
"use client";

import { motion } from "framer-motion";

const SIZE = 100;
const HALF = SIZE / 2;

const faces = [
  { label: "front", transform: `rotateY(0deg) translateZ(${HALF}px)` },
  { label: "back", transform: `rotateY(180deg) translateZ(${HALF}px)` },
  { label: "right", transform: `rotateY(90deg) translateZ(${HALF}px)` },
  { label: "left", transform: `rotateY(-90deg) translateZ(${HALF}px)` },
  { label: "top", transform: `rotateX(90deg) translateZ(${HALF}px)` },
  { label: "bottom", transform: `rotateX(-90deg) translateZ(${HALF}px)` },
];

const SpinningCubeMotion = () => {
  return (
    <div style={{ perspective: 800 }}>
      <div style={{ transform: "rotateX(-20deg)", transformStyle: "preserve-3d" }}>
        <motion.div
          className="relative"
          style={{
            width: SIZE,
            height: SIZE,
            transformStyle: "preserve-3d",
          }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 12, ease: "linear", repeat: Infinity }}
        >
          {faces.map((face) => (
            <div
              key={face.label}
              className="absolute grid place-items-center border border-white/30 bg-white/5 text-[10px] font-medium uppercase tracking-widest text-white/70 backdrop-blur-sm"
              style={{
                width: SIZE,
                height: SIZE,
                transform: face.transform,
              }}
            >
              {face.label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SpinningCubeMotion;
