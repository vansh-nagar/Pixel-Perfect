"use client";

/**
 * A highlight colour washes across a headline character by character, lifting each glyph out of a dimmed rest state as it passes, line after line.
 */

import { Fragment, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

/** How long a glyph takes to pick up, or drop, the highlight colour. */
const FADE = 0.1;
/** How long a glyph stays fully highlighted before it returns to the base colour. */
const HOLD = 0.05;
/** The opacity lift trails the colour change by this much, so the wave reads as a band. */
const LIFT_DELAY = 0.1;

/** `prefers-reduced-motion` as a reactive boolean, resolved on the first client render. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

interface TextHighlightWaveProps {
  /** Headline copy. A newline starts a new line; long lines still wrap on their own. */
  text?: string;
  /** Any CSS colour, including a theme token such as `var(--chart-4)`. */
  highlightColor?: string;
  /** Seconds between one character and the next. */
  charStagger?: number;
  /** Seconds each line trails the line above it. */
  lineStagger?: number;
  /** Opacity of a character before the wave reaches it. */
  restOpacity?: number;
  /** Replay every time the headline scrolls back into view instead of only once. */
  replay?: boolean;
  className?: string;
}

const TextHighlightWave = ({
  text = "Light travels\nleft to right",
  highlightColor = "oklch(0.82 0.17 83)",
  charStagger = 0.04,
  lineStagger = 0.15,
  restOpacity = 0.15,
  replay = false,
  className,
}: TextHighlightWaveProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const chars = gsap.utils.toArray<HTMLElement>("[data-char]", root);
      if (chars.length === 0) return;
      const highlights = chars.map(
        (char) => char.querySelector("[data-highlight]") as HTMLElement
      );

      if (reduced) {
        gsap.set(chars, { opacity: 1 });
        gsap.set(highlights, { opacity: 0 });
        return;
      }

      const play = () => {
        // Group characters by their vertical position, so a line that wraps
        // staggers like the separate line it visually is.
        const rows = new Map<number, number[]>();
        chars.forEach((char, index) => {
          const row = rows.get(char.offsetTop);
          if (row) row.push(index);
          else rows.set(char.offsetTop, [index]);
        });
        const lines = [...rows.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([, indexes]) => indexes);

        const tl = gsap.timeline();
        tl.set(chars, { opacity: restOpacity }, 0);
        tl.set(highlights, { opacity: 0 }, 0);

        lines.forEach((line, lineIndex) => {
          line.forEach((charIndex, i) => {
            const at = lineIndex * lineStagger + i * charStagger;
            tl.to(
              highlights[charIndex],
              { opacity: 1, duration: FADE, ease: "sine.out" },
              at
            );
            tl.to(
              chars[charIndex],
              { opacity: 1, duration: FADE, ease: "sine.out" },
              at + LIFT_DELAY
            );
            tl.to(
              highlights[charIndex],
              { opacity: 0, duration: FADE, ease: "sine.in" },
              at + LIFT_DELAY + FADE + HOLD
            );
          });
        });

        return tl;
      };

      let tl: gsap.core.Timeline | undefined;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          tl?.kill();
          tl = play();
          if (!replay) observer.disconnect();
        },
        { rootMargin: "0px 0px -15% 0px" }
      );
      observer.observe(root);

      return () => {
        observer.disconnect();
        tl?.kill();
      };
    },
    {
      scope: rootRef,
      dependencies: [
        text,
        highlightColor,
        charStagger,
        lineStagger,
        restOpacity,
        replay,
        reduced,
      ],
    }
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "text-foreground text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl",
        className
      )}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split("\n").map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            {line.split(" ").map((word, wordIndex, words) => (
              <Fragment key={wordIndex}>
                <span className="inline-block">
                  {[...word].map((char, charIndex) => (
                    <span
                      key={charIndex}
                      data-char=""
                      className="relative inline-block"
                      style={{ opacity: restOpacity }}
                    >
                      {char}
                      <span
                        data-highlight=""
                        className="pointer-events-none absolute top-0 left-0"
                        style={{ color: highlightColor, opacity: 0 }}
                      >
                        {char}
                      </span>
                    </span>
                  ))}
                </span>
                {wordIndex < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
        ))}
      </span>
    </div>
  );
};

export default TextHighlightWave;
