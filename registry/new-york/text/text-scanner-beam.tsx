"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface TextScannerBeamProps {
  children: string;
  className?: string;
  duration?: number;
}

export default function TextScannerBeam({
  children,
  className = "",
  duration = 2,
}: TextScannerBeamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const split = new SplitText(textRef.current, { type: "chars" });
      const chars = split.chars;
      const beam = beamRef.current!;
      const container = containerRef.current!;

      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 1,
      });

      tl.set(chars, {
        opacity: 0.1,
        color: "#333333",
      });

      tl.set(beam, {
        x: -100,
        opacity: 1,
      });

      tl.to(beam, {
        x: container.offsetWidth + 100,
        duration: duration,
        ease: "power1.inOut",
        onUpdate: function () {
          const beamRect = beam.getBoundingClientRect();
          const beamCenter = beamRect.left + beamRect.width / 2;

          chars.forEach((char) => {
            const charRect = char.getBoundingClientRect();
            const charCenter = charRect.left + charRect.width / 2;
            const distance = Math.abs(beamCenter - charCenter);

            if (distance < 50) {
              gsap.to(char, {
                opacity: 1,
                color: "#ffffff",
                textShadow: "0 0 10px #00aaff",
                duration: 0.1,
                overwrite: true,
              });
            }
          });
        },
      });

      tl.to(
        chars,
        {
          textShadow: "0 0 0px transparent",
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.3"
      );

      tl.to(
        beam,
        {
          opacity: 0,
          duration: 0.3,
        },
        "-=0.5"
      );
    },
    { scope: containerRef, dependencies: [children, duration] }
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-x-hidden px-4 ${className}`}
    >
      <div
        ref={beamRef}
        className="absolute top-0 left-0 w-1 h-full pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, #00aaff, #00ffff, #00aaff, transparent)",
          width: "60px",
          boxShadow: "0 0 30px #00aaff, 0 0 60px #00aaff",
        }}
      />
      <span ref={textRef}>{children}</span>
    </div>
  );
}
