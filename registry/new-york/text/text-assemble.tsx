"use client";
import SplitText from "gsap/src/SplitText";
import ScrollTrigger from "gsap/src/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(SplitText, ScrollTrigger);

const TextAssemble = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const split = new SplitText(".st", { type: "chars" });

      const scrollTween = gsap.to(".con", {
        xPercent: -100,
        ease: "none",
        scrollTrigger: {
          trigger: ".wrapper",
          pin: true,
          scrub: true,
          end: () => "+=10000px",
        },
      });

      split.chars.forEach((char) => {
        gsap.from(char, {
          x: gsap.utils.random(0, 500),
          y: gsap.utils.random(-200, 200),
          rotate: gsap.utils.random(-20, 20),
          scrollTrigger: {
            containerAnimation: scrollTween,
            trigger: char,
            start: "left 100%",
            end: "left 80%",
            scrub: 1,
          },
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <div className=" h-screen "></div>
      <div className="wrapper h-screen flex items-center">
        <div className="con px-4">
          <span className="st text-xs text-nowrap ">
            LIKE • FOLLOW • STAY TUNED ✦ Building cool things every day ✦
            Sharing what actually works ✦ From bugs → breakthroughs ✦ Design •
            Code • Ship • Repeat ★ Don’t just watch — build with me ★ ☆ Real
            projects. Real progress. No noise. ✧ ꕤ ✱ ✧ ✦ ✫ ✬ ✭ ✮ ✯ ✰ ★ ☆ ✵ ✶ ✷ ✸
            ✹ ✺ ✻ ✼ ✽ ✾ ✿ ✧ ꕤ FOLLOW FOR: → clean UI ideas → dev experiments →
            behin
          </span>
        </div>
      </div>
      <div className="wrapper h-screen flex items-center bg-red-200"></div>
    </div>
  );
};

export default TextAssemble;
