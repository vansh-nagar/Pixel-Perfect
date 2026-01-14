"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger);

const TextFade = ({
  className,
  textContent,
}: {
  className?: string;
  textContent?: string;
}) => {
  const text = useRef<HTMLSpanElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const split = new SplitText(text.current, { type: "words" });
    gsap.set(split.words, {
      opacity: 0.3,
      filter: "blur(1.3px)",
      color: "#b5cab7",
    });
    gsap.to(split.words, {
      opacity: 1,
      stagger: 0.1,
      color: "#f3efe6",
      filter: "blur(0px)",
      repeat: -1,
      // scrollTrigger: {
      //   trigger: container.current,
      //   start: "top 80%",
      //   end: "bottom 20%",
      //   scrub: 1,
      // },
    });
  });

  return (
    <div ref={container} className="h-full w-full">
      <span
        ref={text}
        className={`flex items-center justify-start gap-x-1.5 flex-wrap  ${
          className ? ` ${className}` : ""
        }`}
      >
        {textContent ||
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim harum cupiditate provident nostrum temporibus officiis! Nostrum alias exercitationem molestiae dolorem quo natus iure deserunt magni ea dicta. Temporibus, totam doloribus!"}
      </span>
    </div>
  );
};

export default TextFade;
