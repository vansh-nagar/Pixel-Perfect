/**
 * A vertical FAQ list with macOS-Dock fisheye magnification — rows scale by their distance from the cursor and the nearest one springs open, its answer resolving out of blur.
 */
"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

const FAQS = [
  {
    q: "What is a fisheye?",
    a: "Each row scales by its distance from the cursor — the same math macOS uses to magnify Dock icons.",
  },
  {
    q: "Does it open on hover?",
    a: "Yes — the row nearest the pointer springs open automatically, no click required.",
  },
  {
    q: "Why so smooth?",
    a: "Row centres are cached and refreshed only on layout change, so magnification never chases a moving target.",
  },
  {
    q: "Reduced motion?",
    a: "Respected — the scaling, springs and blur drop out, leaving a plain toggle.",
  },
];

// Distance (px, cursor → row centre) at which magnification fully falls off.
const RANGE = 110;
const MAX_SCALE = 1.12;

// Snappy, critically-damped tracking — follows the pointer with no overshoot.
const TRACK_SPRING = { stiffness: 260, damping: 26, mass: 0.6 } as const;
// Asymmetric reveal: bounce out on open, settle in on close.
const OPEN_SPRING = { type: "spring", visualDuration: 0.42, bounce: 0.2 } as const;
const CLOSE_SPRING = { type: "spring", visualDuration: 0.4, bounce: 0 } as const;
const ICON_SPRING = { type: "spring", visualDuration: 0.3, bounce: 0.25 } as const;

function FaqRow({
  index,
  q,
  a,
  pointerY,
  centers,
  active,
  onActivate,
  registerRef,
  reduce,
}: {
  index: number;
  q: string;
  a: string;
  pointerY: MotionValue<number>;
  centers: { current: number[] };
  active: boolean;
  onActivate: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  reduce: boolean | null;
}) {
  // Reads a CACHED centre — no getBoundingClientRect per frame, so no layout
  // thrash and no chasing a row that's mid-reflow.
  const scaleTarget = useTransform(pointerY, (y) => {
    const c = centers.current[index];
    if (c == null || !Number.isFinite(c)) return 1;
    const t = Math.max(0, 1 - Math.abs(y - c) / RANGE);
    return 1 + t * (MAX_SCALE - 1);
  });
  const scale = useSpring(scaleTarget, TRACK_SPRING);

  return (
    <motion.div
      ref={registerRef}
      onMouseEnter={onActivate}
      style={{
        scale: reduce ? 1 : scale,
        transformOrigin: "center",
        willChange: "transform",
        zIndex: active ? 2 : 1,
      }}
      className="relative rounded-xl border border-neutral-200 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
          {q}
        </span>
        <motion.span
          animate={{ rotate: active ? 45 : 0 }}
          transition={ICON_SPRING}
          className="shrink-0 text-lg leading-none text-neutral-400"
        >
          +
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0, filter: reduce ? "none" : "blur(8px)" }}
            animate={{
              height: "auto",
              opacity: 1,
              filter: "blur(0px)",
              transition: OPEN_SPRING,
            }}
            exit={{
              height: 0,
              opacity: 0,
              filter: reduce ? "none" : "blur(8px)",
              transition: CLOSE_SPRING,
            }}
            className="overflow-hidden"
          >
            <p className="pt-1.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FisheyeFaq() {
  const reduce = useReducedMotion();
  const pointerY = useMotionValue(-9999);
  const [active, setActive] = useState<number | null>(null);

  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const centers = useRef<number[]>([]);

  // Measure every row's viewport-Y centre. Scale-immune (center origin keeps the
  // measured centre fixed), so it's safe to run even while a row is magnified.
  const measure = () => {
    centers.current = rowsRef.current.map((el) => {
      if (!el) return Infinity;
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
  };

  // Refresh the cache only when it can actually go stale — the accordion resizing
  // a row, a scroll, or a viewport resize. Never on the animation frame.
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    rowsRef.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      onMouseMove={(e) => pointerY.set(e.clientY)}
      onMouseLeave={() => {
        pointerY.set(-9999);
        setActive(null);
      }}
      className="flex w-[260px] flex-col gap-2"
    >
      {FAQS.map((faq, i) => (
        <FaqRow
          key={faq.q}
          index={i}
          q={faq.q}
          a={faq.a}
          pointerY={pointerY}
          centers={centers}
          active={active === i}
          onActivate={() => setActive(i)}
          registerRef={(el) => {
            rowsRef.current[i] = el;
          }}
          reduce={reduce}
        />
      ))}
    </div>
  );
}
