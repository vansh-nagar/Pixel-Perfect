/**
 * A cursor image trail with six switchable reveal effects — flame, venetian, curtain, hexagon, liquid and zoom split.
 */
"use client";

import { useEffect, useRef, useState } from "react";

type Fragment = {
  element: HTMLElement;
  index: number;
  reveal: () => void;
  collapse: () => void;
};

type Pattern = {
  name: string;
  create: (imageSrc: string, size: number) => Fragment[];
  revealTiming: (i: number, total: number) => number;
  collapseTiming: (i: number, total: number) => number;
};

type TrailItem = {
  element: HTMLElement;
  rotation?: number;
  fragments?: Fragment[];
  pattern?: string;
  removeTime: number;
  isFlame?: boolean;
};

const Images = [
  "https://cdn.cosmos.so/9beb0a06-e008-4b95-a5b8-15c2d255a4c4?format=jpeg",
  "https://cdn.cosmos.so/6a854a1b-5c06-45b1-b055-4a4652ba4e21?format=jpeg",
  "https://cdn.cosmos.so/3c35a1b1-717b-4219-9282-881a762724f2?format=jpeg",
  "https://cdn.cosmos.so/8a6998b4-fce7-48c4-b40c-9b90bcf0007c?format=jpeg",
  "https://cdn.cosmos.so/f798acc8-6bc8-4f2c-ace2-2440f2be4795?format=jpeg",
  "https://cdn.cosmos.so/39a80b7b-29fb-4079-a251-176df0fa15eb?format=jpeg",
];

const config = {
  imageLifespan: 600,
  removalDelay: 16,
  mouseThreshold: 40,
  inDuration: 600,
  outDuration: 800,
  inEasing: "cubic-bezier(.07,.5,.5,1)",
  outEasing: "cubic-bezier(.87,0,.13,1)",
  minMovementForImage: 5,
  minImageSize: 120,
  maxImageSize: 240,
  baseRotation: 30,
  maxRotationFactor: 3,
  speedSmoothingFactor: 0.25,
  staggerRange: 50,
  easing: {
    scale: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    reveal: "cubic-bezier(0.87, 0, 0.13, 1)",
  },
};

const makeFragment = (imageSrc: string) => {
  const fragment = document.createElement("div");
  fragment.style.position = "absolute";
  const bg = document.createElement("div");
  bg.style.position = "absolute";
  bg.style.inset = "0";
  bg.style.backgroundImage = `url(${imageSrc})`;
  bg.style.backgroundSize = "cover";
  bg.style.backgroundPosition = "center";
  fragment.appendChild(bg);
  return fragment;
};

