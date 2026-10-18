/**
 * Prints are tossed onto a loose pile as you scroll, then slide out and straighten into a tidy contact sheet.
 */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type PileImage = { src: string; alt: string };
export type PhotoPileSortProps = {
  images?: PileImage[];
  className?: string;
  /** Scroll length of the pinned sequence, as a multiple of the stage height. */
  length?: number;
  /** Width of each print on the pile, as a share of the stage. */
  size?: number;
  /** How many prints get tossed; the set repeats to fill it. */
  count?: number;
};

const DEMO_IMAGES: PileImage[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/image-animations/photo-${i + 1}.jpg`,
  alt: `Photo ${i + 1}`,
}));

/* ─────────────────────────────────────────────
 * SCROLL STORYBOARD (timeline units, scrubbed by scroll)
 *
 *   toss   prints fly in one at a time from random edges, spinning
 *          down onto a loose pile; later prints land on top
 *   hold   the full, messy pile
 *   sort   prints slide out top-first, straighten and shrink into
 *          a contact sheet, filling it in reading order
 *   end    hold on the finished sheet
 * ───────────────────────────────────────────── */
const TIMING = {
  toss: 0.7, // one print's flight onto the pile
  tossGap: 0.2, // between consecutive tosses, so flights overlap
  hold: 0.5,
  sort: 0.9, // one print's slide into its cell
  sortSpread: 0.6, // stagger across the whole sort
  end: 0.4,
};

// Layout in stage units, where 1 is the stage's width.
const PILE = { spreadX: 0.1, spreadY: 0.08, tilt: 14 };
const ENTRY = { distance: 1.1, scale: 1.25, spin: 120 };
const SHEET = { width: 0.8, gap: 0.02 };

// Stable per-print randomness, so the pile lands the same way on every render.
function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function PhotoPileSort({
  images = DEMO_IMAGES,
  className = "",
  length = 7,
  size = 0.34,
  count = 16,
}: PhotoPileSortProps) {
  const prints = Array.from({ length: Math.max(count, images.length) }, (_, i) => images[i % images.length]);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scrollEl = scroller.current;
      const trackEl = track.current;
      const stageEl = stage.current;
      if (!scrollEl || !trackEl || !stageEl) return;

      const els = gsap.utils.toArray<HTMLElement>("[data-print]", stageEl);
      const n = els.length;
      if (!n) return;

      // Offsets are xPercent / yPercent of the print itself, so a stage-unit
      // distance only needs dividing by the print's share of the stage. No
      // measuring, and nothing to recompute when the card resizes.
      const pct = (units: number) => (units / size) * 100;

      // The contact sheet: a near-square grid centred on the stage. The top
      // print (last in the DOM) is picked up first, so it takes the first cell.
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);
      const cell = Math.min(
        (SHEET.width - SHEET.gap * (cols - 1)) / cols,
        (SHEET.width - SHEET.gap * (rows - 1)) / rows,
      );
      const step = cell + SHEET.gap;
      const sheet = els.map((_, i) => {
        const slot = n - 1 - i;
        return {
          xPercent: pct(((slot % cols) - (cols - 1) / 2) * step),
          yPercent: pct((Math.floor(slot / cols) - (rows - 1) / 2) * step),
        };
      });

      gsap.set(stageEl, { autoAlpha: 1 });

      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // No toss: show the finished sheet.
        els.forEach((el, i) => gsap.set(el, { ...sheet[i], scale: cell / size }));
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: trackEl,
          scroller: scrollEl,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      // 1. Toss: each print flies in from a random edge, spinning, and slows
      //    to a stop on the pile like it slid across the table.
      els.forEach((el, i) => {
        const angle = rand(i, 1) * Math.PI * 2;
        const rotation = (rand(i, 2) - 0.5) * 2 * PILE.tilt;
        timeline.fromTo(
          el,
          {
            xPercent: pct(Math.cos(angle) * ENTRY.distance),
            yPercent: pct(Math.sin(angle) * ENTRY.distance),
            rotation: rotation + (rand(i, 3) - 0.5) * 2 * ENTRY.spin,
            scale: ENTRY.scale,
          },
          {
            xPercent: pct((rand(i, 4) - 0.5) * 2 * PILE.spreadX),
            yPercent: pct((rand(i, 5) - 0.5) * 2 * PILE.spreadY),
            rotation,
            scale: 1,
            duration: TIMING.toss,
            ease: "power3.out",
          },
          i * TIMING.tossGap,
        );
      });

      // 2. Sort: after a beat on the full pile, the prints spread out into the
      //    sheet together, the top of the pile leading.
      timeline
        .to(
          els,
          {
            xPercent: (i: number) => sheet[i].xPercent,
            yPercent: (i: number) => sheet[i].yPercent,
            rotation: 0,
            scale: cell / size,
            duration: TIMING.sort,
            ease: "power3.inOut",
            stagger: { amount: TIMING.sortSpread, from: "end" },
          },
          `+=${TIMING.hold}`,
        )
        .to({}, { duration: TIMING.end });

      // At progress 0 the table is empty, which would leave the card blank
      // until someone scrolls it. Start with the first few prints down.
      const restAt = 3 * TIMING.tossGap + TIMING.toss;
      scrollEl.scrollTop = (scrollEl.scrollHeight - scrollEl.clientHeight) * (restAt / timeline.duration());

      const observer = new ResizeObserver(() => ScrollTrigger.refresh());
      observer.observe(scrollEl);

      return () => observer.disconnect();
    },
    { scope: root, dependencies: [images, length, size, count] },
  );

  return (
    <div
      ref={root}
      className={`relative aspect-square w-full overflow-hidden bg-background text-foreground ${className}`}
    >
      <div
        ref={scroller}
        data-lenis-prevent
        className="h-full w-full overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={track} style={{ height: `${length * 100}%` }}>
          {/* The stage stays put while the track scrolls past it. Hidden until
              the prints are placed, so the server render doesn't flash a stack. */}
          <div
            ref={stage}
            className="invisible sticky top-0 flex h-[calc(100%/var(--len))] select-none items-center justify-center overflow-hidden"
            style={{ ["--len" as string]: length }}
          >
            {prints.map((image, i) => (
              <div
                key={`${image.src}-${i}`}
                data-print
                className="absolute bg-white p-[1%] shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_16px_rgb(0_0_0/0.1)]"
                style={{ width: `${size * 100}%` }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  draggable={false}
                  className="block aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
