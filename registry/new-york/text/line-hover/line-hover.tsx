"use client";

/**
 * Line text hover decode animations — faithful GSAP ports of the four Codrops
 * "Line Text Hover Animations" effects (terminal-like typography, inspired by
 * jeandawson.com). https://github.com/codrops/LineTextHoverAnimations
 *
 * Core idea (all variants): a per-character scramble where each character rapidly
 * cycles through random letters/symbols, then settles back to its original glyph,
 * staggered left→right. Each variant layers one extra detail:
 *
 *   - cursor → a solid block "cursor" flashes over each char as it decodes
 *   - bar    → a white highlight bar wipes in left→right with mix-blend difference
 *   - color  → each random glyph flashes a random palette color before settling
 *   - box    → a rounded blurred box grows up from the bottom behind the text
 *
 * Characters are split manually (no SplitType dependency) and the scramble target
 * lives in a nested span so the cursor/bar elements survive innerHTML rewrites.
 *
 * In this showcase the effect runs on a continuous loop and also re-triggers on
 * per-line hover (bar/box variants reverse on mouse-leave), so it stays lively.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type Variant = "cursor" | "bar" | "color" | "box";

const GLYPHS =
  "abcdefghijklmnopqrstuvwxyz!@#$%^&*-_+=;:<>,".split("");
const COLORS = ["#22a3a9", "#4ca922", "#a99222", "#1d2619"];

const CONFIG: Record<
  Variant,
  { repeat: number; repeatDelay: number; delayStep: number }
> = {
  cursor: { repeat: 3, repeatDelay: 0.04, delayStep: 0.07 },
  bar: { repeat: 2, repeatDelay: 0.05, delayStep: 0.06 },
  color: { repeat: 3, repeatDelay: 0.1, delayStep: 0.08 },
  box: { repeat: 2, repeatDelay: 0.05, delayStep: 0.06 },
};

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const LINE_STAGGER_MS = 220;
const BACK_DELAY_MS = 2600;
const CYCLE_MS = 5000;

type Char = { text: HTMLSpanElement; block: HTMLSpanElement | null; original: string };
type Line = {
  el: HTMLElement;
  chars: Char[];
  bar: HTMLSpanElement | null;
  pendingBack: number | null;
  onEnter: () => void;
  onLeave: (() => void) | null;
};

const DEFAULT_LINES = ["JUST GIVE IT A STAR", "MOUNT VESPERA", "PLANET THALASSA"];

interface LineHoverTextProps {
  variant: Variant;
  lines?: string[];
  className?: string;
}

export function LineHoverText({
  variant,
  lines = DEFAULT_LINES,
  className,
}: LineHoverTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linesKey = lines.join("|");
  const hasBar = variant === "bar" || variant === "box";

  useGSAP(
    () => {
      const els = lineRefs.current.filter(Boolean) as HTMLElement[];
      if (!els.length) return;

      const cfg = CONFIG[variant];
      let cancelled = false;
      const timers: number[] = [];

      const buildLine = (el: HTMLElement, str: string): Line => {
        el.textContent = "";
        el.style.position = "relative";
        el.style.display = "inline-block";
        el.style.whiteSpace = "nowrap";
        el.style.isolation = "isolate";

        const chars: Char[] = [];
        for (const ch of Array.from(str)) {
          const wrap = document.createElement("span");
          wrap.style.position = "relative";
          wrap.style.display = "inline-block";
          wrap.style.whiteSpace = "pre";

          const text = document.createElement("span");
          text.textContent = ch;
          wrap.appendChild(text);

          let block: HTMLSpanElement | null = null;
          if (variant === "cursor" && /\S/.test(ch)) {
            block = document.createElement("span");
            block.style.position = "absolute";
            block.style.left = "0";
            block.style.top = "0";
            block.style.width = "100%";
            block.style.height = "100%";
            block.style.background = "currentColor";
            block.style.opacity = "0";
            block.style.pointerEvents = "none";
            wrap.appendChild(block);
          }

          el.appendChild(wrap);
          if (/\S/.test(ch)) chars.push({ text, block, original: ch });
        }

        let bar: HTMLSpanElement | null = null;
        if (hasBar) {
          bar = document.createElement("span");
          bar.style.position = "absolute";
          bar.style.pointerEvents = "none";
          if (variant === "bar") {
            bar.style.inset = "0";
            bar.style.background = "#fff";
            bar.style.mixBlendMode = "difference";
            bar.style.transformOrigin = "0% 50%";
          } else {
            bar.style.left = "-8px";
            bar.style.right = "-8px";
            bar.style.top = "-8px";
            bar.style.bottom = "-8px";
            bar.style.borderRadius = "2px";
            bar.style.background = "rgba(255, 255, 255, 0.12)";
            bar.style.setProperty("backdrop-filter", "blur(5px)");
            bar.style.setProperty("-webkit-backdrop-filter", "blur(5px)");
            bar.style.zIndex = "-1";
            bar.style.transformOrigin = "50% 100%";
          }
          gsap.set(bar, variant === "bar" ? { scaleX: 0 } : { scaleY: 0 });
          el.appendChild(bar);
        }

        return { el, chars, bar, pendingBack: null, onEnter: () => {}, onLeave: null };
      };

      const reset = (line: Line) => {
        line.chars.forEach((c) => {
          gsap.killTweensOf(c.text);
          c.text.innerHTML = c.original;
          if (variant === "color") c.text.style.color = "";
          if (c.block) c.block.style.opacity = "0";
        });
      };

      const animate = (line: Line) => {
        reset(line);
        line.chars.forEach((c, position) => {
          const initialHTML = c.original;
          let repeatCount = 0;
          gsap.fromTo(
            c.text,
            { opacity: 0 },
            {
              duration: 0.03,
              repeat: cfg.repeat,
              repeatRefresh: true,
              repeatDelay: cfg.repeatDelay,
              delay: (position + 1) * cfg.delayStep,
              ease: variant === "color" ? "none" : "power1.out",
              opacity: 1,
              innerHTML: () => {
                if (variant === "color") c.text.style.color = randomColor();
                return randomGlyph();
              },
              onStart:
                variant === "cursor"
                  ? () => {
                      if (c.block) c.block.style.opacity = "1";
                    }
                  : undefined,
              onRepeat:
                variant === "cursor"
                  ? () => {
                      repeatCount++;
                      if (repeatCount === 1 && c.block) c.block.style.opacity = "0";
                    }
                  : undefined,
              onComplete: () => {
                c.text.innerHTML = initialHTML;
                if (variant === "color") c.text.style.color = "";
                if (c.block) c.block.style.opacity = "0";
              },
            }
          );
        });

        if (hasBar && line.bar) {
          gsap.killTweensOf(line.bar);
          gsap.to(line.bar, {
            duration: 1,
            ease: "expo",
            ...(variant === "bar" ? { scaleX: 1 } : { scaleY: 1 }),
          });
        }
      };

      const animateBack = (line: Line) => {
        if (!line.bar) return;
        gsap.killTweensOf(line.bar);
        gsap.to(line.bar, {
          duration: 0.6,
          ease: "power4",
          ...(variant === "bar" ? { scaleX: 0 } : { scaleY: 0 }),
        });
      };

      const built: Line[] = els.map((el, i) => buildLine(el, lines[i] ?? ""));

      built.forEach((line) => {
        line.onEnter = () => {
          if (line.pendingBack) {
            clearTimeout(line.pendingBack);
            line.pendingBack = null;
          }
          animate(line);
        };
        line.el.addEventListener("mouseenter", line.onEnter);
        if (hasBar) {
          line.onLeave = () => animateBack(line);
          line.el.addEventListener("mouseleave", line.onLeave);
        }
      });

      const cycle = () => {
        if (cancelled) return;
        built.forEach((line, i) => {
          const t = window.setTimeout(() => {
            if (cancelled) return;
            animate(line);
            if (hasBar) {
              line.pendingBack = window.setTimeout(
                () => animateBack(line),
                BACK_DELAY_MS
              );
              timers.push(line.pendingBack);
            }
          }, i * LINE_STAGGER_MS);
          timers.push(t);
        });
        const next = window.setTimeout(cycle, CYCLE_MS);
        timers.push(next);
      };
      cycle();

      return () => {
        cancelled = true;
        timers.forEach((t) => clearTimeout(t));
        built.forEach((line) => {
          line.chars.forEach((c) => gsap.killTweensOf(c.text));
          if (line.bar) gsap.killTweensOf(line.bar);
          line.el.removeEventListener("mouseenter", line.onEnter);
          if (line.onLeave) line.el.removeEventListener("mouseleave", line.onLeave);
          line.el.textContent = "";
        });
      };
    },
    { scope: containerRef, dependencies: [variant, linesKey] }
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center gap-2 font-mono uppercase ${
        className ?? ""
      }`}
    >
      {lines.map((line, i) => (
        <div
          key={`${line}-${i}`}
          ref={(el) => {
            lineRefs.current[i] = el;
          }}
          className="cursor-pointer leading-tight"
        />
      ))}
    </div>
  );
}

export function DecodeCursor(props: Omit<LineHoverTextProps, "variant">) {
  return <LineHoverText variant="cursor" {...props} />;
}

export function DecodeBar(props: Omit<LineHoverTextProps, "variant">) {
  return <LineHoverText variant="bar" {...props} />;
}

export function DecodeColor(props: Omit<LineHoverTextProps, "variant">) {
  return <LineHoverText variant="color" {...props} />;
}

export function DecodeBox(props: Omit<LineHoverTextProps, "variant">) {
  return <LineHoverText variant="box" {...props} />;
}

export default LineHoverText;
