"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TextRevealProps {
  children: string;
  className?: string;
  duration?: number;
  chars?: string;
}

export default function TextReveal2({
  children,
  className = "",
  duration = 1.5,
  chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*",
}: TextRevealProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isScrambling, setIsScrambling] = useState(true);

  useGSAP(
    () => {
      const el = textRef.current!;
      const finalText = children;

      const obj = { progress: 0 };

      gsap.to(obj, {
        progress: finalText.length,
        duration: duration,
        ease: "none",
        repeat: -1,
        repeatDelay: 1,
        onUpdate: () => {
          el.innerText = finalText
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (i < obj.progress) return finalText[i];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("");
        },
        onComplete: () => {
          el.innerText = finalText;
          setIsScrambling(false);
        },
      });
    },
    { dependencies: [children, duration, chars] }
  );

  return (
    <>
      <style jsx>{`
        .glitch {
          display: inline-block;
          animation: jitter 0.15s infinite alternate, colorGlitch 0.1s infinite;
        }

        @keyframes jitter {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(1px, -1px);
          }
        }

        @keyframes colorGlitch {
          0% {
            text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;
          }
          25% {
            text-shadow: -2px 0 #ff0000, 2px 0 #00ffff;
          }
          50% {
            text-shadow: 2px 1px #ff0000, -2px -1px #00ffff;
          }
          75% {
            text-shadow: -1px -1px #ff0000, 1px 1px #00ffff;
          }
          100% {
            text-shadow: 1px 0 #ff0000, -1px 0 #00ffff;
          }
        }
      `}</style>
      <span
        ref={textRef}
        className={`${className} ${isScrambling ? "glitch" : ""}`}
      >
        {children}
      </span>
    </>
  );
}
