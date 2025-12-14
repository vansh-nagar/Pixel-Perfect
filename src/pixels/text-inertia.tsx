"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(InertiaPlugin, SplitText);

const TextInertia = ({
  text = "hello  bro how are you",
  className,
  ...props
}: {
  text: string;
  className?: string;
}) => {
  const deltaX = useRef(0);
  const deltaY = useRef(0);

  useEffect(() => {
    let oldX = 0;
    let oldY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      deltaX.current = e.clientX - oldX;
      deltaY.current = e.clientY - oldY;

      oldX = e.clientX;
      oldY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useGSAP(() => {
    const textEl = document.querySelector(".text-inertia");
    if (!textEl) return;

    const split = new SplitText(textEl, { type: "words" });
    const words = split.words;

    words.forEach((word) => {
      const handleEnter = () => {
        gsap.to(word, {
          rotation: 0,
          y: 0,
          opacity: 1,
          inertia: {
            x: { velocity: deltaX.current * 20, end: 0 },
            y: { velocity: deltaY.current * 20, end: 0 },
            rotation: { velocity: (Math.random() - 0.5) * 300, end: 0 },
          },
        });
      };

      word.addEventListener("mouseenter", handleEnter);

      return () => {
        word.removeEventListener("mouseenter", handleEnter);
      };
    });
  });

  return (
    <div className="flex justify-center items-center overflow-hidden">
      <div className={cn("text-inertia", className)} {...props}>
        {text}
      </div>
    </div>
  );
};

export default TextInertia;

