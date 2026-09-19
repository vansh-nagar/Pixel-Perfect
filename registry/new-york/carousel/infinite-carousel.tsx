/**
 * A seamless infinite carousel where one GSAP timeline powers idle drift, scroll-velocity speed/reverse, hover-slow, and drag-to-scrub — all sharing a single playhead so they never desync.
 */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

// Flat, high-contrast swatches: a solid fill, one hard-edged motif, and a text colour that reads on it.
const SWATCHES = [
  { bg: "#ff5f1f", ink: "#151515", motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px" },
  { bg: "#2d4bff", ink: "#ffffff", motif: "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px" },
  { bg: "#f6a8f2", ink: "#151515", motif: "repeating-radial-gradient(circle at 30% 70%, #ff5f1f 0 12px, transparent 12px 34px)" },
  { bg: "#ffb000", ink: "#151515", motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)" },
  { bg: "#6b3ce6", ink: "#ffffff", motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px" },
  { bg: "#9dbbff", ink: "#151515", motif: "repeating-linear-gradient(0deg, #2d4bff 0 6px, transparent 6px 22px)" },
];

type Slide = { title: string; tag: string; swatch: number };

// Seven slides on six swatches, picked so no two neighbours match, including Sahara → Nebula at the wrap.
const SLIDES: Slide[] = [
  { title: "Nebula", tag: "01", swatch: 4 },
  { title: "Ember", tag: "02", swatch: 0 },
  { title: "Lagoon", tag: "03", swatch: 1 },
  { title: "Meadow", tag: "04", swatch: 5 },
  { title: "Blossom", tag: "05", swatch: 2 },
  { title: "Dusk", tag: "06", swatch: 1 },
  { title: "Sahara", tag: "07", swatch: 3 },
];

const SPEED = 90; // px per second the strip drifts at rest

const InfiniteCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      const container = containerRef.current;
      if (!track || !container) return;

      const firstCard = track.children[0] as HTMLElement;
      const cardWidth =
        firstCard.offsetWidth +
        parseFloat(getComputedStyle(firstCard).marginRight);
      const loopWidth = cardWidth * SLIDES.length;

      const loop = gsap.to(track, {
        x: -loopWidth,
        duration: loopWidth / SPEED,
        ease: "none",
        repeat: -1,
      });

      const wrapTime = gsap.utils.wrap(0, loop.duration());
      const pxPerSec = loopWidth / loop.duration();

      let dragging = false;
      let base = 1;
      let targetBase = 1;
      let scroll = 0;

      const tick = () => {
        base += (targetBase - base) * 0.1;
        scroll *= 0.9;
        if (Math.abs(scroll) < 0.001) scroll = 0;
        if (!dragging) loop.timeScale(base + scroll); // drag owns time, not rate
      };
      gsap.ticker.add(tick);

      const onEnter = () => (targetBase = 0.15);
      const onLeave = () => (targetBase = 1);
      container.addEventListener("mouseenter", onEnter);
      container.addEventListener("mouseleave", onLeave);

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        scroll = gsap.utils.clamp(-60, 1000, scroll + e.deltaY * 0.018);
      };
      container.addEventListener("wheel", onWheel, { passive: false });

      let startX = 0;
      let startTime = 0;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        startX = e.clientX;
        startTime = loop.time();
        loop.pause();
        container.setPointerCapture(e.pointerId);
        container.style.cursor = "grabbing";
      };

      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        loop.time(wrapTime(startTime - dx / pxPerSec));
      };

      const onUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        loop.play();
        container.releasePointerCapture(e.pointerId);
        container.style.cursor = "";
      };

      container.addEventListener("pointerdown", onDown);
      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerup", onUp);
      container.addEventListener("pointercancel", onUp);

      return () => {
        gsap.ticker.remove(tick);
        container.removeEventListener("wheel", onWheel);
        container.removeEventListener("mouseenter", onEnter);
        container.removeEventListener("mouseleave", onLeave);
        container.removeEventListener("pointerdown", onDown);
        container.removeEventListener("pointermove", onMove);
        container.removeEventListener("pointerup", onUp);
        container.removeEventListener("pointercancel", onUp);
      };
    },
    { scope: containerRef },
  );

  return (
    <div className="w-full p-4">
      <div
        ref={containerRef}
        className="w-full cursor-grab touch-none select-none overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div ref={trackRef} className="flex w-max will-change-transform">
          {[...SLIDES, ...SLIDES].map((s, i) => {
            const swatch = SWATCHES[s.swatch];
            return (
              <article
                key={`${s.title}-${i}`}
                className="mr-6 flex h-96 w-72 shrink-0 flex-col justify-end rounded-3xl p-6"
                style={{
                  background: `${swatch.motif}, ${swatch.bg}`,
                  color: swatch.ink,
                }}
              >
                <div
                  className="self-start rounded-2xl px-3 py-2"
                  style={{ backgroundColor: swatch.bg }}
                >
                  <span className="block text-sm font-medium opacity-70">
                    {s.tag}
                  </span>
                  <h3 className="text-3xl font-bold">{s.title}</h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InfiniteCarousel;
