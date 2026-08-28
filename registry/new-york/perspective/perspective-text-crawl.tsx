/**
 * An opening-crawl of text scrolling up a tilted plane and fading into the distance, movie-style.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Sizes are in container units (cqh/cqw) so the crawl keeps its proportions
 * at any container size — see the `containerType: "size"` wrapper below.
 */
const CrawlCopy = () => (
  <div className="flex flex-col items-center gap-[2.4cqh] pb-[16cqh] text-center">
    <span className="text-[2.4cqh] tracking-[0.35em] text-foreground/50">
      BATCH III
    </span>
    <span className="text-[3.6cqh] font-semibold tracking-[0.25em] text-foreground/80">
      PIXEL PERFECT
    </span>
    <p className="text-[3.2cqh] leading-relaxed text-foreground/60">
      A long time ago, in a playground far, far away, animations were built one
      at a time. Each one promoted from scratchpad to registry, synced, and
      shipped to the grid.
    </p>
    <p className="text-[3.2cqh] leading-relaxed text-foreground/60">
      Armed with nothing but transforms and a perspective container, the
      components set course for the vanishing point, determined to restore depth
      to the flat and motion to the still…
    </p>
  </div>
);

const PerspectiveTextCrawl = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="grid h-full min-h-[16rem] w-full place-items-center overflow-hidden"
      style={{ containerType: "size" }}
    >
      {/* Plane is taller than the frame so the tilt still fills it top to bottom,
          and narrower than it so the near edge never flares past the sides. */}
      <div className="h-[112cqh] w-[72cqw]" style={{ perspective: "170cqh" }}>
        <div
          className="h-full w-full overflow-hidden px-[1.5cqw]"
          style={{
            transform: "rotateX(40deg)",
            maskImage:
              "linear-gradient(to bottom, transparent 4%, black 45%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 4%, black 45%, black 100%)",
          }}
        >
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: ["0%", "-33.333%"] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          >
            <CrawlCopy />
            <CrawlCopy />
            <CrawlCopy />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PerspectiveTextCrawl;
