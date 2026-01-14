"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/src/SplitText";

gsap.registerPlugin(SplitText);

export type StaggerFrom = "start" | "center" | "edges" | "random" | "end";

interface TextYAnimationProps {
  staggerFrom?: StaggerFrom;
  text?: string;
  className?: string;
}

const TextYAnimation = ({
  staggerFrom = "start",
  text = "JUST GIVE IT A STAR",
  className,
}: TextYAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const split = new SplitText(containerRef.current, { type: "chars" });
      gsap.from(split.chars, {
        y: "100%",
        ease: "back.out",
        transformOrigin: "50% 100%",
        stagger: {
          each: 0.05,
          from: staggerFrom,
        },
        repeat: -1,
        repeatDelay: 1,
        yoyo: true,
        opacity: 0,
        filter: "blur(4px)",
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
      className={`text-2xl perspective-distant overflow-hidden ${
        className ?? ""
      }`}
    >
      {text}
    </div>
  );
};

export default TextYAnimation;
