"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/src/SplitText";

gsap.registerPlugin(SplitText);

export type StaggerFrom = "start" | "center" | "edges" | "random" | "end";

interface TextScatter1Props {
  staggerFrom?: StaggerFrom;
  text?: string;
  className?: string;
}

const TextScatter1 = ({
  staggerFrom = "start",
  text = "JUST GIVE IT A STAR",
  className,
}: TextScatter1Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const split = new SplitText(containerRef.current, { type: "chars" });

      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.5,
      });

      // Each char scatters then immediately falls
      split.chars.forEach((char, i) => {
        const delay = i * 0.1; // stagger delay

        // Scatter
        tl.to(
          char,
          {
            rotate: gsap.utils.random(-360, 360),
            x: gsap.utils.random(-300, 300),
            y: gsap.utils.random(-200, 100),
            scale: gsap.utils.random(0.5, 1.5),
            opacity: 0.8,
            ease: "power1",
            duration: 0.5,
          },
          delay
        );

        // Fall straight down immediately after scatter
        tl.to(
          char,
          {
            y: "+=500",
            opacity: 0,
            ease: "power2.in",
            duration: 0.6,
          },
          delay + 0.5
        );
      });

      // Reset for next loop
      tl.set(split.chars, {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
      });

      return () => {
        split.revert();
      };
    },
    { scope: containerRef, dependencies: [staggerFrom, text] }
  );

  return (
    <div className=" p-8">
      <div
        ref={containerRef}
        className={`text-4xl perspective-distant ${className ?? ""}`}
      >
        {text}
      </div>
    </div>
  );
};

export default TextScatter1;
