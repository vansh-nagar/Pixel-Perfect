/**
 * A miniature orrery: planets circling a pulsing sun on a tilted orbital plane seen in perspective.
 */
"use client";

import { motion } from "framer-motion";

const PLANE_TILT = 64;

const ORBITS = [
  { radius: 26, duration: 3.5, planet: 6 },
  { radius: 42, duration: 6.5, planet: 8 },
  { radius: 58, duration: 10, planet: 5 },
];

const OrbitOrrery = () => {
  return (
    <div style={{ perspective: 800 }}>
      <div
        className="relative size-32"
        style={{
          transform: `rotateX(${PLANE_TILT}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {ORBITS.map((orbit, i) => (
          <div
            key={orbit.radius}
            className="absolute"
            style={{
              width: orbit.radius * 2,
              height: orbit.radius * 2,
              left: `calc(50% - ${orbit.radius}px)`,
              top: `calc(50% - ${orbit.radius}px)`,
            }}
          >
            <div
              className={`absolute inset-0 rounded-full border border-foreground/20 ${
                i === ORBITS.length - 1 ? "border-dashed" : ""
              }`}
            />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{
                duration: orbit.duration,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              <div
                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/80"
                style={{ width: orbit.planet, height: orbit.planet }}
              />
            </motion.div>
          </div>
        ))}

        {/* the sun, counter-tilted to face the viewer */}
        <div
          className="absolute inset-0 grid place-items-center"
          style={{
            transform: `rotateX(-${PLANE_TILT}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            className="size-3.5 rounded-full bg-foreground"
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
};

export default OrbitOrrery;
