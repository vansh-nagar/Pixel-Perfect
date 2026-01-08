"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MousePos {
  x: number;
  y: number;
}

const Image = [
  "https://cdn.cosmos.so/9beb0a06-e008-4b95-a5b8-15c2d255a4c4?format=jpeg",
  "https://cdn.cosmos.so/6a854a1b-5c06-45b1-b055-4a4652ba4e21?format=jpeg",
  "https://cdn.cosmos.so/3c35a1b1-717b-4219-9282-881a762724f2?format=jpeg",
  "https://cdn.cosmos.so/8a6998b4-fce7-48c4-b40c-9b90bcf0007c?format=jpeg",
  "https://cdn.cosmos.so/f798acc8-6bc8-4f2c-ace2-2440f2be4795?format=jpeg",
  "https://cdn.cosmos.so/39a80b7b-29fb-4079-a251-176df0fa15eb?format=jpeg",
  "https://cdn.cosmos.so/dfa2ba1c-97b6-44ba-a68b-7c619c9d416b?format=jpeg",
  "https://cdn.cosmos.so/97de8d7c-f9c0-4625-838f-3aaf8c286cdb?format=jpeg",
  "https://cdn.cosmos.so/71e10d8f-c92d-4761-96ce-4b6cc9eedcbe?format=jpeg",
  "https://cdn.cosmos.so/0cff1394-f353-4c9e-87f7-37c63d165bf9?format=jpeg",
  "https://cdn.cosmos.so/15a7b84c-ba74-470f-8813-25eb0a0d8ba2?format=jpeg",
];

const MouseFollower1 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const flairRefs = useRef<(HTMLImageElement | null)[]>([]);
  const mousePosRef = useRef<MousePos>({ x: 0, y: 0 });
  const lastMousePosRef = useRef<MousePos>({ x: 0, y: 0 });
  const cachedMousePosRef = useRef<MousePos>({ x: 0, y: 0 });
  const indexRef = useRef(0);
  const gapRef = useRef(100);
  const isHoveringRef = useRef(false);
  const boundsRef = useRef({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    const wrapper = gsap.utils.wrap(0, Image.length);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      mousePosRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      const rect = containerRef.current.getBoundingClientRect();
      boundsRef.current = {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };

      const isInContainer =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      isHoveringRef.current = isInContainer;

      if (!isInContainer) {
        flairRefs.current.forEach((img) => {
          if (img) img.style.opacity = "0";
        });
      }
    };

    const playAnimation = (shape: HTMLImageElement) => {
      const tl = gsap.timeline();
      tl.from(shape, {
        opacity: 0,
        scale: 0,
        ease: "elastic.out(1,0.3)",
      })
        .to(
          shape,
          {
            rotation: gsap.utils.random(-360, 360),
          },
          "<"
        )
        .to(
          shape,
          {
            y: "120vh",
            ease: "back.in(0.4)",
            duration: 1,
          },
          0
        );
    };

    const animateImage = () => {
      if (!isHoveringRef.current) return;

      const wrappedIndex = wrapper(indexRef.current);
      const img = flairRefs.current[wrappedIndex];

      if (!img) return;

      gsap.killTweensOf(img);

      gsap.set(img, {
        clearProps: "all",
      });

      const bounds = boundsRef.current;
      const clampedX = Math.max(
        bounds.left,
        Math.min(mousePosRef.current.x, bounds.right)
      );
      const clampedY = Math.max(
        bounds.top,
        Math.min(mousePosRef.current.y, bounds.bottom)
      );

      gsap.set(img, {
        opacity: 1,
        left: clampedX,
        top: clampedY,
        xPercent: -50,
        yPercent: -50,
      });

      playAnimation(img);
      indexRef.current++;
    };

    const imageTrail = () => {
      const travelDistance = Math.hypot(
        lastMousePosRef.current.x - mousePosRef.current.x,
        lastMousePosRef.current.y - mousePosRef.current.y
      );

      cachedMousePosRef.current.x = gsap.utils.interpolate(
        cachedMousePosRef.current.x || mousePosRef.current.x,
        mousePosRef.current.x,
        0.1
      );
      cachedMousePosRef.current.y = gsap.utils.interpolate(
        cachedMousePosRef.current.y || mousePosRef.current.y,
        mousePosRef.current.y,
        0.1
      );

      if (travelDistance > gapRef.current) {
        animateImage();
        lastMousePosRef.current = { ...mousePosRef.current };
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    gsap.ticker.add(imageTrail);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      gsap.ticker.remove(imageTrail);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden h-full w-full flex items-center justify-center border "
    >
      <div className="fixed inset-0 pointer-events-none">
        {Image.concat(Image).map((img, i) => (
          <img
            key={i}
            ref={(el) => {
              if (el) flairRefs.current[i] = el;
            }}
            src={img}
            alt="flair"
            className="fixed w-12 opacity-0"
            style={{
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MouseFollower1;
