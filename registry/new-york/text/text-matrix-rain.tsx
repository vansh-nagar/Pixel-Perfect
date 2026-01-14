"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TextMatrixRainProps {
  children: string;
  className?: string;
  duration?: number;
  repeat?: boolean;
}

export default function TextMatrixRain({
  children,
  className = "",
  duration = 2,
  repeat = true,
}: TextMatrixRainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = textRef.current!;
      const finalText = children;
      const matrixChars =
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
      const intervals: NodeJS.Timeout[] = [];

      const runAnimation = () => {
        const charStates = new Array(finalText.length).fill(false);
        const charElements: HTMLSpanElement[] = [];

        el.innerHTML = "";
        finalText.split("").forEach((char, i) => {
          const span = document.createElement("span");
          span.style.display = "inline-block";
          span.style.color = "#00ff00";
          span.style.textShadow = "0 0 10px #00ff00";
          span.textContent =
            char === " "
              ? "\u00A0"
              : matrixChars[Math.floor(Math.random() * matrixChars.length)];
          el.appendChild(span);
          charElements.push(span);
        });

        charElements.forEach((span, i) => {
          if (finalText[i] === " ") {
            span.textContent = "\u00A0";
            return;
          }

          const lockDelay = i * 0.1 + Math.random() * 0.5;

          const scrambleInterval = setInterval(() => {
            if (!charStates[i]) {
              span.textContent =
                matrixChars[Math.floor(Math.random() * matrixChars.length)];
            }
          }, 50);
          intervals.push(scrambleInterval);

          gsap.delayedCall(lockDelay, () => {
            clearInterval(scrambleInterval);
            charStates[i] = true;

            gsap.to(span, {
              duration: 0.2,
              color: "#ffffff",
              textShadow: "0 0 20px #00ff00, 0 0 40px #00ff00",
              onComplete: () => {
                span.textContent = finalText[i];
                gsap.to(span, {
                  duration: 0.5,
                  textShadow: "0 0 0px transparent",
                  ease: "power2.out",
                });
              },
            });
          });
        });
      };

      runAnimation();

      let repeatInterval: NodeJS.Timeout | undefined;
      if (repeat) {
        repeatInterval = setInterval(() => {
          intervals.forEach(clearInterval);
          intervals.length = 0;
          runAnimation();
        }, (duration + 1) * 1000);
      }

      return () => {
        if (repeatInterval) clearInterval(repeatInterval);
        intervals.forEach(clearInterval);
      };
    },
    { scope: containerRef, dependencies: [children, duration, repeat] }
  );

  return (
    <div ref={containerRef} className={className}>
      <span ref={textRef}>{children}</span>
    </div>
  );
}
