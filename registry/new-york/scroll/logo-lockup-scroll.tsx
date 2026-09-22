"use client";

/**
 * A pinned camera pulls back from deep inside the logo mark, sweeps the wordmark past in hairline outline, then settles on the lockup and fills it in.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// The mark is drawn once and reused by both the outlined and the filled copy.
const MARK_VIEWBOX = "0 0 900 864";
const MARK_TRANSFORM = "translate(0,864) scale(0.1,-0.1)";
const MARK_PATHS = [
  "M4270 7500 l-1335 -5 -9 -658 c-4 -362 -5 -661 -2 -664 3 -4 784 -7 1735 -7 951 -1 1731 -3 1733 -6 2 -3 0 -504 -5 -1115 -8 -994 -11 -1111 -25 -1122 -12 -10 -202 -13 -869 -13 -836 0 -854 0 -861 -19 -10 -28 -9 -1307 1 -1318 5 -4 353 -9 774 -10 640 -2 769 0 791 11 15 8 364 350 777 759 l749 745 8 1027 c6 764 5 1031 -3 1041 -9 12 -124 14 -671 14 l-659 0 2 664 c1 365 -1 669 -5 675 -5 8 -119 10 -399 9 -216 -2 -993 -5 -1727 -8z",
  "M2209 6153 c-489 -3 -629 -6 -637 -16 -7 -8 -15 -552 -23 -1677 -6 -916 -15 -2016 -18 -2445 -3 -441 -2 -785 3 -793 7 -10 322 -12 1540 -10 l1531 3 0 665 0 665 -860 5 -860 5 1 530 c0 292 4 1100 9 1796 l8 1266 -24 6 c-13 4 -28 6 -34 4 -5 -1 -292 -3 -636 -4z",
];

// Lockup geometry in scene units (1 unit = 1px at the settled size).
const MARK_H = 132;
const MARK_W = (900 / 864) * MARK_H;
const FONT_SIZE = 108;
const GAP = -6; // the wordmark tucks against the mark, the way the navbar sets it

/** Walk up to the scroll container this component is embedded in, if any. */
function findScroller(el: HTMLElement): HTMLElement | undefined {
  let node = el.parentElement;
  while (node) {
    if (node.hasAttribute("data-lenis-prevent")) return node;
    const oy = getComputedStyle(node).overflowY;
    if (
      (oy === "auto" || oy === "scroll") &&
      node.scrollHeight > node.clientHeight
    )
      return node;
    node = node.parentElement;
  }
  return undefined;
}

export interface LogoLockupScrollProps {
  /** Wordmark set beside the mark. The mark stands in for its first letter. */
  label?: string;
  /** Scroll length of the pinned sequence, in viewport heights. */
  length?: number;
  className?: string;
}

