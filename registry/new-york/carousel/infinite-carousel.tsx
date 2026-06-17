/**
 * A seamless infinite carousel where one GSAP timeline powers idle drift, scroll-velocity speed/reverse, hover-slow, and drag-to-scrub — all sharing a single playhead so they never desync.
 */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

type Slide = { title: string; tag: string; gradient: string };

const SLIDES: Slide[] = [
  { title: "Nebula", tag: "01", gradient: "linear-gradient(135deg,#6366f1,#a855f7)" },
  { title: "Ember", tag: "02", gradient: "linear-gradient(135deg,#f97316,#ef4444)" },
  { title: "Lagoon", tag: "03", gradient: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
  { title: "Meadow", tag: "04", gradient: "linear-gradient(135deg,#22c55e,#84cc16)" },
  { title: "Blossom", tag: "05", gradient: "linear-gradient(135deg,#ec4899,#f43f5e)" },
  { title: "Dusk", tag: "06", gradient: "linear-gradient(135deg,#8b5cf6,#6366f1)" },
  { title: "Sahara", tag: "07", gradient: "linear-gradient(135deg,#eab308,#f97316)" },
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
          {[...SLIDES, ...SLIDES].map((s, i) => (
            <article
              key={`${s.title}-${i}`}
              className="mr-6 flex h-96 w-72 shrink-0 flex-col justify-end rounded-3xl p-6 text-white shadow-xl"
              style={{ backgroundImage: s.gradient }}
            >
              <span className="text-sm font-medium text-white/70">{s.tag}</span>
              <h3 className="text-3xl font-bold">{s.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfiniteCarousel;
