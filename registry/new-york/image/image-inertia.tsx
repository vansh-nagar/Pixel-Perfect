"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(InertiaPlugin);

interface InertiaCardsProps {
  images: string[];
  className?: string;
  gap?: number;
}

const ImageInertia = ({ images, className, gap = 16 }: InertiaCardsProps) => {
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
  }, [images]);

  return (
    <div
      className={`grid grid-cols-3 grid-rows-2 gap-4 w-[30vw] ${
        className || ""
      }`}
      style={{ gap: `${gap}px` }}
    >
      {images.slice(0, 6).map((src, index) => (
        <img
          key={index}
          className={`cards ${
            index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
          } aspect-square rounded-md object-cover object-top will-change-transform`}
          src={src}
          alt={`Inertia Card ${index}`}
        />
      ))}
    </div>
  );
};

export default ImageInertia;