const PATTERNS: Record<string, Pattern> = {
  flame: {
    name: "Flame",
    create: () => [],
    revealTiming: () => 0,
    collapseTiming: () => 0,
  },
  venetian: {
    name: "Venetian",
    create: (imageSrc) => {
      const fragments: Fragment[] = [];
      const stripCount = 12;
      const stripHeight = 100 / stripCount;
      for (let i = 0; i < stripCount; i++) {
        const fragment = makeFragment(imageSrc);
        const y = i * stripHeight;
        fragment.style.cssText += `top:0;left:0;width:100%;height:100%;transform:translate3d(0,0,0) rotateX(90deg);transform-origin:50% ${
          y + stripHeight / 2
        }%;clip-path:polygon(0% ${y}%,100% ${y}%,100% ${y + stripHeight}%,0% ${
          y + stripHeight
        }%);transition:transform ${config.inDuration}ms ${config.easing.reveal};`;
        fragments.push({
          element: fragment,
          index: i,
          reveal: () => {
            fragment.style.transform = "translate3d(0,0,0) rotateX(0deg)";
          },
          collapse: () => {
            fragment.style.transform = "translate3d(0,0,0) rotateX(-90deg)";
          },
        });
      }
      return fragments;
    },
    revealTiming: (i, total) => Math.abs(i - total / 2) * 0.08,
    collapseTiming: (i) => i * 0.04,
  },
  curtain: {
    name: "Curtain",
    create: (imageSrc) => {
      const fragments: Fragment[] = [];
      const stripCount = 10;
      for (let i = 0; i < stripCount; i++) {
        const fragment = makeFragment(imageSrc);
        const x = (i / stripCount) * 100;
        const w = 100 / stripCount;
        fragment.style.cssText += `top:0;left:0;width:100%;height:100%;clip-path:polygon(${
          x + w / 2
        }% 0%,${x + w / 2}% 0%,${x + w / 2}% 100%,${
          x + w / 2
        }% 100%);transition:clip-path ${config.inDuration}ms ${
          config.easing.reveal
        };`;
        fragments.push({
          element: fragment,
          index: i,
          reveal: () => {
            fragment.style.clipPath = `polygon(${x}% 0%,${x + w}% 0%,${
              x + w
            }% 100%,${x}% 100%)`;
          },
          collapse: () => {
            fragment.style.clipPath = `polygon(${x + w / 2}% 0%,${
              x + w / 2
            }% 0%,${x + w / 2}% 100%,${x + w / 2}% 100%)`;
          },
        });
      }
      return fragments;
    },
    revealTiming: (i, total) => (i / total) * 0.6,
    collapseTiming: (i, total) => ((total - 1 - i) / total) * 0.3,
  },
  hexagon: {
    name: "Hexagon",
    create: (imageSrc) => {
      const fragments: Fragment[] = [];
      const hexagons = [
        { x: 50, y: 50, size: 20 },
        { x: 25, y: 25, size: 15 },
        { x: 75, y: 25, size: 15 },
        { x: 85, y: 50, size: 15 },
        { x: 75, y: 75, size: 15 },
        { x: 25, y: 75, size: 15 },
        { x: 15, y: 50, size: 15 },
      ];
      hexagons.forEach((hex, i) => {
        const fragment = makeFragment(imageSrc);
        const s = hex.size;
        const x = hex.x;
        const y = hex.y;
        const hexShape = `polygon(${x - s * 0.5}% ${y - s * 0.87}%,${
          x + s * 0.5
        }% ${y - s * 0.87}%,${x + s}% ${y}%,${x + s * 0.5}% ${y + s * 0.87}%,${
          x - s * 0.5
        }% ${y + s * 0.87}%,${x - s}% ${y}%)`;
        fragment.style.cssText += `top:0;left:0;width:100%;height:100%;clip-path:polygon(${x}% ${y}%,${x}% ${y}%,${x}% ${y}%);transition:clip-path ${config.inDuration}ms ${config.easing.reveal};`;
        fragments.push({
          element: fragment,
          index: i,
          reveal: () => {
            fragment.style.clipPath = hexShape;
          },
          collapse: () => {
            fragment.style.clipPath = `polygon(${x}% ${y}%,${x}% ${y}%,${x}% ${y}%)`;
          },
        });
      });
      return fragments;
    },
    revealTiming: (i) => (i === 0 ? 0 : 0.2 + (i - 1) * 0.06),
    collapseTiming: (i) => (i === 0 ? 0.3 : (i - 1) * 0.04),
  },
  liquid: {
    name: "Liquid",
    create: (imageSrc) => {
      const fragments: Fragment[] = [];
      const positions = [
        { x: 25, y: 20, r: 16 },
        { x: 70, y: 15, r: 12 },
        { x: 45, y: 35, r: 18 },
        { x: 15, y: 55, r: 14 },
        { x: 80, y: 45, r: 15 },
        { x: 55, y: 70, r: 20 },
        { x: 30, y: 80, r: 13 },
        { x: 75, y: 75, r: 17 },
      ];
      positions.forEach((pos, i) => {
        const fragment = makeFragment(imageSrc);
        fragment.style.cssText += `top:0;left:0;width:100%;height:100%;clip-path:circle(0% at ${pos.x}% ${pos.y}%);transition:clip-path ${config.inDuration}ms ${config.easing.reveal};`;
        fragments.push({
          element: fragment,
          index: i,
          reveal: () => {
            fragment.style.clipPath = `circle(${pos.r}% at ${pos.x}% ${pos.y}%)`;
          },
          collapse: () => {
            fragment.style.clipPath = `circle(0% at ${pos.x}% ${pos.y}%)`;
          },
        });
      });
      return fragments;
    },
    revealTiming: (i, total) => (i / total) * 0.4,
    collapseTiming: (i, total) => ((total - 1 - i) / total) * 0.25,
  },
  zoomsplit: {
    name: "Zoom Split",
    create: (imageSrc) => {
      const fragments: Fragment[] = [];
      const gridSize = 3;
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const fragment = makeFragment(imageSrc);
          const x = (col / gridSize) * 100;
          const y = (row / gridSize) * 100;
          const w = 100 / gridSize;
          const h = 100 / gridSize;
          const cx = x + w / 2;
          const cy = y + h / 2;
          fragment.style.cssText += `top:0;left:0;width:100%;height:100%;clip-path:polygon(${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%);transition:clip-path ${config.inDuration}ms ${config.easing.scale};`;
          fragments.push({
            element: fragment,
            index: row * gridSize + col,
            reveal: () => {
              fragment.style.clipPath = `polygon(${x}% ${y}%,${x + w}% ${y}%,${
                x + w
              }% ${y + h}%,${x}% ${y + h}%)`;
            },
            collapse: () => {
              fragment.style.clipPath = `polygon(${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%)`;
            },
          });
        }
      }
      return fragments;
    },
    revealTiming: (i, total) => {
      const gridSize = Math.sqrt(total);
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const center = (gridSize - 1) / 2;
      return Math.hypot(col - center, row - center) * 0.15;
    },
    collapseTiming: (i, total) => {
      const gridSize = Math.sqrt(total);
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const center = (gridSize - 1) / 2;
      return Math.hypot(col - center, row - center) * 0.08;
    },
  },
};

