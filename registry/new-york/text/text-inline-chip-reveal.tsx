"use client";

/**
 * A headline whose words resolve from a hue-shifting glow into solid ink, around inline chips that sit in the text flow.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

const DEFAULT_TEXT =
  "Design tools feel best when a team can sketch and remix every small detail right inside the canvas.";

/** Word indices (0-based) that a chip is inserted after. */
const DEFAULT_CHIP_AFTER = [0, 6, 8, 10, 13];

/** Seconds a word spends as a bare glow before it starts inking in. */
const GLOW_HOLD = 0.28;
/** Seconds the glow takes to dissolve while the solid glyph fades up. */
const INK = 0.7;
/** Seconds the word's overall opacity takes to reach full. */
const FADE = 0.7;
/** Seconds between one word starting and the next. */
const STAGGER = 0.05;
/** Degrees the shared glow hue travels across the whole reveal. */
const HUE_SWEEP = 160;
/** Seconds a chip holds one face before swapping to the next. */
const CHIP_HOLD = 1600;

/**
 * Chip faces, drawn from theme tokens so they read in light and dark.
 * Inner sizes are in `em`, so a chip scales with the headline.
 */
const CHIP_FACES: { tone: string; mark: ReactNode }[] = [
  {
    tone: "bg-chart-1",
    mark: (
      <span className="flex flex-col items-center gap-[0.08em]">
        <span className="h-[0.06em] w-[0.52em] rounded-full bg-background" />
        <span className="h-[0.06em] w-[0.34em] rounded-full bg-background" />
        <span className="h-[0.06em] w-[0.44em] rounded-full bg-background" />
      </span>
    ),
  },
  {
    tone: "bg-chart-2",
    mark: (
      <span className="grid size-[0.5em] place-items-center rounded-full border-[0.055em] border-background">
        <span className="size-[0.16em] rounded-full bg-background" />
      </span>
    ),
  },
  {
    tone: "bg-chart-3",
    mark: (
      <span className="grid grid-cols-2 gap-[0.07em]">
        <span className="size-[0.19em] rounded-[0.04em] bg-background" />
        <span className="size-[0.19em] rounded-[0.04em] bg-background/35" />
        <span className="size-[0.19em] rounded-[0.04em] bg-background/35" />
        <span className="size-[0.19em] rounded-[0.04em] bg-background" />
      </span>
    ),
  },
  {
    tone: "bg-chart-4",
    mark: (
      <span className="block h-[0.62em] w-[0.14em] rotate-45 rounded-full bg-background" />
    ),
  },
  {
    tone: "bg-chart-5",
    mark: (
      <span className="flex items-end gap-[0.06em]">
        <span className="h-[0.2em] w-[0.08em] rounded-full bg-background" />
        <span className="h-[0.42em] w-[0.08em] rounded-full bg-background" />
        <span className="h-[0.28em] w-[0.08em] rounded-full bg-background" />
        <span className="h-[0.5em] w-[0.08em] rounded-full bg-background" />
      </span>
    ),
  },
  {
    tone: "bg-foreground",
    mark: (
      <span className="block size-[0.34em] rounded-[0.09em] bg-background" />
    ),
  },
];

/** An inline square tile that cycles through faces, like a looping media chip. */
function Chip({ index, still }: { index: number; still: boolean }) {
  const [face, setFace] = useState(index % CHIP_FACES.length);

  useEffect(() => {
    if (still) return;
    let interval: number | undefined;
    const advance = () => setFace((f) => (f + 1) % CHIP_FACES.length);
    const lead = window.setTimeout(() => {
      advance();
      interval = window.setInterval(advance, CHIP_HOLD);
    }, CHIP_HOLD * 0.6 + index * 320);
    return () => {
      window.clearTimeout(lead);
      if (interval) window.clearInterval(interval);
    };
  }, [still, index]);

  return (
    <span
      aria-hidden
      className="relative mx-[0.2em] inline-block size-[1.15em] translate-y-[0.16em] overflow-hidden rounded-[0.28em] align-baseline shadow-sm ring-1 ring-border/60"
    >
      {CHIP_FACES.map((f, i) => (
        <motion.span
          key={i}
          className={cn(
            "absolute inset-0 grid place-items-center",
            f.tone,
            i === face ? "z-10" : "z-0"
          )}
          initial={false}
          animate={{
            opacity: i === face ? 1 : 0,
            scale: i === face ? 1 : 0.86,
          }}
          transition={still ? { duration: 0 } : { duration: 0.32, ease: "easeOut" }}
        >
          {f.mark}
        </motion.span>
      ))}
      {/* gloss */}
      <span className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-background/25 to-transparent" />
    </span>
  );
}

