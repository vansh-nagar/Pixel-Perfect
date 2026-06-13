/**
 * A notched card with a magnetic pill button: the pill flings with GSAP inertia in the
 * direction (and speed) of your cursor, while an arrow conveyor loops with Motion on hover.
 */
"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { motion } from "motion/react";
import { Nunito } from "next/font/google";

gsap.registerPlugin(useGSAP, InertiaPlugin);

const nunito = Nunito({ subsets: ["latin"] });

const VELOCITY = 25; // higher = bigger fling

// One conveyor cell: half the track wide, with the arrow centered.
const ArrowCell = () => (
  <span className="grid w-1/2 shrink-0 place-items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="32"
      height="32"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.5 12L4.99997 12" />
      <path d="M13 18C13 18 19 13.5811 19 12C19 10.4188 13 6 13 6" />
    </svg>
  </span>
);

const InertiaArrowCard = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);

  useGSAP(
    () => {
      const root = rootRef.current;
      const zone = zoneRef.current;
      const pill = pillRef.current;
      if (!root || !zone || !pill) return;

      // Track the mouse's per-move delta (its velocity & direction).
      let oldX = 0;
      let oldY = 0;
      let deltaX = 0;
      let deltaY = 0;

      const handleMove = (e: MouseEvent) => {
        deltaX = e.clientX - oldX;
        deltaY = e.clientY - oldY;
        oldX = e.clientX;
        oldY = e.clientY;
      };
      root.addEventListener("mousemove", handleMove);

      // On entering the (fixed) zone, fling the pill in the mouse's direction,
      // scaled by its speed, then let inertia glide it back to start (end: 0).
      const handleEnter = () => {
        const tl = gsap.timeline({ onComplete: () => tl.kill() });
        tl.timeScale(1.2);

        tl.to(pill, {
          inertia: {
            x: { velocity: deltaX * VELOCITY, end: 0 },
            y: { velocity: deltaY * VELOCITY, end: 0 },
          },
        });

        // A little life: random tilt that yoyos back.
        tl.fromTo(
          pill,
          { rotate: 0 },
          {
            duration: 0.4,
            rotate: (Math.random() - 0.5) * 24, // between -12 and 12 deg
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut",
          },
          "<",
        );
      };
      zone.addEventListener("mouseenter", handleEnter);

      return () => {
        root.removeEventListener("mousemove", handleMove);
        zone.removeEventListener("mouseenter", handleEnter);
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className={`${nunito.className} grid place-items-center p-8`}
    >
      {/* Define the clips once; objectBoundingBox = coords are 0–1 fractions of the box */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="iac-inverted" clipPathUnits="objectBoundingBox">
            <path d="M0.1,0 H0.9 A0.1,0.1 0 0 1 1,0.1 V0.7 A0.1,0.1 0 0 1 0.9,0.8 H0.8 A0.1,0.1 0 0 0 0.7,0.9 V0.9 A0.1,0.1 0 0 1 0.6,1 H0.1 A0.1,0.1 0 0 1 0,0.9 V0.1 A0.1,0.1 0 0 1 0.1,0 Z" />
          </clipPath>

          {/* Pill from a 25×16 rx=8 rect → rx 8/25=0.32, ry 8/16=0.5 (capsule while box stays 25:16) */}
          <clipPath id="iac-pill" clipPathUnits="objectBoundingBox">
            <rect width="1" height="1" rx="0.32" ry="0.5" />
          </clipPath>
        </defs>
      </svg>

      <div className="relative">
        <div
          className="aspect-square h-96 p-6 text-xl text-white"
          style={{
            clipPath: "url(#iac-inverted)",
            backgroundColor: "#9FA1FF",
          }}
        >
          Enim id aliqua duis elit laboris cupidatat quis non cupidatat nulla.
          Proident deserunt do officia velit cillum aliqua mollit commodo aute.
          Est nostrud voluptate et id occaecat anim adipisicing consectetur quis
          ex. Incididunt irure labore esse consequat minim culpa fugiat sunt
          amet non sint pariatur.
        </div>

        {/* Fixed hover zone: owns the pointer (GSAP fling + conveyor state). */}
        <div
          ref={zoneRef}
          onMouseEnter={() => setRunning(true)}
          onMouseLeave={() => setRunning(false)}
          className="group absolute right-0 bottom-0 aspect-25/16 w-[100px]"
        >
          {/* The pill flings (GSAP). pointer-events-none so it never steals the hover. */}
          <div
            ref={pillRef}
            className="pointer-events-none flex h-full w-full items-center justify-center bg-[#B5BAFF] transition-colors duration-300 will-change-transform group-hover:bg-[#9FA1FF]"
            style={{ clipPath: "url(#iac-pill)" }}
          >
            {/* Motion conveyor: viewport fills the whole pill. */}
            <div className="h-full w-full overflow-hidden">
              <motion.div
                className="flex h-full w-[200%]"
                initial="rest"
                animate={running ? "run" : "rest"}
                variants={{
                  rest: { x: "-50%", transition: { duration: 0.3 } },
                  run: {
                    x: "0%",
                    transition: {
                      duration: 0.6,
                      ease: "linear",
                      repeat: Infinity,
                    },
                  },
                }}
              >
                <ArrowCell />
                <ArrowCell />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InertiaArrowCard;
