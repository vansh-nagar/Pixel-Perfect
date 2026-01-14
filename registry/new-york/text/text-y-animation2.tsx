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

const TextYAnimation2 = ({
  staggerFrom = "start",
  text = "JUST GIVE IT A STAR",
  className,
}: TextYAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef1 = useRef<HTMLDivElement>(null);
  const textRef2 = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!textRef1.current || !textRef2.current) return;

      const split1 = new SplitText(textRef1.current, { type: "chars" });
      const split2 = new SplitText(textRef2.current, { type: "chars" });

      gsap.from(split1.chars, {
        y: "100%",
        ease: "power4.in",
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
      gsap.from(split2.chars, {
        y: "-100%",
        ease: "power4.in",
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
        split1.revert();
        split2.revert();
      };
    },
    { scope: containerRef, dependencies: [staggerFrom, text] }
  );

  return (
    <div ref={containerRef} className=" h-8 relative">
      <div
        ref={textRef1}
        className={`text-2xl perspective-distant ${className ?? ""}`}
      >
        {text}
      </div>

      <div
        ref={textRef2}
        className={`text-2xl perspective-distant absolute top-0 ${
          className ?? ""
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default TextYAnimation2;
