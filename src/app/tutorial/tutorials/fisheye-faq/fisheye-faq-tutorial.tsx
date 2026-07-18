"use client";

import React, { useEffect, useRef, useState } from "react";
import { Code, Eye } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const FISHEYE_SOURCE = `"use client";

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

// Distance (px, cursor -> row centre) at which magnification fully falls off.
const RANGE = 110;
const MAX_SCALE = 1.12;

// Snappy, critically-damped tracking — follows the pointer with no overshoot.
const TRACK_SPRING = { stiffness: 260, damping: 26, mass: 0.6 } as const;
// Asymmetric reveal: bounce out on open, settle in on close.
const OPEN_SPRING = { type: "spring", visualDuration: 0.42, bounce: 0.2 } as const;
const CLOSE_SPRING = { type: "spring", visualDuration: 0.4, bounce: 0 } as const;
const ICON_SPRING = { type: "spring", visualDuration: 0.3, bounce: 0.25 } as const;

function FaqRow({ index, q, a, pointerY, centers, active, onActivate, registerRef, reduce }) {
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
        <span className="text-[13px] font-medium">{q}</span>
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
            initial={{ height: 0, opacity: 0, filter: "blur(8px)" }}
            animate={{ height: "auto", opacity: 1, filter: "blur(0px)", transition: OPEN_SPRING }}
            exit={{ height: 0, opacity: 0, filter: "blur(8px)", transition: CLOSE_SPRING }}
            className="overflow-hidden"
          >
            <p className="pt-1.5 text-[11px] leading-relaxed text-neutral-500">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FisheyeFaq() {
  const reduce = useReducedMotion();
  const pointerY = useMotionValue(-9999);
  const [active, setActive] = useState(null);

  const rowsRef = useRef([]);
  const centers = useRef([]);

  // Measure every row's viewport-Y centre. Scale-immune (center origin keeps
  // the measured centre fixed), so it's safe to run while a row is magnified.
  const measure = () => {
    centers.current = rowsRef.current.map((el) => {
      if (!el) return Infinity;
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
  };

  // Refresh the cache only when it can actually go stale — the accordion
  // resizing a row, a scroll, or a viewport resize. Never on the animation frame.
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
          {...faq}
          pointerY={pointerY}
          centers={centers}
          active={active === i}
          onActivate={() => setActive(i)}
          registerRef={(el) => (rowsRef.current[i] = el)}
          reduce={reduce}
        />
      ))}
    </div>
  );
}`;

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

const RANGE = 110;
const MAX_SCALE = 1.12;
const TRACK_SPRING = { stiffness: 260, damping: 26, mass: 0.6 } as const;
const OPEN_SPRING = {
  type: "spring",
  visualDuration: 0.42,
  bounce: 0.2,
} as const;
const CLOSE_SPRING = {
  type: "spring",
  visualDuration: 0.4,
  bounce: 0,
} as const;
const ICON_SPRING = {
  type: "spring",
  visualDuration: 0.3,
  bounce: 0.25,
} as const;

