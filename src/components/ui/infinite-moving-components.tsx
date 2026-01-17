"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
// import gsap from "gsap";
import StarBorder from "../mine/landing-page/star-border";

export const ComponentTransition = ({
  componentArr,
  interval = 5000,
  className,
}: {
  componentArr: {
    name: string;
    description: string;
    component: React.ReactNode;
  }[];
  interval?: number;
  className?: string;
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFade(false);
      setTimeout(() => {
        const nextIdx = (currentIdx + 1) % componentArr.length;

        setCurrentIdx(nextIdx);
        setFade(true);
      }, 300); // fade out duration
    }, interval);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIdx, interval, componentArr.length]);

  return (
    <div
      className={cn(
        "relative z-20 w-full aspect-square  overflow-hidden flex flex-col items-center justify-center",
        className
      )}
    >
      <StarBorder />
      <div className="z-30  w-full h-full p-2">
        <div
          key={currentIdx}
          className={cn(
            "transition-opacity duration-300 w-full h-full flex items-center justify-center",
            fade ? "opacity-100" : "opacity-0"
          )}
        >
          {componentArr[currentIdx].component}
        </div>
        <div className="leading-2 absolute left-3 bottom-3">
          <p className="text-xs ">{componentArr[currentIdx].name}</p>
          <p className="text-[8px] text-muted-foreground">
            {componentArr[currentIdx].description}
          </p>
        </div>
      </div>
    </div>
  );
};
