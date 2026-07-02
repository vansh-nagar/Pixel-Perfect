/**
 * Three rings spinning on tilted axes around a pulsing core, forming a 3D gyroscope with orbiting beads.
 */
"use client";

import { motion } from "framer-motion";

const RINGS = [
  { tilt: 0, duration: 4.5, opacity: "border-foreground/70" },
  { tilt: 60, duration: 6, opacity: "border-foreground/45" },
  { tilt: 120, duration: 7.5, opacity: "border-foreground/30" },
];

const GyroscopeRings = () => {
  return (
    <div style={{ perspective: 800 }}>
      <div
        className="relative size-32"
        style={{ transformStyle: "preserve-3d" }}
      >
        {RINGS.map((ring) => (
          <div
            key={ring.tilt}
            className="absolute inset-0"
            style={{
              transform: `rotateY(${ring.tilt}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <motion.div
              className={`absolute inset-2 rounded-full border-2 ${ring.opacity}`}
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateX: 360 }}
              transition={{
                duration: ring.duration,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              <div className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
            </motion.div>
          </div>
        ))}

        <motion.div
          className="absolute left-1/2 top-1/2 size-3 rounded-full bg-foreground/80"
          style={{ x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
    </div>
  );
};

export default GyroscopeRings;