interface TextInlineChipRevealProps {
  /** The sentence to reveal. */
  text?: string;
  className?: string;
  /** Word indices (0-based) that a chip is inserted after. */
  chipAfter?: number[];
  /** Seconds between one word starting and the next. */
  stagger?: number;
}

export default function TextInlineChipReveal({
  text = DEFAULT_TEXT,
  className,
  chipAfter = DEFAULT_CHIP_AFTER,
  stagger = STAGGER,
}: TextInlineChipRevealProps) {
  const reduced = useReducedMotion() ?? false;

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const chipSlots = useMemo(
    () => new Set(chipAfter.filter((i) => i >= 0 && i < words.length)),
    [chipAfter, words.length]
  );

  /** The hue sweep runs on one shared clock, so every unresolved word shares a hue. */
  const total = GLOW_HOLD + INK + Math.max(words.length - 1, 0) * stagger;

  const variants = useMemo(() => {
    const word: Variants = {
      hidden: { opacity: 0 },
      shown: (i: number) => ({
        opacity: 1,
        transition: { duration: reduced ? 0 : FADE, delay: reduced ? 0 : i * stagger, ease: "linear" },
      }),
    };
    const glow: Variants = {
      hidden: { opacity: 1, filter: "hue-rotate(0deg) blur(0.5px)" },
      shown: (i: number) => ({
        opacity: 0,
        filter: `hue-rotate(${HUE_SWEEP}deg) blur(1.6px)`,
        transition: reduced
          ? { duration: 0 }
          : {
              opacity: { duration: INK, delay: i * stagger + GLOW_HOLD, ease: "linear" },
              filter: { duration: total, ease: "linear" },
            },
      }),
    };
    const ink: Variants = {
      hidden: { opacity: 0 },
      shown: (i: number) => ({
        opacity: 1,
        transition: reduced
          ? { duration: 0 }
          : { duration: INK, delay: i * stagger + GLOW_HOLD, ease: "linear" },
      }),
    };
    return { word, glow, ink };
  }, [reduced, stagger, total]);

  return (
    <motion.p
      className={cn(
        "max-w-[22ch] text-balance text-center text-2xl leading-[1.25] tracking-tight text-foreground sm:text-3xl md:text-4xl",
        className
      )}
      // `initial` stays the same on server and client; reduced motion is handled
      // by zero-duration variants, so the headline snaps straight to its end state.
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
    >
      {/* The plain sentence for assistive tech; the animated copy below is decorative. */}
      <span className="sr-only">{text}</span>

      <span aria-hidden className="inline">
        {words.map((w, i) => {
          const hasChip = chipSlots.has(i);
          return (
            // A chip stays glued to the word before it; its own margin is the gap.
            <span
              key={`${w}-${i}`}
              className={cn("inline", hasChip && "whitespace-nowrap")}
            >
              <motion.span
                className="relative inline-block"
                variants={variants.word}
                custom={i}
              >
                {/* glow: a transparent glyph lit only by its own coloured shadow */}
                <motion.span
                  className="absolute inset-0 text-transparent"
                  style={{
                    textShadow:
                      "0 0 0.06em hsl(195 85% 62%), 0 0 0.2em hsl(195 85% 62%)",
                  }}
                  variants={variants.glow}
                  custom={i}
                >
                  {w}
                </motion.span>
                {/* ink: the solid glyph that fades up as the glow dissolves */}
                <motion.span
                  className="relative"
                  variants={variants.ink}
                  custom={i}
                >
                  {w}
                </motion.span>
              </motion.span>
              {hasChip ? <Chip index={i} still={reduced} /> : " "}
            </span>
          );
        })}
      </span>
    </motion.p>
  );
}
