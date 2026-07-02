"use client";

/**
 * An accordion of vertical image panels — the active panel springs wide to reveal its photo and caption while the rest compress into slim slivers with sideways titles. Click a panel to expand it; it auto-advances until hovered.
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const PANELS = [
  { seed: "fold-01", title: "Dunes", subtitle: "Erg Chebbi, Morocco" },
  { seed: "fold-02", title: "Fjord", subtitle: "Lofoten, Norway" },
  { seed: "fold-03", title: "Canopy", subtitle: "Monteverde, Costa Rica" },
  { seed: "fold-04", title: "Basalt", subtitle: "Reynisfjara, Iceland" },
  { seed: "fold-05", title: "Mesa", subtitle: "Bardenas, Spain" },
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
          return (
            <motion.div
              key={panel.seed}
              initial={false}
              animate={{ flexGrow: isActive ? 7 : 1 }}
              transition={{ type: "spring", stiffness: 170, damping: 26 }}
              onClick={() => setActive(i)}
              className="relative min-w-0 basis-0 cursor-pointer overflow-hidden rounded-2xl bg-neutral-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${panel.seed}/1000/800`}
                alt={panel.title}
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <motion.div
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent"
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.55 }}
              />

              {/* sideways label while collapsed */}
              <motion.p
                initial={false}
                animate={{ opacity: isActive ? 0 : 1 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium uppercase tracking-[0.25em] text-white/85"
                style={{ writingMode: "vertical-rl" }}
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
                className="pointer-events-none absolute bottom-5 left-6 text-white"
              >
                <h3 className="text-2xl font-semibold tracking-tight">
                  {panel.title}
                </h3>
                <p className="mt-0.5 text-xs text-white/70">{panel.subtitle}</p>
              </motion.div>

              <p className="pointer-events-none absolute right-4 top-4 text-[10px] font-medium text-white/60">
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
