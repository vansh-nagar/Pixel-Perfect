"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/src/SplitText";

gsap.registerPlugin(SplitText);

export type StaggerFrom = "start" | "center" | "edges" | "random" | "end";

interface TextXRotateProps {
  staggerFrom?: StaggerFrom;
  text?: string;
  className?: string;
}

const TextScatter = ({
  staggerFrom = "start",
  text = "JUST GIVE IT A STAR",
  className,
}: TextXRotateProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const split = new SplitText(containerRef.current, { type: "chars" });
      {
        split.chars.forEach((char) => {
          gsap.to(char, {
            rotate: gsap.utils.random(-180, 180),
            x: gsap.utils.random(-200, 200),
            y: gsap.utils.random(-200, 200),
            ease: "power4.out",
            duration: 1,
            repeat: -1,
            repeatDelay: 1,
            yoyo: true,
          });
        });
      }

      return () => {
        split.revert();
      };
    },
    { scope: containerRef, dependencies: [staggerFrom, text] }
  );

  return (
    <div
      ref={containerRef}
      className={`text-4xl perspective-distant ${className ?? ""}`}
    >
      {text}
    </div>
  );
};

export default TextScatter;
