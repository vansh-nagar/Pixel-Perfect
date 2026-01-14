"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface TextBrokenGlassProps {
  children: string;
  className?: string;
  duration?: number;
}

export default function TextBrokenGlass({
  children,
  className = "",
  duration = 1.5,
}: TextBrokenGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const split = new SplitText(textRef.current, { type: "chars" });
      const chars = split.chars;

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      tl.add(() => {
        chars.forEach((char) => {
          gsap.set(char, {
            opacity: 0.3,
            x: gsap.utils.random(-100, 100),
            y: gsap.utils.random(-80, 80),
            rotation: gsap.utils.random(-180, 180),
            scale: gsap.utils.random(0.5, 1.5),
            filter: "blur(3px)",
          });
        });
      });

      tl.to(chars, {
        opacity: 1,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: duration,
        ease: "back.out(1.7)",
        stagger: {
          each: 0.02,
          from: "random",
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
