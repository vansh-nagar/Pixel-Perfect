/**
 * A paper map of hinged panels that folds itself up like an accordion and flattens back out.
 */
"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import type { ReactNode } from "react";

const PANEL_COUNT = 5;
const PANEL_WIDTH = 44;
const PANEL_HEIGHT = 104;
const FOLD_ANGLE = 80;

const foldTransition: Transition = {
  duration: 3.2,
  ease: "easeInOut",
  repeat: Infinity,
  repeatDelay: 0.6,
};

const PanelArt = ({ index }: { index: number }) => (
  <div className="pointer-events-none absolute inset-0 p-1.5">
    <div className="h-full w-full border border-dashed border-foreground/20" />
    <div
      className="absolute size-1.5 rounded-full bg-foreground/50"
      style={{
        left: `${25 + ((index * 37) % 50)}%`,
        top: `${20 + ((index * 53) % 60)}%`,
      }}
    />
  </div>
);

const AccordionFold = () => {
  const shouldReduceMotion = useReducedMotion();

  // build the hinge chain from the last panel inward — each panel folds
  // relative to the previous one
  let chain: ReactNode = null;
  for (let i = PANEL_COUNT - 1; i >= 1; i--) {
    const angle = i % 2 ? -FOLD_ANGLE : FOLD_ANGLE;
    chain = (
      <motion.div
        className="absolute top-0 border border-foreground/25 bg-muted"
        style={{
          left: "100%",
          width: PANEL_WIDTH,
          height: PANEL_HEIGHT,
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
        }}
        animate={shouldReduceMotion ? undefined : { rotateY: [0, angle, 0] }}
        transition={foldTransition}
      >
        <PanelArt index={i} />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          animate={
            shouldReduceMotion
              ? undefined
              : { opacity: [0, i % 2 ? 0.25 : 0.1, 0] }
          }
          initial={{ opacity: 0 }}
          transition={foldTransition}
        />
        {chain}
      </motion.div>
    );
  }

  return (
    <div style={{ perspective: 900 }}>
      <div
        style={{
          transform: `translateX(-${(PANEL_WIDTH * (PANEL_COUNT - 1)) / 2}px) rotateX(12deg) rotateY(-16deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="relative border border-foreground/25 bg-muted"
          style={{
            width: PANEL_WIDTH,
            height: PANEL_HEIGHT,
            transformStyle: "preserve-3d",
          }}
        >
          <PanelArt index={0} />
          {chain}
        </div>
      </div>
    </div>
  );
};

export default AccordionFold;
