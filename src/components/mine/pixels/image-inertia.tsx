"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(InertiaPlugin);

type BentoType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

interface InertiaCardsProps {
  images: string[];
  type?: BentoType;
  className?: string;
  gap?: number;
}

const bentoLayouts: Record<BentoType, string> = {
  1: "grid grid-cols-3 gap-4",
  2: "grid grid-cols-4 grid-rows-2 gap-4",
  3: "grid grid-cols-3 grid-rows-3 gap-4",
  4: "grid grid-cols-5 grid-rows-3 gap-4",
  5: "grid grid-cols-4 grid-rows-3 gap-4",
  6: "grid grid-cols-5 grid-rows-3 gap-4",
  7: "grid grid-cols-4 grid-rows-3 gap-4",
  8: "grid grid-cols-4 grid-rows-3 gap-4",
  9: "grid grid-cols-2 gap-4",
  10: "grid grid-cols-2 grid-rows-2 gap-4",
  11: "grid grid-cols-3 grid-rows-2 gap-4",
};

const maxImagesPerType: Record<BentoType, number> = {
  1: 9,
  2: 10,
  3: 9,
  4: 9,
  5: 10,
  6: 9,
  7: 9,
  8: 10,
  9: 4,
  10: 3,
  11: 6,
};

const bentoItemSpans: Record<BentoType, (index: number) => string> = {
  1: () => "col-span-1 row-span-1",
  2: (index) =>
    index === 0 || index === 1
      ? "col-span-2 row-span-2"
      : "col-span-1 row-span-1",
  3: (index) =>
    index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
  4: (index) =>
    index === 0 || index === 2
      ? "col-span-2 row-span-2"
      : "col-span-1 row-span-1",
  5: (index) =>
    index === 0 || index === 5
      ? "col-span-2 row-span-2"
      : "col-span-1 row-span-1",
  6: (index) =>
    index === 0 || index === 5
      ? "col-span-2 row-span-2"
      : "col-span-1 row-span-1",
  7: (index) =>
    index === 0 || index === 4
      ? "col-span-2 row-span-2"
      : "col-span-1 row-span-1",
  8: (index) =>
    index === 0 || index === 3
      ? "col-span-2 row-span-2"
      : "col-span-1 row-span-1",
  9: () => "col-span-1 row-span-1",
  10: (index) =>
    index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
  11: (index) =>
    index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
};

const ImageInertia = ({
  images,
  type = 11,
  className,
  gap = 16,
}: InertiaCardsProps) => {
  const deltaX = useRef(0);
  const deltaY = useRef(0);

  useEffect(() => {
    let oldX = 0;
    let oldY = 0;

    const handleUpdateDelta = (e: any) => {
      deltaX.current = e.clientX - oldX;
      deltaY.current = e.clientY - oldY;

      oldX = e.clientX;
      oldY = e.clientY;
    };

    window.addEventListener("mousemove", handleUpdateDelta);

    return () => {
      window.removeEventListener("mousemove", handleUpdateDelta);
    };
  }, []);

  useGSAP(() => {
    const cards = gsap.utils.toArray(".cards");

    const handleMouseEnter = (e: any) => {
      const tl = gsap.timeline();
      tl.to(e.currentTarget, {
        rotation: 0,
        inertia: {
          x: {
            velocity: deltaX.current * 20,
            end: 0,
          },
          y: {
            velocity: deltaY.current * 20,
            end: 0,
          },
          rotation: { velocity: (Math.random() - 0.5) * 300, end: 0 },
        },
      });
    };

    cards.forEach((card: any) => {
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseenter", handleMouseEnter);
    });

    return () => {
      cards.forEach((card: any) => {
        card.removeEventListener("mouseenter", handleMouseEnter);
      });
    };
  }, [type, images]);

  const layoutClass = bentoLayouts[type];
  const maxImages = maxImagesPerType[type];
  const imagesToDisplay = images.slice(0, maxImages);

  return (
    <div
      className={`${layoutClass} w-[30vw] ${className || ""}`}
      style={{ gap: `${gap}px` }}
    >
      {imagesToDisplay.map((src, index) => (
        <img
          key={index}
          className={`cards ${bentoItemSpans[type](
            index
          )} aspect-square rounded-md object-cover object-top will-change-transform`}
          src={src}
          alt={`Inertia Card ${index}`}
        />
      ))}
    </div>
  );
};

export default ImageInertia;
