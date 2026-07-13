"use client";

/**
 * Repeated text gliding endlessly around a curved SVG path, looped seamlessly with a GSAP timeline — a take on Olivier Larose's text-along-path.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const TEXT = "Curabitur mattis efficitur velit • ";
const COPIES = 5;
const STEP = 40; // percent of the path between each repeated copy

const Page = () => {
  const pathsRef = useRef<(SVGTextPathElement | null)[]>([]);

  useEffect(() => {
    const proxy = { p: 0 };

    const tween = gsap.to(proxy, {
      p: 1,
      duration: 8,
      ease: "none",
      repeat: -1,
      onUpdate: () => {
        pathsRef.current.forEach((path, i) => {
          path?.setAttribute(
            "startOffset",
            `${-STEP + i * STEP + proxy.p * STEP}%`,
          );
        });
      },
    });

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="grid h-full w-full place-items-center">
      <svg viewBox="0 0 250 90" className="w-full text-foreground">
        <path
          id="text-along-path-curve"
          fill="none"
          d="m0,88.5c61.37,0,61.5-68,126.5-68,58,0,51,68,123,68"
          className="stroke-foreground/15"
          strokeWidth={0.4}
        />
        <text fill="currentColor" className="text-[6px] uppercase">
          {Array.from({ length: COPIES }).map((_, i) => (
            <textPath
              key={i}
              ref={(el) => {
                pathsRef.current[i] = el;
              }}
              href="#text-along-path-curve"
              startOffset={`${-STEP + i * STEP}%`}
            >
              {TEXT}
            </textPath>
          ))}
        </text>
      </svg>
    </div>
  );
};

export default Page;
