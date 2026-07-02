/**
 * An open book lying in perspective, endlessly turning its pages with a 3D flip around the spine.
 */
"use client";

import { motion } from "framer-motion";

const PAGE_WIDTH = 72;
const PAGE_HEIGHT = 96;

const PageLines = ({ widths }: { widths: string[] }) => (
  <div className="flex h-full flex-col justify-center gap-2 p-2.5">
    {widths.map((w, i) => (
      <div key={i} className="h-1 rounded-full bg-foreground/20" style={{ width: w }} />
    ))}
  </div>
);

const PageFlipBook = () => {
  return (
    <div style={{ perspective: 1000 }}>
      <div
        style={{
          transform: "rotateX(50deg) rotateZ(-6deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="relative"
          style={{
            width: PAGE_WIDTH * 2,
            height: PAGE_HEIGHT,
            transformStyle: "preserve-3d",
          }}
        >
          {/* page stack under the book */}
          <div className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-md bg-foreground/10" />

          {/* left page */}
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-md border border-r-0 border-foreground/25 bg-muted">
            <PageLines widths={["80%", "65%", "72%", "50%"]} />
          </div>
          {/* right page revealed after the flip */}
          <div className="absolute inset-y-0 right-0 w-1/2 rounded-r-md border border-l-0 border-foreground/25 bg-muted">
            <PageLines widths={["70%", "78%", "55%", "68%"]} />
          </div>

          {/* the turning page */}
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2"
            style={{
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
            }}
            animate={{ rotateY: [0, -180] }}
            transition={{
              duration: 1.4,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            <div
              className="absolute inset-0 rounded-r-md border border-l-0 border-foreground/25 bg-muted"
              style={{ backfaceVisibility: "hidden" }}
            >
              <PageLines widths={["60%", "75%", "68%", "45%"]} />
            </div>
            <div
              className="absolute inset-0 rounded-l-md border border-r-0 border-foreground/25 bg-muted"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <PageLines widths={["72%", "58%", "80%", "62%"]} />
            </div>
          </motion.div>

          {/* spine */}
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/30" />
        </div>
      </div>
    </div>
  );
};

export default PageFlipBook;
