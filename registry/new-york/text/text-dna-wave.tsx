"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface TextDnaWaveProps {
  children: string;
  className?: string;
  duration?: number;
  waveHeight?: number;
}

export default function TextDnaWave({
  children,
  className = "",
  duration = 2,
  waveHeight = 30,
}: TextDnaWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const split = new SplitText(textRef.current, { type: "chars" });
      const chars = split.chars;

      const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      masterTl.set(chars, {
        opacity: 0,
        y: 50,
      });

      chars.forEach((char, i) => {
        const tl = gsap.timeline({
          delay: i * 0.05,
        });

        tl.to(char, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });

        tl.to(
          char,
          {
            y: `+=${waveHeight}`,
            duration: 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 3,
            onUpdate: function () {
              const progress = this.progress();
              const sineY = Math.sin(progress * Math.PI * 4) * waveHeight;
              gsap.set(char, { y: sineY });
            },
          },
          "-=0.1"
        );

        tl.to(char, {
          y: 0,
          duration: 0.3,
          ease: "elastic.out(1, 0.5)",
        });

        masterTl.add(tl, 0);
      });
    },
    { scope: containerRef, dependencies: [children, duration, waveHeight] }
  );

  return (
    <div ref={containerRef} className={className}>
      <span ref={textRef} className="inline-block">
        {children}
      </span>
    </div>
  );
}
