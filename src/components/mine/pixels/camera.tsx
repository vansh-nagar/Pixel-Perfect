"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const Camera = ({ printOut = "" }: { printOut: string }) => {
  const cameraRef = useRef(null);
  const cameraContainer = useRef(null);
  const container = useRef(null);
  const receipt = useRef(null);

  const textContainer = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "center bottom",
        end: "center 50%",
        scrub: true,
      },
    });
    tl.to(textContainer.current, {
      y: "-33.3%",
    });
    tl.to(textContainer.current, {
      y: "-66.6%",
    });
  });

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top center",
        end: "center center",
        scrub: true,
      },
    });

    tl.from(cameraContainer.current, {
      y: "100vh",
      onReverseComplete: () => {
        gsap.to(receipt.current, {
          clearProps: "all", // revert to original DOM place
        });
      },
      onComplete: () => {
        gsap.to("body", {
          backgroundColor: "white",
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        });

        gsap.to(receipt.current, {
          y: window.innerWidth > 768 ? "170%" : "140%",
          duration: 2,
        });
      },
    });

    tl.to(
      "body",
      {
        backgroundColor: "#0a0a0a",
      },
      0
    );
  });

  return (
    <div
      ref={container}
      className=" flex  justify-center items-center h-screen w-full relative "
    >
      <div className=" flex gap-2 text-4xl  h-36 font-bold">
        <div>Capture in</div>
        <div className=" overflow-hidden h-[33.3%] text-nowrap mix-blend-difference">
          <div ref={textContainer}>
            <div className="">3...</div>
            <div className="">2...</div>
            <div className="">1...</div>
          </div>
        </div>
      </div>
      <div
        ref={cameraContainer}
        className=" absolute flex flex-col items-center"
      >
        <img
          ref={cameraRef}
          src="/camera/camera.png"
          className="w-80 z-50 mb-4 max-md:w-60 "
          alt=""
        />
        <img
          ref={receipt}
          src={`${printOut}`}
          alt=""
          className=" w-32  max-md:w-28 z-0 absolute bottom-1/2 translate-y-1/2"
        />
      </div>
    </div>
  );
};

export default Camera;
