"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import MotionPathPlugin from "gsap/src/MotionPathPlugin";
import { Button } from "@/components/ui/button";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import { X, Layers, Sparkles } from "lucide-react";

gsap.registerPlugin(MotionPathPlugin);

const MotionPath = () => {
  const layerTl = useRef<GSAPTimeline | null>(null);
  const [isExploded, setIsExploded] = useState(false);

  useGSAP(() => {
    gsap.to(".div-image", {
      motionPath: {
        path: ".path",
        align: ".path",
        autoRotate: true,
        alignOrigin: [0.5, 0.5],
      },
      duration: 20,
      repeat: -1,
    });

    gsap.to("#beam", {
      strokeDashoffset: -500,
      repeat: -1,
      duration: 10,
      ease: "none",
      yoyo: true,
    });

    layerTl.current = gsap.timeline({ paused: true });

    layerTl.current.to(".layer-container", {
      rotateY: -25,
      rotateX: -15,
      scale: 1.5,
      duration: 1,
      ease: "power2.inOut",
    });

    layerTl.current.to(
      ".layer-1",
      {
        z: -150,
        y: 40,
        x: -20,
        opacity: 1,
        duration: 1.2,
        ease: "power2.out",
      },
      "-=0.5"
    );

    layerTl.current.to(
      ".layer-2",
      {
        z: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power2.out",
      },
      "<"
    );

    layerTl.current.to(
      ".layer-3",
      {
        z: 150,
        y: -40,
        x: 20,
        opacity: 1,
        duration: 1.2,
        ease: "power2.out",
      },
      "<"
    );

    layerTl.current.to(
      ".path",
      {
        stroke: "#4a5568",
        strokeWidth: 1.5,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=1"
    );

    layerTl.current.to(
      ".layer-label",
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
      },
      "-=0.8"
    );

    layerTl.current.to(
      ".light-path",
      {
        opacity: 0.3,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=1"
    );
  }, []);

  const handleToggle = () => {
    if (isExploded) {
      layerTl.current?.reverse();
    } else {
      layerTl.current?.play();
    }
    setIsExploded(!isExploded);
  };

  return (
    <div className="relative flex flex-col justify-center items-center perspective-distant overflow-hidden w-full h-screen">
      <div className="fixed top-11 right-1 flex flex-col gap-2 z-50">
        <LightDarkMode />
        <Button
          size="icon"
          className="rounded-none border-dashed"
          variant="outline"
          onClick={handleToggle}
        >
          {isExploded ? <X /> : <Layers />}
        </Button>
        <Button
          size={"icon"}
          className=" rounded-none border-dashed "
          variant={"outline"}
          onClick={handleToggle}
        >
          <Sparkles />
        </Button>
      </div>

      <div className="layer-container transform-style-preserve-3d will-change-transform relative">
        <div className="layer-3 absolute inset-0 transform-style-preserve-3d">
          <div className="relative z-50">
            <svg
              className="light-path opacity-0 absolute inset-0"
              width="276"
              height="73"
              viewBox="0 0 276 73"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M51.397 0.5H5.80211C4.73529 0.5 3.85627 1.33733 3.80447 2.40289L0.502499 70.3292C0.445691 71.4978 1.39976 72.4654 2.56906 72.4251L69.5165 70.1166C71.0368 70.0641 71.9444 68.401 71.1658 67.0941L59.8479 48.0961C59.3117 47.1962 58.1721 46.8624 57.2352 47.3309L40.897 55.5L72.897 39L84.6547 32.8656C86.8417 31.7245 88.7524 34.7808 86.7686 36.2471L77.7789 42.8916C76.2275 44.0383 77.0385 46.5 78.9676 46.5H102.053C103.902 46.5 104.761 48.7945 103.366 50.0086L84.4281 66.4914C83.0332 67.7055 83.8919 70 85.7412 70H118.903C119.789 70 120.569 69.4171 120.821 68.5675L133.772 24.8015C134.238 23.2274 136.297 22.8538 137.286 24.1638L167.123 63.678C168.375 65.3356 166.583 67.5665 164.694 66.7016L126.735 49.3184C124.782 48.4241 125.42 45.5 127.568 45.5H209.897C211.002 45.5 211.897 44.6046 211.897 43.5V18.5C211.897 17.3954 211.002 16.5 209.897 16.5H178.897C177.792 16.5 176.897 17.3954 176.897 18.5V68C176.897 69.1046 177.792 70 178.897 70H275.897"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-muted-foreground"
              />
            </svg>
            <img
              className="div-image h-4 w-4 object-cover aspect-square rounded-full absolute"
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn6nN-uv5aitGjvVS_lV_Lagkotxwl_KL9jA&s"
              alt="Follower"
            />
            <div className="layer-label opacity-0 translate-x-4 absolute -right-32 top-0 text-xs font-mono text-muted-foreground whitespace-nowrap">
              Layer 3: Follower
            </div>
          </div>
        </div>

        <div className="layer-2 z-40 transform-style-preserve-3d relative">
          <svg
            width="276"
            height="73"
            viewBox="0 0 276 73"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative"
          >
            <path
              id="beam"
              d="M51.397 0.5H5.80211C4.73529 0.5 3.85627 1.33733 3.80447 2.40289L0.502499 70.3292C0.445691 71.4978 1.39976 72.4654 2.56906 72.4251L69.5165 70.1166C71.0368 70.0641 71.9444 68.401 71.1658 67.0941L59.8479 48.0961C59.3117 47.1962 58.1721 46.8624 57.2352 47.3309L40.897 55.5L72.897 39L84.6547 32.8656C86.8417 31.7245 88.7524 34.7808 86.7686 36.2471L77.7789 42.8916C76.2275 44.0383 77.0385 46.5 78.9676 46.5H102.053C103.902 46.5 104.761 48.7945 103.366 50.0086L84.4281 66.4914C83.0332 67.7055 83.8919 70 85.7412 70H118.903C119.789 70 120.569 69.4171 120.821 68.5675L133.772 24.8015C134.238 23.2274 136.297 22.8538 137.286 24.1638L167.123 63.678C168.375 65.3356 166.583 67.5665 164.694 66.7016L126.735 49.3184C124.782 48.4241 125.42 45.5 127.568 45.5H209.897C211.002 45.5 211.897 44.6046 211.897 43.5V18.5C211.897 17.3954 211.002 16.5 209.897 16.5H178.897C177.792 16.5 176.897 17.3954 176.897 18.5V68C176.897 69.1046 177.792 70 178.897 70H275.897"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="2"
              strokeDasharray="200 100"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="grad">
                <stop offset="0%" stopColor="#00f7ff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="layer-label opacity-0 translate-x-4 absolute -right-28 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground whitespace-nowrap">
            Layer 2: Beam
          </div>
        </div>

        <div className="layer-1 absolute inset-0 transform-style-preserve-3d">
          <svg
            width="276"
            height="73"
            viewBox="0 0 276 73"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="path"
              d="M51.397 0.5H5.80211C4.73529 0.5 3.85627 1.33733 3.80447 2.40289L0.502499 70.3292C0.445691 71.4978 1.39976 72.4654 2.56906 72.4251L69.5165 70.1166C71.0368 70.0641 71.9444 68.401 71.1658 67.0941L59.8479 48.0961C59.3117 47.1962 58.1721 46.8624 57.2352 47.3309L40.897 55.5L72.897 39L84.6547 32.8656C86.8417 31.7245 88.7524 34.7808 86.7686 36.2471L77.7789 42.8916C76.2275 44.0383 77.0385 46.5 78.9676 46.5H102.053C103.902 46.5 104.761 48.7945 103.366 50.0086L84.4281 66.4914C83.0332 67.7055 83.8919 70 85.7412 70H118.903C119.789 70 120.569 69.4171 120.821 68.5675L133.772 24.8015C134.238 23.2274 136.297 22.8538 137.286 24.1638L167.123 63.678C168.375 65.3356 166.583 67.5665 164.694 66.7016L126.735 49.3184C124.782 48.4241 125.42 45.5 127.568 45.5H209.897C211.002 45.5 211.897 44.6046 211.897 43.5V18.5C211.897 17.3954 211.002 16.5 209.897 16.5H178.897C177.792 16.5 176.897 17.3954 176.897 18.5V68C176.897 69.1046 177.792 70 178.897 70H275.897"
              fill="none"
              stroke="transparent"
              strokeWidth="1.5"
            />
          </svg>
          <div className="layer-label opacity-0 translate-x-4 absolute -right-32 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground whitespace-nowrap">
            Layer 1: Base Path
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotionPath;
