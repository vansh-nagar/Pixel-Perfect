"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TextTypewriterGlitchProps {
  children: string;
  className?: string;
  duration?: number;
}

export default function TextTypewriterGlitch({
  children,
  className = "",
  duration = 3,
}: TextTypewriterGlitchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = textRef.current!;
      const finalText = children;
      const wrongChars = "!@#$%^&*()QWERTY";

      const runAnimation = () => {
        let currentText = "";
        let targetIndex = 0;

        const typeChar = () => {
          if (targetIndex >= finalText.length) {
            el.textContent = finalText;
            gsap.delayedCall(1, runAnimation);
            return;
          }

          const targetChar = finalText[targetIndex];
          const shouldGlitch = Math.random() > 0.6 && targetChar !== " ";

          if (shouldGlitch) {
            const wrongChar =
              wrongChars[Math.floor(Math.random() * wrongChars.length)];
            currentText += wrongChar;
            el.textContent = currentText + "|";

            gsap.delayedCall(0.1 + Math.random() * 0.15, () => {
              currentText = currentText.slice(0, -1);
              el.textContent = currentText + "|";

              gsap.delayedCall(0.08, () => {
                if (Math.random() > 0.5) {
                  const anotherWrong =
                    wrongChars[Math.floor(Math.random() * wrongChars.length)];
                  currentText += anotherWrong;
                  el.textContent = currentText + "|";

                  gsap.delayedCall(0.12, () => {
                    currentText = currentText.slice(0, -1);
                    el.textContent = currentText + "|";
                    gsap.delayedCall(0.08, () => {
                      currentText += targetChar;
                      el.textContent = currentText + "|";
                      targetIndex++;
                      gsap.delayedCall(0.05 + Math.random() * 0.1, typeChar);
                    });
                  });
                } else {
                  currentText += targetChar;
                  el.textContent = currentText + "|";
                  targetIndex++;
                  gsap.delayedCall(0.05 + Math.random() * 0.1, typeChar);
                }
              });
            });
          } else {
            currentText += targetChar;
            el.textContent = currentText + "|";
            targetIndex++;
            gsap.delayedCall(0.04 + Math.random() * 0.08, typeChar);
          }
        };

        el.textContent = "|";
        gsap.delayedCall(0.5, typeChar);
      };

      runAnimation();
    },
    { scope: containerRef, dependencies: [children, duration] }
  );

  return (
    <div ref={containerRef} className={className}>
      <span ref={textRef}></span>
    </div>
  );
}
