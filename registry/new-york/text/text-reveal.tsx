"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TextRevealProps {
  children: string;
  className?: string;
  duration?: number;
  chars?: string;
}

export default function TextReveal({
  children,
  className = "",
  duration = 1.5,
  chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*",
}: TextRevealProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = textRef.current!;
      const finalText = children;

      const obj = { progress: 0 };

      gsap.to(obj, {
        progress: finalText.length,
        duration: duration,
        repeat: -1,
        repeatDelay: 1,
        ease: "none",
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
        },
      });
    },
    { dependencies: [children, duration, chars] }
  );

  return (
    <span ref={textRef} className={className}>
      {children}
    </span>
  );
}