const EFFECTS = Object.keys(PATTERNS);

const ImageTrailEffects = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef("flame");
  const [effect, setEffect] = useState("flame");

  const selectEffect = (name: string) => {
    effectRef.current = name;
    setEffect(name);
  };

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const trail: TrailItem[] = [];
    let mouseX = 0;
    let mouseY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let isMoving = false;
    let isInside = false;
    let lastRemovalTime = 0;
    let lastMoveTime = 0;
    let smoothedSpeed = 0;
    let maxSpeed = 0;
    let imageIndex = 0;
    let moveTimeout: ReturnType<typeof setTimeout>;
    let rafId = 0;

    const isInContainer = (x: number, y: number) => {
      const rect = root.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const hasMovedEnough = () =>
      Math.hypot(mouseX - lastMouseX, mouseY - lastMouseY) > config.mouseThreshold;

    const hasMovedAtAll = () =>
      Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY) >
      config.minMovementForImage;

    const calculateSpeed = () => {
      const now = timeNow();
      const dt = now - lastMoveTime;
      if (dt <= 0) return smoothedSpeed;
      const dist = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
      const raw = dist / dt;
      if (raw > maxSpeed) maxSpeed = raw;
      const norm = Math.min(raw / (maxSpeed || 0.5), 1);
      smoothedSpeed =
        smoothedSpeed * (1 - config.speedSmoothingFactor) +
        norm * config.speedSmoothingFactor;
      lastMoveTime = now;
      return smoothedSpeed;
    };

    const createImage = (speed: number) => {
      const imageSrc = Images[imageIndex];
      imageIndex = (imageIndex + 1) % Images.length;
      const size =
        config.minImageSize + (config.maxImageSize - config.minImageSize) * speed;
      const currentEffect = effectRef.current;
      const pattern = PATTERNS[currentEffect];
      const rect = root.getBoundingClientRect();
      const x = mouseX - rect.left;
      const y = mouseY - rect.top;

      if (currentEffect === "flame") {
        const img = document.createElement("img");
        const rotFactor = 1 + speed * (config.maxRotationFactor - 1);
        const rot = (Math.random() - 0.5) * config.baseRotation * rotFactor;
        img.src = imageSrc;
        img.width = img.height = size;
        img.style.cssText = `position:absolute;pointer-events:none;border-radius:4px;object-fit:cover;left:${x}px;top:${y}px;transform:translate(-50%,-50%) rotate(${rot}deg) scale(0);transition:transform ${config.inDuration}ms ${config.inEasing};`;
        root.appendChild(img);
        requestAnimationFrame(() => {
          img.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(1)`;
        });
        trail.push({
          element: img,
          rotation: rot,
          removeTime: timeNow() + config.imageLifespan,
          isFlame: true,
        });
        return;
      }

      const imageContainer = document.createElement("div");
      imageContainer.style.cssText = `position:absolute;pointer-events:none;left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform:translate3d(-50%,-50%,0) scale(0);transition:transform ${config.inDuration}ms ${config.easing.scale};`;
      const fragments = pattern.create(imageSrc, size);
      fragments.forEach((f) => imageContainer.appendChild(f.element));
      root.appendChild(imageContainer);

      requestAnimationFrame(() => {
        imageContainer.style.transform = "translate3d(-50%,-50%,0) scale(1)";
        fragments.forEach((f) => {
          const delay =
            pattern.revealTiming(f.index, fragments.length) * config.staggerRange;
          setTimeout(() => f.reveal(), delay);
        });
      });

      trail.push({
        element: imageContainer,
        fragments,
        pattern: currentEffect,
        removeTime: timeNow() + config.imageLifespan,
      });
    };

    const createTrailImage = () => {
      if (!isInside || !isMoving) return;
      if (hasMovedEnough() && hasMovedAtAll()) {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        createImage(calculateSpeed());
        prevMouseX = mouseX;
        prevMouseY = mouseY;
      }
    };

    const removeOldImages = () => {
      const now = timeNow();
      if (now - lastRemovalTime < config.removalDelay || !trail.length) return;
      if (now < trail[0].removeTime) return;
      const item = trail.shift()!;

      if (item.isFlame) {
        item.element.style.transition = `transform ${config.outDuration}ms ${config.outEasing}`;
        item.element.style.transform = `translate(-50%,-50%) rotate(${
          (item.rotation ?? 0) + 360
        }deg) scale(0)`;
        setTimeout(() => item.element.remove(), config.outDuration);
      } else {
        const pattern = PATTERNS[item.pattern!];
        item.fragments?.forEach((f) => {
          const delay =
            pattern.collapseTiming(f.index, item.fragments!.length) *
            config.staggerRange;
          setTimeout(() => f.collapse(), delay);
        });
        item.element.style.transition = `transform ${config.outDuration}ms ${config.outEasing}`;
        item.element.style.transform = "translate3d(-50%,-50%,0) scale(0)";
        setTimeout(() => item.element.remove(), config.outDuration);
      }
      lastRemovalTime = now;
    };

    const handleMouseMove = (e: MouseEvent) => {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      isInside = isInContainer(mouseX, mouseY);
      if (isInside && hasMovedAtAll()) {
        isMoving = true;
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => (isMoving = false), 100);
      }
    };

    const animate = () => {
      createTrailImage();
      removeOldImages();
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
      clearTimeout(moveTimeout);
      // Remove the trail nodes we appended (React owns the rest of the subtree).
      trail.forEach((item) => item.element.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none relative z-10 h-full w-full overflow-hidden"
    >
      <div className="pointer-events-auto absolute left-2 top-2 flex flex-wrap gap-1">
        {EFFECTS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => selectEffect(name)}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
              effect === name
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {PATTERNS[name].name}
          </button>
        ))}
      </div>

      {/* Preload so trail images appear instantly. */}
      <div className="pointer-events-none absolute h-px w-px opacity-0">
        {Images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" />
        ))}
      </div>
    </div>
  );
};

export default ImageTrailEffects;

// Frame-aligned timestamp without Date.now()/performance.now() at module load.
function timeNow() {
  return performance.now();
}
