"use client";

import { motion } from "framer-motion";

const OrbitDotMotion = () => {
  return (
    <div
      className="relative"
      style={{ perspective: "900px", transformStyle: "preserve-3d" }}
    >
      <div className="h-24 w-24 rounded-full bg-[#21201C]" />

      <motion.div
        className="absolute left-1/2 top-1/2 h-8 w-8 rounded-full bg-[#FAD757] will-change-transform"
        initial={{
          transform:
            "translate(-50%, -50%) rotateY(0deg) translateZ(74px) rotateY(360deg)",
        }}
        animate={{
          transform:
            "translate(-50%, -50%) rotateY(360deg) translateZ(74px)  rotateY(0deg)",
        }}
        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
};

export default OrbitDotMotion;
