"use client";

import { useRef } from "react";
import { motion } from "motion/react";

import { AnimatedBeam } from "@/registry/magicui/animated-beam";

/* Shared row wrapper so every variant lines up the same way */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/* 0 — the original Magic UI AnimatedBeam (gradient sweeps along the path) */
function MagicBeamRow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={containerRef}
      className="relative flex w-full items-center justify-between px-10"
    >
      <div ref={fromRef} className="size-3 rounded-full bg-foreground" />
      <div ref={toRef} className="size-3 rounded-full bg-foreground" />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={fromRef}
        toRef={toRef}
        duration={1.5}
      />
    </div>
  );
}

/* small helper: a faint static base line */
const Base = () => (
  <line
    x1="12"
    y1="12"
    x2="388"
    y2="12"
    stroke="currentColor"
    strokeOpacity="0.15"
    strokeWidth="2"
    strokeLinecap="round"
  />
);

const svg = "w-full text-foreground";

const Page = () => {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="flex w-full max-w-lg flex-col gap-10">
        {/* 0 — gradient beam (Magic UI) */}
        <Row label="0 · Gradient beam (Magic UI)">
          <MagicBeamRow />
        </Row>

        {/* 1 — draw on/off via pathLength */}
        <Row label="1 · Draw (pathLength)">
          <svg viewBox="0 0 400 24" className={svg} fill="none">
            <Base />
            <motion.line
              x1="12"
              y1="12"
              x2="388"
              y2="12"
              stroke="#6d4aff"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </Row>

        {/* 2 — marching ants (dash offset) */}
        <Row label="2 · Marching ants (strokeDashoffset)">
          <svg viewBox="0 0 400 24" className={svg} fill="none">
            <motion.line
              x1="12"
              y1="12"
              x2="388"
              y2="12"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="10 8"
              animate={{ strokeDashoffset: [0, -18] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </Row>

        {/* 3 — traveling dot */}
        <Row label="3 · Traveling dot (cx)">
          <svg viewBox="0 0 400 24" className={svg} fill="none">
            <Base />
            <motion.circle
              cy="12"
              r="5"
              fill="#ec4899"
              style={{ filter: "drop-shadow(0 0 6px #ec4899)" }}
              animate={{ cx: [12, 388, 12] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </Row>

        {/* 4 — comet / trailing segment */}
        <Row label="4 · Comet trail (dash + gradient)">
          <svg viewBox="0 0 400 24" className={svg} fill="none">
            <Base />
            <motion.line
              x1="12"
              y1="12"
              x2="388"
              y2="12"
              stroke="url(#comet)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="70 400"
              animate={{ strokeDashoffset: [470, -70] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            />
            <defs>
              <linearGradient id="comet" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#f59e0b" stopOpacity="0" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </Row>

        {/* 5 — pulsing glow line */}
        <Row label="5 · Pulse (width + opacity)">
          <svg viewBox="0 0 400 24" className={svg} fill="none">
            <motion.line
              x1="12"
              y1="12"
              x2="388"
              y2="12"
              stroke="#38bdf8"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px #38bdf8)" }}
              animate={{ strokeWidth: [1, 4, 1], strokeOpacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </Row>

        {/* 6 — dashes flowing inside a gradient reveal */}
        <Row label="6 · Flowing dashes + gradient">
          <svg viewBox="0 0 400 24" className={svg} fill="none">
            <Base />
            <motion.line
              x1="12"
              y1="12"
              x2="388"
              y2="12"
              stroke="url(#flow)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 10"
              animate={{ strokeDashoffset: [0, -160] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <defs>
              <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6d4aff" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </Row>
      </div>
    </div>
  );
};

export default Page;