const LogoLockupScroll = ({
  label = "ixel Perfect",
  length = 4,
  className = "",
}: LogoLockupScrollProps) => {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const camera = useRef<SVGGElement>(null);
  const lockup = useRef<SVGGElement>(null);
  const rules = useRef<SVGGElement>(null);
  const filled = useRef<SVGGElement>(null);
  const outline = useRef<SVGGElement>(null);

  useGSAP(
    () => {
      const r = root.current;
      const tr = track.current;
      const cam = camera.current;
      const lock = lockup.current;
      if (!r || !tr || !cam || !lock) return;

      const scroller = findScroller(r);
      let stageW = 0;
      let stageH = 0;
      let box = { x: 0, y: 0, width: 1, height: 1 };

      // Size the pinned stage to whatever is scrolling us: the window on a
      // normal page, or an overflow container when embedded in a preview.
      const fit = () => {
        stageH = scroller?.clientHeight ?? window.innerHeight;
        stageW = r.clientWidth;
        r.style.setProperty("--stage-h", `${stageH}px`);
        box = lock.getBBox();
      };
      fit();

      // The camera is a view onto the lockup: `scale` is how many screen pixels
      // one scene unit covers, and (tx, ty) is the scene point held at centre.
      const view = { scale: 1, tx: 0, ty: 0 };
      const place = () => {
        cam.setAttribute(
          "transform",
          `translate(${stageW / 2 - view.scale * view.tx} ${stageH / 2 - view.scale * view.ty}) scale(${view.scale})`,
        );
      };
      // Settled: the whole lockup sits inside the stage with room to breathe.
      const home = () =>
        Math.min((stageW * 0.72) / box.width, (stageH * 0.5) / box.height);

      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: tr,
          scroller,
          // clamp() keeps progress at 0 when the track starts above scrollTop 0.
          start: "clamp(top top)",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
        onUpdate: place,
      });

      const markMid = () => ({
        x: box.x + MARK_W * 0.5,
        y: box.y + box.height * 0.5,
      });
      const sweep = home() * 3.1;
      // Stop tracking when the wordmark's last letter reaches the right edge,
      // so the sweep never runs on past the end of the lockup.
      const sweepEnd = () =>
        box.x + box.width - stageW / 2 / (home() * 3.1) + MARK_W * 0.2;

      // 1. Pull back out of the mark's inner corner until the mark reads whole.
      tl.fromTo(
        view,
        { scale: () => home() * 14, tx: () => markMid().x, ty: () => markMid().y },
        { scale: () => sweep, duration: 1.2 },
        0,
      )
        // 2. Hold that scale and track right, so the wordmark sweeps past.
        .to(view, { tx: sweepEnd, duration: 1.8 }, 1.2)
        // 3. Pull back the rest of the way onto the settled lockup.
        .to(
          view,
          {
            scale: () => home(),
            tx: () => box.x + box.width / 2,
            ty: () => box.y + box.height / 2,
            duration: 1,
            ease: "power2.inOut",
          },
          3,
        )
        // A beat of stillness on the finished lockup before the pin releases.
        .to({}, { duration: 0.35 }, 4.15);

      // The guide rules belong to the stage, not the scene: they fade in under
      // the opening zoom and clear out before the lockup settles.
      tl.fromTo(rules.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.15)
        .to(rules.current, { opacity: 0, duration: 0.6 }, 3.2)
        // Outline hands over to the solid lockup as the camera comes to rest.
        .to(outline.current, { opacity: 0, duration: 0.45 }, 3.7)
        .fromTo(filled.current, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 3.7);

      // Fonts change the wordmark's width, so re-measure once they land.
      const remeasure = () => {
        fit();
        ScrollTrigger.refresh();
        place();
      };
      document.fonts?.ready.then(remeasure);

      const ro = scroller ? new ResizeObserver(remeasure) : null;
      if (ro && scroller) ro.observe(scroller);
      if (!scroller) window.addEventListener("resize", remeasure);
      place();

      return () => {
        ro?.disconnect();
        window.removeEventListener("resize", remeasure);
      };
    },
    { scope: root, dependencies: [label, length] },
  );

  const mark = (
    <svg
      x={0}
      y={0}
      width={MARK_W}
      height={MARK_H}
      viewBox={MARK_VIEWBOX}
      overflow="visible"
    >
      <g transform={MARK_TRANSFORM}>
        {MARK_PATHS.map((d) => (
          <path key={d.slice(0, 24)} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
  const word = (
    <text
      x={MARK_W + GAP}
      y={MARK_H * 0.5}
      fontSize={FONT_SIZE}
      dominantBaseline="central"
      className="font-pixelify"
      vectorEffect="non-scaling-stroke"
    >
      {label}
    </text>
  );

  return (
    <div
      ref={root}
      className={`relative w-full bg-background text-foreground [--stage-h:100svh] ${className}`}
    >
      <div ref={track} style={{ height: `calc(var(--stage-h) * ${length})` }}>
        <div className="sticky top-0 h-[var(--stage-h)] overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full"
            aria-label="Pixel Perfect"
            role="img"
          >
            {/* Stage-space guide rules, the brand grid the lockup is built on. */}
            <g ref={rules} opacity={0} stroke="currentColor" strokeOpacity={0.14}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <line key={i} x1="0" x2="100%" y1={`${(i * 100) / 8}%`} y2={`${(i * 100) / 8}%`} />
              ))}
            </g>
            <g ref={camera}>
              <g ref={lockup}>
                {/* Outline copy: hairline at every zoom, so the strokes never fatten. */}
                <g
                  ref={outline}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.55}
                  strokeWidth={1}
                >
                  {mark}
                  {word}
                </g>
                {/* Solid copy, faded in once the lockup has settled. */}
                <g ref={filled} fill="currentColor" opacity={0}>
                  {mark}
                  {word}
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LogoLockupScroll;
