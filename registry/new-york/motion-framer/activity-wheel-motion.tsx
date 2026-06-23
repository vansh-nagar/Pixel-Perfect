"use client";

/**
 * Vibes wheel — a vertical mood picker arranged along a curved arc. Scroll
 * or click to spring a different vibe into focus; the icon swaps to a
 * violet "active" fill and a dark indicator slides into the selected row.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Brain,
  Brush,
  Cloud,
  Code2,
  Coffee,
  Compass,
  Feather,
  Flame,
  Flower2,
  Footprints,
  Gamepad2,
  Headphones,
  HeartPulse,
  Lamp,
  Lightbulb,
  Moon,
  Mountain,
  Rocket,
  Snowflake,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

type Vibe = {
  name: string;
  Icon: LucideIcon;
  bg: string;
  color: string;
};

const VIBES: Vibe[] = [
  { name: "Focus", Icon: Brain, bg: "#ECE6F8", color: "#6E4DBF" },
  { name: "Spark", Icon: Sparkles, bg: "#FFEFD0", color: "#D49417" },
  { name: "Calm", Icon: Cloud, bg: "#DCEAF5", color: "#4A82B5" },
  { name: "Cozy", Icon: Flame, bg: "#FFDDD0", color: "#DA6034" },
  { name: "Joy", Icon: Sun, bg: "#FFE7B0", color: "#D9821A" },
  { name: "Dream", Icon: Star, bg: "#F4DEE9", color: "#BA4F84" },
  { name: "Rest", Icon: Moon, bg: "#DEE2F0", color: "#4F62A1" },
  { name: "Flow", Icon: Waves, bg: "#D5EBF1", color: "#2C90A9" },
  { name: "Grow", Icon: Sprout, bg: "#DEF0D7", color: "#4A8C3A" },
  { name: "Charge", Icon: Zap, bg: "#FFF3C2", color: "#C99317" },
  { name: "Wander", Icon: Compass, bg: "#E2EAD9", color: "#6B834E" },
  { name: "Pulse", Icon: HeartPulse, bg: "#FFE0E2", color: "#C44862" },
  { name: "Read", Icon: BookOpen, bg: "#EEE6DA", color: "#8A6B45" },
  { name: "Write", Icon: Feather, bg: "#E6E9F2", color: "#5A6B95" },
  { name: "Code", Icon: Code2, bg: "#DDEBE3", color: "#3F7C5C" },
  { name: "Brew", Icon: Coffee, bg: "#EFE0CC", color: "#8A623E" },
  { name: "Listen", Icon: Headphones, bg: "#E5DEF2", color: "#745EB5" },
  { name: "Move", Icon: Footprints, bg: "#F2E5DA", color: "#A06A45" },
  { name: "Chill", Icon: Snowflake, bg: "#DCEBF4", color: "#4685B3" },
  { name: "Bloom", Icon: Flower2, bg: "#F4DDE9", color: "#B95786" },
  { name: "Breeze", Icon: Wind, bg: "#DCEEEC", color: "#4A8C8C" },
  { name: "Bright", Icon: Lightbulb, bg: "#FFF0BD", color: "#C99A1A" },
  { name: "Boost", Icon: Rocket, bg: "#FFDDE0", color: "#C44A6A" },
  { name: "Game", Icon: Gamepad2, bg: "#E0E0F0", color: "#6B6BB5" },
  { name: "Climb", Icon: Mountain, bg: "#DEE5DC", color: "#5C7551" },
  { name: "Sketch", Icon: Brush, bg: "#F0E1E8", color: "#9A5A78" },
  { name: "Glow", Icon: Lamp, bg: "#FFE9C8", color: "#C9881A" },
];

const ARC_RADIUS = 140;
const ARC_STEP_DEG = 13;
const ACTIVE_FILL = "#8B5CF6";
const ACTIVE_GLOW = "rgba(139,92,246,0.55)";
const WHEEL_STEP_THRESHOLD = 40;

const ActivityWheelMotion = () => {
  const [selected, setSelected] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelAccumRef = useRef(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccumRef.current += e.deltaY;

      if (Math.abs(wheelAccumRef.current) < WHEEL_STEP_THRESHOLD) return;

      const steps = Math.trunc(wheelAccumRef.current / WHEEL_STEP_THRESHOLD);
      wheelAccumRef.current -= steps * WHEEL_STEP_THRESHOLD;

      setSelected((prev) =>
        Math.max(0, Math.min(VIBES.length - 1, prev + steps)),
      );
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-[300px] h-[300px] overflow-hidden touch-none [--wheel-bg:#FAFAFA] [--wheel-hl:rgba(255,255,255,0.95)] [--wheel-arc1:rgba(0,0,0,0.08)] [--wheel-arc2:rgba(0,0,0,0.04)] dark:[--wheel-bg:#1C1C1F] dark:[--wheel-hl:rgba(255,255,255,0.05)] dark:[--wheel-arc1:rgba(255,255,255,0.10)] dark:[--wheel-arc2:rgba(255,255,255,0.05)]"
      style={{
        background: "var(--wheel-bg)",
        borderRadius: "28px",
        boxShadow:
          "0 1px 0 var(--wheel-hl) inset, 0 -1px 0 rgba(0,0,0,0.12) inset, 0 24px 40px -16px rgba(0,0,0,0.30), 0 4px 12px -2px rgba(0,0,0,0.16)",
        fontFamily: "ui-sans-serif, system-ui",
        overscrollBehavior: "contain",
      }}
    >
      <svg
        viewBox="0 0 300 300"
        className="pointer-events-none absolute inset-0"
        preserveAspectRatio="none"
      >
        <circle
          cx="404"
          cy="150"
          r="140"
          fill="none"
          strokeWidth="1"
          strokeDasharray="2 4"
          style={{ stroke: "var(--wheel-arc1)" }}
        />
        <circle
          cx="404"
          cy="150"
          r="125"
          fill="none"
          strokeWidth="1"
          strokeDasharray="2 4"
          style={{ stroke: "var(--wheel-arc2)" }}
        />
      </svg>

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        {VIBES.map((vibe, i) => {
          const offset = i - selected;
          const abs = Math.abs(offset);
          const isSelected = offset === 0;

          const angleRad = (offset * ARC_STEP_DEG * Math.PI) / 180;
          const arcX = ARC_RADIUS * (1 - Math.cos(angleRad));
          const arcY = ARC_RADIUS * Math.sin(angleRad);

          return (
            <motion.button
              key={vibe.name}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={isSelected}
              aria-label={`Select ${vibe.name}`}
              className="absolute left-0 right-0 flex cursor-pointer items-center justify-between px-5"
              style={{ top: "50%", marginTop: -16, height: 32 }}
              animate={{
                x: arcX,
                y: arcY,
                scale: 1 - Math.min(abs, 3) * 0.07,
                opacity: abs > 3 ? 0 : 1 - abs * 0.22,
              }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 26,
                mass: 0.7,
              }}
            >
              <motion.span
                className="rounded-full px-2.5 py-1 text-[13px] tracking-tight"
                animate={{
                  color: isSelected ? "#171717" : "#A3A3A3",
                  borderColor: isSelected
                    ? "rgba(0,0,0,0.08)"
                    : "rgba(0,0,0,0)",
                  backgroundColor: isSelected ? "#FFFFFF" : "rgba(0,0,0,0)",
                  fontWeight: isSelected ? 500 : 400,
                }}
                transition={{ duration: 0.25 }}
                style={{ borderWidth: 1, borderStyle: "solid" }}
              >
                {vibe.name}
              </motion.span>

              <div className="flex items-center gap-2">
                <motion.div
                  className="grid size-8 place-items-center rounded-full"
                  animate={{
                    backgroundColor: isSelected ? ACTIVE_FILL : vibe.bg,
                    boxShadow: isSelected
                      ? `0 6px 14px -4px ${ACTIVE_GLOW}, 0 1px 0 rgba(255,255,255,0.7) inset`
                      : "0 1px 0 rgba(255,255,255,0.7) inset",
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <vibe.Icon
                    className="size-4"
                    style={{ color: isSelected ? "#FFFFFF" : vibe.color }}
                    strokeWidth={2}
                  />
                </motion.div>

                <motion.div
                  className="rounded-full bg-neutral-900 dark:bg-neutral-100"
                  animate={{
                    width: isSelected ? 12 : 0,
                    height: 6,
                    opacity: isSelected ? 1 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 26,
                  }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

    </div>
  );
};

export default ActivityWheelMotion;
