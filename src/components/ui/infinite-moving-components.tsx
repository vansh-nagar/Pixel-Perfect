"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
// import gsap from "gsap";
import StarBorder from "../mine/landing-page/star-border";

export const ComponentTransition = ({
  componentArr,
  interval = 3000,
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      let nextIdx = Math.floor(Math.random() * componentArr.length);
      if (nextIdx === currentIdx && componentArr.length > 1) {
        nextIdx = (nextIdx + 1) % componentArr.length;
      }
      setCurrentIdx(nextIdx);
    }, interval);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIdx, interval, componentArr.length]);

  return (
    <div
      className={cn(
        "relative z-20 w-full aspect-square border  overflow-hidden border-r  border-muted flex flex-col items-center justify-center",
        className
      )}
    >
      <StarBorder />
      <div className="z-30 flex flex-col items-center justify-center w-full h-full p-2">
        {componentArr[currentIdx].component}
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
