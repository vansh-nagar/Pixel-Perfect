/**
 * An infinite carousel whose travel direction follows your scroll direction and whose speed ramps with scroll velocity before easing back to a gentle drift — one GSAP timeline with a scroll-signed timeScale.
 */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

type Slide = { title: string; tag: string; color: string };

const SLIDES: Slide[] = [
  { title: "Azure", tag: "01", color: "#3B82F6" },
  { title: "Violet", tag: "02", color: "#8B5CF6" },
  { title: "Emerald", tag: "03", color: "#10B981" },
  { title: "Amber", tag: "04", color: "#F59E0B" },
  { title: "Rose", tag: "05", color: "#F43F5E" },
  { title: "Teal", tag: "06", color: "#14B8A6" },
  { title: "Indigo", tag: "07", color: "#6366F1" },
];

const SPEED = 90; // px per second at idle drift
const IDLE = 1; // timeScale magnitude when no scrolling

const Arrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18.5 12L4.99997 12" />
    <path d="M13 18C13 18 19 13.5811 19 12C19 10.4188 13 6 13 6" />
  </svg>
);

const ScrollDirectionCarousel = () => {
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

      const wrapX = gsap.utils.wrap(-loopWidth, 0);
      const setX = gsap.quickSetter(track, "x", "px");
      let x = 0;

      let direction = 1;
      let boost = 0;

      const tick = (_time: number, deltaTime: number) => {
        boost *= 0.92;
        if (boost < 0.001) boost = 0;
        x -= direction * (IDLE + boost) * SPEED * (deltaTime / 1000);
        setX(wrapX(x));
      };
      gsap.ticker.add(tick);

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (e.deltaY !== 0) direction = e.deltaY > 0 ? 1 : -1;
        boost = gsap.utils.clamp(0, 40, boost + Math.abs(e.deltaY) * 0.02);
      };
      container.addEventListener("wheel", onWheel, { passive: false });

      return () => {
        gsap.ticker.remove(tick);
        container.removeEventListener("wheel", onWheel);
      };
    },
    { scope: containerRef },
  );

  return (
    <div className="w-full p-4">
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="sdc-notch" clipPathUnits="objectBoundingBox">
            <path d="M0.1,0 H0.9 A0.1,0.1 0 0 1 1,0.1 V0.7 A0.1,0.1 0 0 1 0.9,0.8 H0.8 A0.1,0.1 0 0 0 0.7,0.9 V0.9 A0.1,0.1 0 0 1 0.6,1 H0.1 A0.1,0.1 0 0 1 0,0.9 V0.1 A0.1,0.1 0 0 1 0.1,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        ref={containerRef}
        className="w-full select-none overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div ref={trackRef} className="flex w-max will-change-transform">
          {[...SLIDES, ...SLIDES].map((s, i) => (
            <div key={`${s.title}-${i}`} className="relative mr-6 shrink-0">
              <div
                className="flex aspect-square h-96 flex-col justify-end p-6 text-white"
                style={{ clipPath: "url(#sdc-notch)", backgroundColor: s.color }}
              >
                <span className="text-sm font-medium text-white/70">
                  {s.tag}
                </span>
                <h3 className="text-3xl font-bold">{s.title}</h3>
              </div>
              <div className="absolute bottom-0 right-0 flex h-16 w-28 items-center justify-center rounded-full bg-white/25">
                <Arrow />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollDirectionCarousel;
