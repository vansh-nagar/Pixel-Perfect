"use client";
import SplitText from "gsap/src/SplitText";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(SplitText);

const TextAssemble = () => {
  useGSAP(() => {
    const split = new SplitText(".st", { type: "chars" });

    gsap.from(split.chars, {
      x: () => gsap.utils.random(0, 200),
      y: () => gsap.utils.random(-200, 200),
      scrollTrigger: {
        start: "top bottom",
        trigger: ".st",
        pin: true,
        markers: true,
      },
    });
  });
  return (
    <div className="con h-[400vh">
      <div className="st text-9xl text-nowrap ">
        Non nisi do eu exercitation ipsum minim ex enim.
      </div>
    </div>
  );
};

export default TextAssemble;
