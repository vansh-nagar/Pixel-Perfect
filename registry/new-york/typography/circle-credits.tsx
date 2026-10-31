"use client";

/**
 * Two credit columns that wrap a round hole and circulate around it endlessly, scrambling into symbols on hover.
 *
 * Layout: the left column is right-aligned and the right column left-aligned,
 * and each name's inner edge sits on the edge of a circle, so the gutter between
 * them opens into a round hole. A name d rows from the middle is inset
 * √(radius² − d²) line-heights; rows above and below the circle meet at the gutter.
 *
 * Motion (GSAP):
 *   loop  → every name travels a closed track round the hole, clockwise: up the
 *           left side, down the right side. At the top and bottom a name never
 *           slides sideways; it keeps moving with its column, fades out past
 *           the end, and fades back in on the other column, swapping sides at
 *           the instant it's invisible. One lap is one power2.inOut sweep,
 *           repeated forever. The inset is recomputed from each name's live
 *           height every frame, so the hole stays a perfect circle.
 *   enter → names fade in and unblur, rows staggered from the middle outwards
 *   hover → each letter cycles through random letters/symbols, then settles,
 *           left → right (same decode as the line-hover text effect)
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const LEFT = [
  "Mira Abernathy",
  "Studio Alder & Co.",
  "Theo Baxendale",
  "Brightwell & Finch",
  "Ines Calloway",
  "Corvin Press",
  "Nadia Desrosiers",
  "Oskar Dunmore",
  "Ruth Ellery",
  "Jonas Fairweather",
  "Pia Fenwick",
  "Fold Works",
  "Marcel Garrow",
  "The Weavers of Glenmoor",
  "Ada Greaves",
  "Hugo Halloran",
  "Clara Hempel",
  "Felix Holloway",
  "Wren Hutchins",
];

const RIGHT = [
  "Iris Ingleby",
  "Kaito Jarvis",
  "Lumen Kiln",
  "Sofia Kowal",
  "Elias Lindqvist",
  "Noor Marchetti",
  "Meridian Type Foundry",
  "Petra Novak",
  "Daniel Okafor",
  "Amara Quill",
  "Rosen & Vail",
  "Saltmarsh Pottery Guild",
  "Mateo Solis",
  "Tamsin Thorne",
  "Vera Underwood",
  "Elodie Vance",
  "Ezra Whitlock",
  "Zora Wilde",
  "Haru Yoshida",
];

/** Line height in em; the hole radius and gutter are measured in it. */
const LINE = 1.6;
/** Half the gap between the columns where the hole doesn't reach, in em. */
const GUTTER = 0.45;

const GLYPHS = "abcdefghijklmnopqrstuvwxyz!@#$%^&*-_+=;:<>,".split("");
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

const SCRAMBLE = { repeat: 3, repeatDelay: 0.04, delayStep: 0.025 };

interface CircleCreditsProps {
  left?: string[];
  right?: string[];
  /** Radius of the hole, in rows. */
  radius?: number;
  /** Seconds for one full lap round the hole. */
  duration?: number;
  className?: string;
}

