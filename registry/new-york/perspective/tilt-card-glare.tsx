/**
 * A mouse-tracked 3D tilt card with parallax depth layers and a moving glare highlight.
 */
"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const TiltCardGlare = () => {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const spring = { stiffness: 200, damping: 20 };
  const rotateX = useSpring(useTransform(py, [0, 1], [14, -14]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-14, 14]), spring);

  const glareX = useTransform(px, [0, 1], [0, 100]);
  const glareY = useTransform(py, [0, 1], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.25), transparent 60%)`;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (shouldReduceMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handlePointerLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div style={{ perspective: 800 }}>
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative h-52 w-40 rounded-xl border border-foreground/20 bg-foreground/5 p-4"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ background: glare }}
        />
        <div
          className="flex h-full flex-col justify-between"
          style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
        >
          <div className="size-8 rounded-full border border-foreground/30 bg-foreground/10" />
          <div className="flex flex-col gap-2">
            <div className="h-2 w-3/4 rounded-full bg-foreground/30" />
            <div className="h-2 w-1/2 rounded-full bg-foreground/20" />
          </div>
          <span
            className="w-fit rounded-full border border-foreground/30 px-2 py-0.5 text-[8px] uppercase tracking-widest text-foreground/70"
            style={{ transform: "translateZ(30px)" }}
          >
            hover me
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default TiltCardGlare;
