/**
 * An infinite carousel whose travel direction follows your scroll direction and whose speed ramps with scroll velocity before easing back to a gentle drift — one GSAP timeline with a scroll-signed timeScale.
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

// Seven slides on six swatches, picked so no two neighbours match, including Indigo → Azure at the wrap.
const SLIDES: Slide[] = [
  { title: "Azure", tag: "01", swatch: 5 },
  { title: "Violet", tag: "02", swatch: 4 },
  { title: "Tangerine", tag: "03", swatch: 0 },
  { title: "Amber", tag: "04", swatch: 3 },
  { title: "Rose", tag: "05", swatch: 2 },
  { title: "Coral", tag: "06", swatch: 0 },
  { title: "Indigo", tag: "07", swatch: 1 },
];

const SPEED = 90; // px per second at idle drift
const IDLE = 1; // timeScale magnitude when no scrolling

const Arrow = ({ color }: { color: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke={color}
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
          {[...SLIDES, ...SLIDES].map((s, i) => {
            const swatch = SWATCHES[s.swatch];
            return (
              <div key={`${s.title}-${i}`} className="relative mr-6 shrink-0">
                <div
                  className="flex aspect-square h-96 flex-col justify-end p-6"
                  style={{
                    clipPath: "url(#sdc-notch)",
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
                </div>
                {/* the arrow button sits in the notch as a solid chip of the card's own colour */}
                <div
                  className="absolute bottom-0 right-0 flex h-16 w-28 items-center justify-center rounded-full"
                  style={{ backgroundColor: swatch.bg }}
                >
                  <Arrow color={swatch.ink} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScrollDirectionCarousel;