export function CircleCredits({
  left = LEFT,
  right = RIGHT,
  radius = 7.5,
  duration = 24,
  className,
}: CircleCreditsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rows = Math.max(left.length, right.length);
  const middle = (rows - 1) / 2;

  // Slots along the track, clockwise: 0 … rows-1 run up the left side
  // (bottom → top), rows … 2·rows-1 run down the right side (top → bottom).
  const leftSlot = (row: number) => rows - 1 - row;
  const rightSlot = (row: number) => rows + row;

  useGSAP(
    () => {
      const root = containerRef.current;
      const stage = root?.querySelector<HTMLElement>("[data-stage]");
      if (!root || !stage) return;

      const names = gsap.utils.toArray<HTMLElement>("[data-name]", root);
      const slots = names.map((el) => Number(el.dataset.slot));
      const setX = names.map((el) => gsap.quickSetter(el, "x", "px"));
      const setY = names.map((el) => gsap.quickSetter(el, "y", "px"));
      const setOpacity = names.map((el) => gsap.quickSetter(el, "opacity"));
      const total = rows * 2;

      let em = 0;
      let cx = 0;
      let cy = 0;
      let widths: number[] = [];
      const measure = () => {
        em = parseFloat(getComputedStyle(stage).fontSize);
        cx = stage.clientWidth / 2;
        cy = stage.clientHeight / 2;
        widths = names.map((el) => el.offsetWidth);
      };

      // distance from the centre line to a name's inner edge at a (fractional) row
      const insetAt = (row: number) => {
        const d = row - middle;
        const reach = Math.sqrt(Math.max(0, radius * radius - d * d));
        return Math.max(GUTTER, reach * LINE) * em;
      };

      const lap = { progress: 0 };
      const layout = () => {
        names.forEach((el, i) => {
          const s = (slots[i] + lap.progress * total) % total;
          const k = Math.floor(s);
          const f = s - k;
          const w = widths[i];
          let row: number;
          let x: number;
          let opacity = 1;

          if (k < rows - 1) {
            // left side, climbing
            row = rows - 1 - k - f;
            x = -insetAt(row) - w;
          } else if (k === rows - 1) {
            // top: climb half a row out of the left column while fading, then
            // fall half a row into the right column while fading back in
            const out = f < 0.5;
            row = out ? -f : f - 1;
            x = out ? -insetAt(row) - w : insetAt(row);
            opacity = Math.abs(1 - 2 * f);
          } else if (k < total - 1) {
            // right side, falling
            row = k - rows + f;
            x = insetAt(row);
          } else {
            // bottom: the same handover, right column → left column
            const out = f < 0.5;
            row = out ? rows - 1 + f : rows - f;
            x = out ? insetAt(row) : -insetAt(row) - w;
            opacity = Math.abs(1 - 2 * f);
          }

          setX[i](cx + x);
          setY[i](cy + ((row - middle) * LINE - LINE / 2) * em);
          setOpacity[i](opacity);
        });
      };

      measure();
      layout();
      // the font scales with the container, so widths and insets go stale on resize
      const resize = new ResizeObserver(() => {
        measure();
        layout();
      });
      resize.observe(stage);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return () => resize.disconnect();
      }

      gsap.to(lap, {
        progress: 1,
        duration,
        ease: "power2.inOut",
        repeat: -1,
        onUpdate: layout,
      });

      gsap.from(gsap.utils.toArray<HTMLElement>("[data-inner]", root), {
        opacity: 0,
        filter: "blur(4px)",
        duration: 1.1,
        ease: "power2.inOut",
        delay: (_, el: HTMLElement) =>
          0.15 + Math.abs(Number(el.dataset.row) - middle) * 0.06,
        clearProps: "filter",
      });

      const cleanups = names.map((name) => {
        const chars = gsap.utils
          .toArray<HTMLElement>("[data-char]", name)
          .map((el) => ({ el, original: el.textContent ?? "" }));

        const scramble = () => {
          chars.forEach(({ el, original }, i) => {
            gsap.killTweensOf(el);
            el.textContent = original;
            // pin the slot to the real letter's width so a wide symbol can't
            // change the name's width (its inner edge is what traces the circle)
            el.style.width = `${el.getBoundingClientRect().width}px`;
            gsap.fromTo(
              el,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.03,
                repeat: SCRAMBLE.repeat,
                repeatRefresh: true,
                repeatDelay: SCRAMBLE.repeatDelay,
                delay: i * SCRAMBLE.delayStep,
                ease: "power1.out",
                textContent: randomGlyph,
                onComplete: () => {
                  el.textContent = original;
                  el.style.width = "";
                },
              },
            );
          });
        };

        name.addEventListener("mouseenter", scramble);
        return () => {
          name.removeEventListener("mouseenter", scramble);
          chars.forEach(({ el, original }) => {
            gsap.killTweensOf(el);
            el.textContent = original;
            el.style.width = "";
          });
        };
      });

      return () => {
        resize.disconnect();
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    {
      scope: containerRef,
      dependencies: [left.join("|"), right.join("|"), radius, duration],
    },
  );

  const renderName = (text: string | undefined, slot: number, row: number) =>
    text ? (
      <span
        key={slot}
        data-name
        data-slot={slot}
        className="absolute top-0 left-0 cursor-default"
        style={{ lineHeight: LINE }}
      >
        <span data-inner data-row={row} className="inline-block">
          <span className="sr-only">{text}</span>
          <span aria-hidden>
            {Array.from(text).map((char, i) =>
              char === " " ? (
                " "
              ) : (
                <span key={i} data-char className="inline-block text-center">
                  {char}
                </span>
              ),
            )}
          </span>
        </span>
      </span>
    ) : null;

  return (
    <div ref={containerRef} className={`@container w-full ${className ?? ""}`}>
      <div
        data-stage
        className="relative w-full font-medium whitespace-nowrap text-foreground/85 text-[clamp(7px,1.5cqw,11px)]"
        style={{ height: `${(rows + 1) * LINE}em` }}
      >
        {Array.from({ length: rows }, (_, row) => [
          renderName(left[row], leftSlot(row), row),
          renderName(right[row], rightSlot(row), row),
        ])}
      </div>
    </div>
  );
}

export default CircleCredits;
