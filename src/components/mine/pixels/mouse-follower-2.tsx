"use client";

import { useEffect, useRef } from "react";

const MouseFollower2 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<any[]>([]);
  const stateRef = useRef({
    mouseX: 0,
    mouseY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    prevMouseX: 0,
    prevMouseY: 0,
  });

  const images = [
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

  const config = {
    imageLifespan: 600,
    removalDelay: 16,
    mouseThreshold: 40,
    inDuration: 600,
    outDuration: 800,
    inEasing: "cubic-bezier(.07,.5,.5,1)",
    outEasing: "cubic-bezier(.87, 0, .13, 1)",
    baseImageSize: 120,
    minImageSize: 60,
    maxImageSize: 120,
    baseRotation: 30,
    maxRotationFactor: 3,
  };

  const createImage = () => {
    if (!containerRef.current) return;
    const imageIndex = Math.floor(Math.random() * images.length);
    const imageSrc = images[imageIndex];
    const size =
      Math.random() * (config.maxImageSize - config.minImageSize) +
      config.minImageSize;

    const img = document.createElement("img");
    img.className = "trail-img";
    img.src = imageSrc;
    img.width = img.height = size;

    const rect = containerRef.current.getBoundingClientRect();
    const x = stateRef.current.mouseX - rect.left;
    const y = stateRef.current.mouseY - rect.top;

    const rot = (Math.random() - 0.5) * config.baseRotation;
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(0)`;
    img.style.transition = `transform ${config.inDuration}ms ${config.inEasing}`;

    containerRef.current.appendChild(img);

    setTimeout(() => {
      img.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(1)`;
    }, 10);

    trailRef.current.push({
      element: img,
      rotation: rot,
      removeTime: Date.now() + config.imageLifespan,
    });
  };

  const removeOldImages = () => {
    const now = Date.now();
    if (!trailRef.current.length) return;

    while (trailRef.current.length && now >= trailRef.current[0].removeTime) {
      const imgObj = trailRef.current.shift();

      // Unique vortex implosion effect
      const randomX = (Math.random() - 0.5) * 100;
      const randomY = (Math.random() - 0.5) * 100;
      const randomRotation = Math.random() * 720 - 360;
      const randomSkew = (Math.random() - 0.5) * 30;

      imgObj.element.style.transition = `all ${config.outDuration}ms cubic-bezier(0.36, 0, 0.66, -0.56)`;
      imgObj.element.style.opacity = "0";
      imgObj.element.style.transform = `
        translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY}px))
        rotate(${randomRotation}deg)
        skewX(${randomSkew}deg)
        scale(0.3)
        blur(20px)
      `;

      setTimeout(() => imgObj.element.remove(), config.outDuration);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = stateRef.current;
      state.prevMouseX = state.mouseX;
      state.prevMouseY = state.mouseY;
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isInContainer =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInContainer) {
        const dx = state.mouseX - state.lastMouseX;
        const dy = state.mouseY - state.lastMouseY;
        if (Math.hypot(dx, dy) > config.mouseThreshold) {
          createImage();
          state.lastMouseX = state.mouseX;
          state.lastMouseY = state.mouseY;
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    const animationLoop = setInterval(() => {
      removeOldImages();
    }, config.removalDelay);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearInterval(animationLoop);
    };
  }, []);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #000;
          overflow: hidden;
        }

        .hero-section {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          overflow: hidden;
        }

        .trail-img {
          position: absolute;
          pointer-events: none;
          will-change: transform;
          z-index: 12;
        }
      `}</style>

      <section className="hero-section" ref={containerRef}></section>
    </>
  );
};

export default MouseFollower2;
