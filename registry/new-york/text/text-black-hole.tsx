"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface TextBlackHoleProps {
  children: string;
  className?: string;
  duration?: number;
}

export default function TextBlackHole({
  children,
  className = "",
  duration = 1.2,
}: TextBlackHoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const split = new SplitText(textRef.current, { type: "chars" });
      const chars = split.chars;
      const center = Math.floor(chars.length / 2);

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      tl.set(chars, {
        opacity: 0,
        scaleX: 3,
        scaleY: 0.1,
        x: (i) => (i - center) * -50,
      });

      tl.to(chars, {
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        duration: duration,
        ease: "power4.out",
        stagger: {
          each: 0.03,
          from: "center",
        },
      });
    },
    { scope: containerRef, dependencies: [children, duration] }
  );

  return (
    <div ref={containerRef} className={className}>
      <span ref={textRef}>{children}</span>
    </div>
  );
}
