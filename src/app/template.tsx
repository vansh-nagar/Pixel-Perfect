"use client";

import { motion } from "motion/react";
import { useRef } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onAnimationComplete={() => {
        const el = ref.current;
        if (el) {
          el.style.transform = "none";
          el.style.filter = "none";
          el.style.willChange = "auto";
        }
      }}
    >
      {children}
    </motion.div>
  );
}
