"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
import StarBorder from "../mine/landing-page/star-border";

type TransitionItem = {
  name: string;
  description: string;
  component?: React.ReactNode;
};

export const ComponentTransition = ({
  componentArr,
  load,
  interval = 5000,
  className,
}: {
  componentArr?: TransitionItem[];
  load?: () => Promise<TransitionItem[]>;
  interval?: number;
  className?: string;
}) => {
  const [items, setItems] = useState<TransitionItem[]>(componentArr ?? []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!load || !el) return;
    let alive = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        load().then((loaded) => {
          if (alive) setItems(loaded);
        });
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [load]);

  useEffect(() => {
    if (items.length === 0) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFade(false);
      setTimeout(() => {
        const nextIdx = (currentIdx + 1) % items.length;

        setCurrentIdx(nextIdx);
        setFade(true);
      }, 300);
    }, interval);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIdx, interval, items.length]);

  const current = items[currentIdx];

  return (
    <div
      ref={rootRef}
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
          {current?.component}
        </div>
        <div className="leading-2 absolute left-3 bottom-3">
          <p className="text-xs ">{current?.name}</p>
          <p className="text-[8px] text-muted-foreground">
            {current?.description}
          </p>
        </div>
      </div>
    </div>
  );
};
