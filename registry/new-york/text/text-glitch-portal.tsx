"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface TextGlitchPortalProps {
  children: string;
  className?: string;
  duration?: number;
}

export default function TextGlitchPortal({
  children,
  className = "",
  duration = 1.5,
}: TextGlitchPortalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const split = new SplitText(textRef.current, { type: "chars" });
      const chars = split.chars;

      gsap.set(chars, {
        opacity: 0,
        scale: 3,
        filter: "blur(20px)",
      });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      tl.set(chars, {
        opacity: 0,
        scale: 3,
        filter: "blur(20px)",
      });

      tl.to(chars, {
        opacity: 1,
        scale: 1.5,
        filter: "blur(10px)",
        textShadow: "-5px 0 #ff0000, 5px 0 #00ffff",
        duration: duration * 0.3,
        ease: "power2.out",
        stagger: {
          each: 0.02,
          from: "random",
        },
      });

      tl.to(chars, {
        textShadow: "3px 0 #ff0000, -3px 0 #00ffff",
        x: "random(-5, 5)",
        duration: 0.05,
        repeat: 6,
        yoyo: true,
        ease: "none",
        stagger: {
          each: 0.01,
          from: "random",
        },
      });

      tl.to(chars, {
        scale: 1,
        filter: "blur(0px)",
        textShadow: "0 0 0 transparent",
        x: 0,
        duration: duration * 0.4,
        ease: "elastic.out(1, 0.5)",
        stagger: {
          each: 0.02,
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
