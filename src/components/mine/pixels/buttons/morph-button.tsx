"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import MorphSVGPlugin from "gsap/MorphSVGPlugin";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(MorphSVGPlugin);

const MorphButton = ({ children }: { children: React.ReactNode }) => {
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

      const tl2 = gsap.timeline({ paused: true });
      tl2.from(".text", { color: "#000000", scale: 1 }).to(".text", {
        color: "#ffffff",
        duration: 0.5,
        scale: 1.02,
        ease: "power2.inOut",
      });
      if (!buttonRef.current) return;

      buttonRef.current.addEventListener("mouseenter", () => {
        tl.play();
        tl2.play();
      });
      buttonRef.current.addEventListener("mouseleave", () => {
        tl.reverse();
        tl2.reverse();
      });
    },
    { scope: buttonRef }
  );
  return (
    <Button
      ref={buttonRef}
      variant="outline"
      className="relative button cursor-pointer    overflow-hidden"
    >
      <div className="absolute inset-0">
        <svg
          style={{
            width: "100%",
            height: "100%",
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="transition"
        >
          <path
            className="path"
            fill="#000000 "
            strokeWidth="0px"
            vectorEffect="non-scaling-stroke"
            d="M 0 100 V 100 Q 50 100 100 100 V 100 z"
          />
        </svg>
      </div>
      <div className=" z-40  scale-100  text">Hover Me</div>
    </Button>
  );
};

export default MorphButton;