const FaqRow = ({
  index,
  q,
  a,
  pointerY,
  centers,
  active,
  onHover,
  onClick,
  registerRef,
  showFisheye,
  showSpring,
  showBlur,
}: {
  index: number;
  q: string;
  a: string;
  pointerY: MotionValue<number>;
  centers: { current: number[] };
  active: boolean;
  onHover: () => void;
  onClick: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  showFisheye: boolean;
  showSpring: boolean;
  showBlur: boolean;
}) => {
  const scaleTarget = useTransform(pointerY, (y) => {
    const c = centers.current[index];
    if (c == null || !Number.isFinite(c)) return 1;
    const t = Math.max(0, 1 - Math.abs(y - c) / RANGE);
    return 1 + t * (MAX_SCALE - 1);
  });
  const smoothed = useSpring(scaleTarget, TRACK_SPRING);

  return (
    <motion.div
      ref={registerRef}
      onMouseEnter={onHover}
      onClick={onClick}
      style={{
        scale: showFisheye ? (showSpring ? smoothed : scaleTarget) : 1,
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
            initial={{
              height: 0,
              opacity: 0,
              filter: showBlur ? "blur(8px)" : "none",
            }}
            animate={{
              height: "auto",
              opacity: 1,
              filter: "blur(0px)",
              transition: OPEN_SPRING,
            }}
            exit={{
              height: 0,
              opacity: 0,
              filter: showBlur ? "blur(8px)" : "none",
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
};

const FisheyePreview = ({
  showFisheye,
  showSpring,
  showHoverOpen,
  showBlur,
}: {
  showFisheye: boolean;
  showSpring: boolean;
  showHoverOpen: boolean;
  showBlur: boolean;
}) => {
  const pointerY = useMotionValue(-9999);
  const [active, setActive] = useState<number | null>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const centers = useRef<number[]>([]);

  useEffect(() => {
    const measure = () => {
      centers.current = rowsRef.current.map((el) => {
        if (!el) return Infinity;
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
    };
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
    <div className="flex flex-col items-center gap-6">
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
            onHover={() => {
              if (showHoverOpen) setActive(i);
            }}
            onClick={() => {
              if (!showHoverOpen) setActive(active === i ? null : i);
            }}
            registerRef={(el) => {
              rowsRef.current[i] = el;
            }}
            showFisheye={showFisheye}
            showSpring={showSpring}
            showBlur={showBlur}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        {showHoverOpen
          ? "Move your cursor slowly over the rows"
          : "Hover-open is off — click a row to toggle it"}
      </p>

      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span className={showFisheye ? "text-green-500" : "text-red-400"}>
          fisheye: {showFisheye ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showSpring ? "text-green-500" : "text-red-400"}>
          spring: {showSpring ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showHoverOpen ? "text-green-500" : "text-red-400"}>
          hover-open: {showHoverOpen ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showBlur ? "text-green-500" : "text-red-400"}>
          blur: {showBlur ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const FisheyeContent = ({
  showFisheye,
  setShowFisheye,
  showSpring,
  setShowSpring,
  showHoverOpen,
  setShowHoverOpen,
  showBlur,
  setShowBlur,
}: {
  showFisheye: boolean;
  setShowFisheye: React.Dispatch<React.SetStateAction<boolean>>;
  showSpring: boolean;
  setShowSpring: React.Dispatch<React.SetStateAction<boolean>>;
  showHoverOpen: boolean;
  setShowHoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showBlur: boolean;
  setShowBlur: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">
          How the Fisheye FAQ Works
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          The same math macOS uses to magnify Dock icons, turned vertical: a
          shared <strong>pointerY</strong> motion value broadcasts the cursor
          position, every row computes its distance from it and scales
          accordingly, and the row nearest the pointer springs open with its
          answer resolving out of blur. Row centres are{" "}
          <strong>measured once and cached</strong> — never on the animation
          frame — so magnification stays cheap and stable.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold">Distance-Based Scale</h4>
          </div>
          <ToggleButton toggle={showFisheye} setToggle={setShowFisheye} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>useTransform(pointerY, ...)</strong> maps cursor position to
          a scale per row: distance from the row&apos;s cached centre is
          normalised against <strong>RANGE</strong> (110px) into a 0-1 factor{" "}
          <strong>t</strong>, then lerped between 1 and{" "}
          <strong>MAX_SCALE</strong> (1.12). Rows under the cursor grow the
          most; rows a full RANGE away stay untouched — a linear falloff cone.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const scaleTarget = useTransform(pointerY, (y) => {
  const c = centers.current[index];       // cached row centre
  const t = Math.max(0, 1 - Math.abs(y - c) / RANGE);
  return 1 + t * (MAX_SCALE - 1);         // 1 -> 1.12
});`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: rows stay at scale 1 — a plain hover accordion.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold">Spring Tracking</h4>
          </div>
          <ToggleButton toggle={showSpring} setToggle={setShowSpring} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The raw transform output snaps to every pointer position.{" "}
          <strong>useSpring</strong> chases it instead, with a stiff,
          near-critically-damped config — the scale glides to its target with
          no overshoot and no lag you can feel. This is what turns discrete
          mouse events into liquid motion.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const TRACK_SPRING = { stiffness: 260, damping: 26, mass: 0.6 };
const scale = useSpring(scaleTarget, TRACK_SPRING);`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the raw transform drives scale directly — watch the rows
          jitter as the cursor moves.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold">Hover-Open Accordion</h4>
          </div>
          <ToggleButton toggle={showHoverOpen} setToggle={setShowHoverOpen} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>onMouseEnter</strong> on each row sets it active — no click
          needed, so the answer under your cursor is always the open one.
          Leaving the whole list resets both the pointer (to -9999, parking the
          fisheye) and the active row. The active row also gets{" "}
          <strong>zIndex: 2</strong> so its magnified edges overlap neighbours
          cleanly.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`<motion.div onMouseEnter={onActivate} style={{ zIndex: active ? 2 : 1 }}>

// list wrapper
onMouseMove={(e) => pointerY.set(e.clientY)}
onMouseLeave={() => { pointerY.set(-9999); setActive(null); }}`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: falls back to a click-to-toggle accordion.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              4
            </span>
            <h4 className="text-sm font-semibold">Blur Reveal</h4>
          </div>
          <ToggleButton toggle={showBlur} setToggle={setShowBlur} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The answer animates <strong>height: 0 → auto</strong> while a{" "}
          <strong>filter: blur(8px) → blur(0px)</strong> makes the text resolve
          into focus instead of just appearing. The springs are{" "}
          <strong>asymmetric</strong>: opening bounces slightly (bounce 0.2),
          closing settles flat (bounce 0) — energy on the way in, calm on the
          way out.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const OPEN_SPRING  = { type: "spring", visualDuration: 0.42, bounce: 0.2 };
const CLOSE_SPRING = { type: "spring", visualDuration: 0.4,  bounce: 0 };

initial={{ height: 0, opacity: 0, filter: "blur(8px)" }}
animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: answers slide open without the focus pull.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">
          Perf Note: the Centre Cache
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Calling <strong>getBoundingClientRect()</strong> inside the transform
          would force a layout read on every pointer frame — and chase rows
          that are mid-scale. Instead, centres are measured once into a ref and
          refreshed only when they can actually go stale: a{" "}
          <strong>ResizeObserver</strong> catches the accordion resizing a row,
          plus scroll and resize listeners. Because rows scale from{" "}
          <strong>center origin</strong>, magnification never moves the
          measured centre.
        </p>
      </div>

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Layer Stack</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">
            FAQ rows
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showFisheye ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Fisheye scale
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showSpring ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Spring tracking
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showHoverOpen ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Hover open
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showBlur ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Blur reveal
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Final FAQ
          </span>
        </div>
      </div>
    </div>
  );
};

export const FisheyeFaqTutorial = () => {
  const [showFisheye, setShowFisheye] = useState(true);
  const [showSpring, setShowSpring] = useState(true);
  const [showHoverOpen, setShowHoverOpen] = useState(true);
  const [showBlur, setShowBlur] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[calc(100vh-120px)]">
      <div className="border-b border-dashed lg:border-b-0 lg:border-r flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Preview
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[380px] sm:min-h-[420px] lg:min-h-0 p-4 sm:p-6">
          <div className="flex bg-background items-center gap-1.5 absolute top-2 right-2 z-50">
            <button
              onClick={() => setShowCode(!showCode)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed rounded-none transition-colors cursor-pointer ${showCode ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}
            >
              {showCode ? (
                <Eye className="size-3" />
              ) : (
                <Code className="size-3" />
              )}
              {showCode ? "Preview" : "Code"}
            </button>
            <CopyDropdown registryName="fisheye-faq" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={FISHEYE_SOURCE}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    renderLineHighlight: "none",
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    scrollbar: {
                      vertical: "auto",
                      horizontal: "auto",
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    },
                    padding: { top: 16, bottom: 16 },
                    domReadOnly: true,
                    contextmenu: false,
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <FisheyePreview
                  showFisheye={showFisheye}
                  showSpring={showSpring}
                  showHoverOpen={showHoverOpen}
                  showBlur={showBlur}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="absolute top-0 left-0 block size-5 border-l border-t border-dashed border-muted-foreground" />
          <span className="absolute top-0 right-0 block size-5 border-r border-t border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 left-0 block size-5 border-l border-b border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 right-0 block size-5 border-r border-b border-dashed border-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-col min-h-0 min-w-0">
        <div className="px-4 py-2 border-b border-dashed shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Tutorial
          </p>
        </div>
        <div className="p-4 sm:p-6 flex-1">
          <FisheyeContent
            showFisheye={showFisheye}
            setShowFisheye={setShowFisheye}
            showSpring={showSpring}
            setShowSpring={setShowSpring}
            showHoverOpen={showHoverOpen}
            setShowHoverOpen={setShowHoverOpen}
            showBlur={showBlur}
            setShowBlur={setShowBlur}
          />
        </div>
      </div>
    </div>
  );
};

export default FisheyeFaqTutorial;
