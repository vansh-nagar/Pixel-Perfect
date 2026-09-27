"use client";

/**
 * A headline whose words resolve one by one from a hue-shifting glow into solid ink.
 */

import { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

const DEFAULT_TEXT = "hey vansh";

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

/** An inline square tile that cycles through faces, like a looping media chip. */
interface TextInlineChipRevealProps {
  /** The sentence to reveal. */
  text?: string;
  className?: string;
  /** Seconds between one word starting and the next. */
  stagger?: number;
}

export default function TextInlineChipReveal({
  text = DEFAULT_TEXT,
  className,
  stagger = STAGGER,
}: TextInlineChipRevealProps) {
  const reduced = useReducedMotion() ?? false;

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);

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
          return (
            <span
              key={`${w}-${i}`}
              className="inline"
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
              {" "}
            </span>
          );
        })}
      </span>
    </motion.p>
  );
}
