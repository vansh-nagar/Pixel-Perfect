"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface TextBurnNeonProps {
  children: string;
  className?: string;
  duration?: number;
  repeat?: boolean;
}

export default function TextBurnNeon({
  children,
  className = "",
  duration = 2,
  repeat = true,
}: TextBurnNeonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const split = new SplitText(textRef.current, { type: "chars" });
      const chars = split.chars;

      const masterTl = gsap.timeline({
        repeat: repeat ? -1 : 0,
        repeatDelay: 1,
      });

      masterTl.set(chars, {
        opacity: 0,
        color: "#ff0000",
        textShadow: "0 0 0px #ff0000",
      });

      chars.forEach((char, i) => {
        const delay = Math.random() * 0.5;
        const tl = gsap.timeline({ delay });

        tl.to(char, {
          opacity: 1,
          duration: 0.05,
          repeat: 5,
          yoyo: true,
          ease: "none",
        });

        tl.to(char, {
          opacity: 1,
          color: "#ff3300",
          textShadow: "0 0 20px #ff0000, 0 0 40px #ff3300",
          duration: 0.3,
          ease: "power2.in",
        });

        tl.to(char, {
          color: "#ffffff",
          textShadow: "0 0 10px #ffffff, 0 0 20px #ffaa00",
          duration: 0.4,
          ease: "power2.out",
        });

        tl.to(char, {
          textShadow: "0 0 0px transparent",
          duration: 0.5,
          ease: "power2.out",
        });

        masterTl.add(tl, 0);
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
