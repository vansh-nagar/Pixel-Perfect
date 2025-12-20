"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import MorphSVGPlugin from "gsap/MorphSVGPlugin";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(MorphSVGPlugin);

const MorphImageMaskButton = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useGSAP(
    () => {
      const start = "M 0 100 V 50 Q 50 0 100 50 V 100 z";
      const end = "M 0 100 V 0 Q 50 0 100 0 V 100 z";

      const tl = gsap.timeline({ paused: true });

      tl.to(".path", {
        morphSVG: start,
        ease: "power2.in",
      }).to(".path", {
        morphSVG: end,
        ease: "power2.out",
      });

      if (!buttonRef.current) return;

      buttonRef.current?.addEventListener("mouseenter", () => {
        tl.play();
      });
      buttonRef.current?.addEventListener("mouseleave", () => {
        tl.reverse();
      });
    },
    { scope: buttonRef }
  );
  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      className="relative button cursor-pointer   rounded-md m-2  overflow-hidden"
    >
      <div className="absolute inset-0 z-30">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          style={{
            width: "100%",
            height: "100%",
          }}
          className="absolute inset-0 "
        >
          <defs>
            <mask id="waveMask">
              <rect x="0" y="0" width="100" height="100" fill="black" />
              <path
                className="path"
                fill="white"
                d="M 0 100 V 100 Q 50 100 100 100 V 100 z"
              />
            </mask>
          </defs>

          <image
            href="https://i.pinimg.com/1200x/ba/04/b5/ba04b5b6de06babfd39cb0346fe94d1c.jpg"
            preserveAspectRatio="xMidYMid slice"
            height={"100"}
            width={"100"}
            x="0"
            y="0"
            mask="url(#waveMask)"
          />
        </svg>
      </div>
      <img
        src="https://i.pinimg.com/736x/8f/3c/69/8f3c69cbae64cc1af6d6cc33acec50e3.jpg"
        alt=""
        className=" absolute object-top"
      />
      <div className=" z-40  scale-100  text text-white">hover me</div>
    </Button>
  );
};

export default MorphImageMaskButton;
