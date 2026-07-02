/**
 * An isometric stack of UI layers that lifts apart on hover, exploding the interface into its depth layers.
 */
"use client";

import { motion } from "framer-motion";

const LAYERS = [
  { key: "base", lift: 0 },
  { key: "content", lift: 28 },
  { key: "chip", lift: 56 },
  { key: "badge", lift: 84 },
];

const layerVariants = {
  rest: { z: 0 },
  lift: (lift: number) => ({ z: lift }),
};

const HoverLayerStack = () => {
  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="lift"
      className="cursor-pointer"
      style={{ perspective: 1200 }}
    >
      <div
        style={{
          transform: "rotateX(55deg) rotateZ(-45deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="relative size-28"
          style={{ transformStyle: "preserve-3d" }}
        >
          {LAYERS.map((layer, i) => (
            <motion.div
              key={layer.key}
              custom={layer.lift}
              variants={layerVariants}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="absolute inset-0 rounded-lg border border-foreground/30 bg-background/80"
              style={{ transformStyle: "preserve-3d" }}
            >
              {i === 1 && (
                <div className="flex h-full flex-col justify-center gap-1.5 p-3">
                  <div className="h-1.5 w-3/4 rounded-full bg-foreground/25" />
                  <div className="h-1.5 w-1/2 rounded-full bg-foreground/20" />
                  <div className="h-1.5 w-2/3 rounded-full bg-foreground/15" />
                </div>
              )}
              {i === 2 && (
                <div className="flex h-full items-end justify-end p-3">
                  <div className="h-5 w-10 rounded-md bg-foreground/70" />
                </div>
              )}
              {i === 3 && (
                <div className="flex h-full items-start justify-start p-3">
                  <div className="size-5 rounded-full border border-foreground/40 bg-foreground/10" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HoverLayerStack;
