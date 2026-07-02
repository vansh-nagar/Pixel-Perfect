/**
 * An opening-crawl of text scrolling up a tilted plane and fading into the distance, movie-style.
 */
"use client";

import { motion } from "framer-motion";

const CrawlCopy = () => (
  <div className="flex flex-col items-center gap-3 pb-10 text-center">
    <span className="text-[8px] tracking-[0.35em] text-foreground/50">
      BATCH III
    </span>
    <span className="text-xs font-semibold tracking-[0.25em] text-foreground/80">
      PIXEL PERFECT
    </span>
    <p className="text-[9px] leading-relaxed text-foreground/60">
      A long time ago, in a playground far, far away, animations were built one
      at a time. Each one promoted from scratchpad to registry, synced, and
      shipped to the grid.
    </p>
    <p className="text-[9px] leading-relaxed text-foreground/60">
      Armed with nothing but transforms and a perspective container, the
      components set course for the vanishing point, determined to restore
      depth to the flat and motion to the still…
    </p>
  </div>
);

const PerspectiveTextCrawl = () => {
  return (
    <div style={{ perspective: 300 }}>
      <div
        className="h-44 w-48 overflow-hidden px-4"
        style={{
          transform: "rotateX(40deg)",
          maskImage:
            "linear-gradient(to bottom, transparent 4%, black 45%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 4%, black 45%, black 100%)",
        }}
      >
        <motion.div
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 16, ease: "linear", repeat: Infinity }}
        >
          <CrawlCopy />
          <CrawlCopy />
        </motion.div>
      </div>
    </div>
  );
};

export default PerspectiveTextCrawl;
