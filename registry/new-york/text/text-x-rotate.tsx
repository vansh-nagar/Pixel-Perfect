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

const TextXRotate = ({
  staggerFrom = "start",
  text = "JUST GIVE IT A STAR",
  className,
}: TextXRotateProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const split = new SplitText(containerRef.current, { type: "chars" });
      gsap.from(split.chars, {
        rotateX: 180,
        ease: "back.out",
        transformOrigin: "50% 100%",
        duration: 1,
        stagger: {
          each: 0.05,
          from: staggerFrom,
        },
        repeat: -1,
        repeatDelay: 1,
        yoyo: true,
      });

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

export default TextXRotate;
