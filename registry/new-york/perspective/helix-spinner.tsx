/**
 * A column of bars, each offset a few degrees on the Y axis, spinning together as a twisting 3D helix.
 */
"use client";

import { motion } from "framer-motion";

const BAR_COUNT = 16;
const TWIST_PER_BAR = -18;

const HelixSpinner = () => {
  return (
    <div style={{ perspective: 700 }}>
      <div
        className="flex flex-col items-center gap-[3px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <motion.div
            key={i}
            className="h-1 w-24 rounded-full bg-foreground/60"
            initial={{ rotateY: i * TWIST_PER_BAR }}
            animate={{ rotateY: i * TWIST_PER_BAR + 360 }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
};

export default HelixSpinner;
