"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

const logos = [
  {
    src: "/logo/cloud/react.svg",
    alt: "React Logo",
    name: "React",
    showName: true,
    width: "w-8",
  },
  {
    src: "/logo/cloud/nextdotjs.svg",
    alt: "Next.js Logo",
    width: "w-8",
  },
  {
    src: "/logo/cloud/tailwindcss.svg",
    alt: "Tailwind CSS Logo",
    width: "w-8",
  },
  {
    src: "/logo/cloud/framer.svg",
    alt: "Framer Logo",
    width: "w-8",
  },
  {
    src: "/logo/cloud/gsap.svg",
    alt: "GSAP Logo",
    width: "w-12",
  },
];

export const InfiniteMovingStack = ({
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn("scroller relative overflow-hidden", className)}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max shrink-0 flex-nowrap gap-4 ",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {logos.map((item, idx) => (
          <div
            key={idx}
            className="w-[200px] max-sm:w-[100px] h-32 max-sm:h-20 border-r border-muted flex items-center justify-center shrink-0"
          >
            <li className="flex flex-col items-center justify-center">
              <img
                src={item.src}
                alt={item.alt}
                className="aspect-square w-12 max-sm:w-8 object-contain dark:invert"
              />
            </li>
          </div>
        ))}
      </ul>
    </div>
  );
};
