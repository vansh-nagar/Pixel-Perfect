"use client";

/**
 * An accordion of flat colour panels — the active panel springs wide to reveal its pattern and caption while the rest compress into slim slivers with sideways titles. Click a panel to expand it; it auto-advances until hovered.
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Flat, high-contrast swatches: a solid fill, one hard-edged motif, and a text colour that reads on it.
const SWATCHES = [
  { bg: "#ff5f1f", ink: "#151515", motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px" },
  { bg: "#2d4bff", ink: "#ffffff", motif: "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px" },
  { bg: "#f6a8f2", ink: "#151515", motif: "repeating-radial-gradient(circle at 30% 70%, #ff5f1f 0 12px, transparent 12px 34px)" },
  { bg: "#ffb000", ink: "#151515", motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)" },
  { bg: "#6b3ce6", ink: "#ffffff", motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px" },
  { bg: "#9dbbff", ink: "#151515", motif: "repeating-linear-gradient(0deg, #2d4bff 0 6px, transparent 6px 22px)" },
];

const PANELS = [
  { title: "Dunes", subtitle: "Erg Chebbi, Morocco" },
  { title: "Fjord", subtitle: "Lofoten, Norway" },
  { title: "Canopy", subtitle: "Monteverde, Costa Rica" },
  { title: "Basalt", subtitle: "Reynisfjara, Iceland" },
  { title: "Mesa", subtitle: "Bardenas, Spain" },
];

const AccordionCarousel = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % PANELS.length),
      3000,
    );
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="flex h-[80vh] w-full select-none items-center justify-center"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="flex h-[70%] w-[min(1050px,92%)] gap-2.5">
        {PANELS.map((panel, i) => {
          const isActive = i === active;
          const swatch = SWATCHES[i % SWATCHES.length];
          return (
            <motion.div
              key={panel.title}
              initial={false}
              animate={{ flexGrow: isActive ? 7 : 1 }}
              transition={{ type: "spring", stiffness: 170, damping: 26 }}
              onClick={() => setActive(i)}
              className="relative min-w-0 basis-0 cursor-pointer overflow-hidden rounded-2xl"
              style={{
                background: `${swatch.motif}, ${swatch.bg}`,
                color: swatch.ink,
              }}
            >

              {/* sideways label while collapsed */}
              <motion.p
                initial={false}
                animate={{ opacity: isActive ? 0 : 1 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1 py-2 text-xs font-medium uppercase tracking-[0.25em]"
                style={{ writingMode: "vertical-rl", backgroundColor: swatch.bg }}
              >
                {panel.title}
              </motion.p>

              {/* full caption once expanded */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  y: isActive ? 0 : 14,
                }}
                transition={{ duration: 0.4, delay: isActive ? 0.18 : 0 }}
                className="pointer-events-none absolute bottom-5 left-6 rounded-lg px-3 py-2"
                style={{ backgroundColor: swatch.bg }}
              >
                <h3 className="text-2xl font-semibold tracking-tight">
                  {panel.title}
                </h3>
                <p className="mt-0.5 text-xs opacity-70">{panel.subtitle}</p>
              </motion.div>

              <p
                className="pointer-events-none absolute right-4 top-4 rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: swatch.bg }}
              >
                0{i + 1}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AccordionCarousel;
