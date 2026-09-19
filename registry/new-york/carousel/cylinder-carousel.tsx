"use client";

/**
 * Flat, high-contrast discs line the inside wall of a 3D cylinder, seen from its rim: they fly in from a wide spin, bob gently in place, and the ring turns as you drag. The whole scene leans toward the cursor.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

type World = {
  name: string;
  base: string;
  layers: { background: string; spin: string }[];
};

// Flat, high-contrast discs: one solid fill plus one hard-edged motif. No image or video assets.
const WORLDS: World[] = [
  {
    name: "Tangerine",
    base: "#ff5f1f",
    layers: [
      {
        background:
          "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px",
        spin: "c3d-spin 60s linear infinite",
      },
    ],
  },
  {
    name: "Cobalt",
    base: "#2d4bff",
    layers: [
      {
        background:
          "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px",
        spin: "c3d-spin 80s linear infinite reverse",
      },
    ],
  },
  {
    name: "Orchid",
    base: "#f6a8f2",
    layers: [
      {
        background:
          "repeating-radial-gradient(circle at 38% 38%, #ff5f1f 0 12px, transparent 12px 34px)",
        spin: "c3d-spin 24s linear infinite",
      },
    ],
  },
  {
    name: "Amber",
    base: "#ffb000",
    layers: [
      {
        background:
          "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)",
        spin: "c3d-spin 50s linear infinite",
      },
    ],
  },
  {
    name: "Violet",
    base: "#6b3ce6",
    layers: [
      {
        background:
          "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px",
        spin: "c3d-spin 70s linear infinite reverse",
      },
    ],
  },
];

// Ten cards around the ring, the five worlds twice over.
const CARDS = [...WORLDS, ...WORLDS];

const C = {
  radius: 800, // ring radius (px)
  perspective: 800, // camera distance (px); puts the viewer on the ring's rim
  ballSize: 800, // drawn at ballSize * perspective / 1200
  orbSize: 0.8, // disc diameter as a share of its card, leaving a gap between neighbours
  dragSensitivity: 0.5, // degrees of spin per px dragged
  entryDelay: 0.3, // s before the fly-in starts
  stageWidth: 1440, // container width the numbers above were tuned at
};

const IS_TOUCH =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);
const SPIN_SPRING = IS_TOUCH
  ? { stiffness: 28, damping: 22 }
  : { stiffness: 35, damping: 24 };
const SPREAD_SPRING = IS_TOUCH
  ? { stiffness: 24, damping: 18 }
  : { stiffness: 30, damping: 20 };
const TILT_SPRING = { stiffness: 50, damping: 18 };

const LAYER: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  transformStyle: "preserve-3d",
};

const CylinderCarousel = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x0: 0, rot0: 0 });
  const rect = useRef<DOMRect | null>(null);
  const tiltFrame = useRef(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);

  // Targets are set directly; springs chase them.
  const spinTarget = useMotionValue(270);
  const spreadTarget = useMotionValue(1.8);
  const tiltXTarget = useMotionValue(0);
  const tiltYTarget = useMotionValue(0);
  const spin = useSpring(spinTarget, SPIN_SPRING);
  const spread = useSpring(spreadTarget, SPREAD_SPRING);
  const tiltX = useSpring(tiltXTarget, TILT_SPRING);
  const tiltY = useSpring(tiltYTarget, TILT_SPRING);
  const radius = useTransform(spread, (s) => s * C.radius);

  // Fly-in: swing the ring a quarter turn and pull it in from 1.8x radius.
  useEffect(() => {
    // Reduced motion: snap straight to the settled ring.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 0 : C.entryDelay * 1000;
    const start = setTimeout(() => {
      spinTarget.set(180);
      spreadTarget.set(1);
      if (reduce) {
        spin.jump(180);
        spread.jump(1);
      }
    }, delay);
    const unlock = setTimeout(() => setReady(true), reduce ? 0 : delay + 1200);
    return () => {
      clearTimeout(start);
      clearTimeout(unlock);
    };
  }, [spinTarget, spreadTarget, spin, spread]);

  // Shrink the whole scene uniformly when the container is narrower than the stage.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const k = entry.contentRect.width / C.stageWidth;
      setScale(Math.min(1, Math.max(0.3, k)));
      rect.current = null;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pause the bob and orb loops while off-screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setPaused(!entry.isIntersecting),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const invalidate = () => {
      rect.current = null;
    };
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    return () => {
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      cancelAnimationFrame(tiltFrame.current);
    };
  }, []);

  const setCursor = (cursor: string) => {
    if (rootRef.current) rootRef.current.style.cursor = cursor;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, x0: e.clientX, rot0: spinTarget.get() };
    setCursor("grabbing");
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.active) {
      spinTarget.set(d.rot0 - (e.clientX - d.x0) * C.dragSensitivity);
      return;
    }
    if (IS_TOUCH || !ready || tiltFrame.current) return;
    const { clientX: x, clientY: y } = e;
    tiltFrame.current = requestAnimationFrame(() => {
      tiltFrame.current = 0;
      const el = rootRef.current;
      if (!el) return;
      const r = (rect.current ??= el.getBoundingClientRect());
      tiltXTarget.set(-(((y - r.top) / r.height) * 2 - 1) * 5);
      tiltYTarget.set(-(((x - r.left) / r.width) * 2 - 1) * 3);
    });
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setCursor("grab");
  };

  const onPointerLeave = () => {
    drag.current.active = false;
    cancelAnimationFrame(tiltFrame.current);
    tiltFrame.current = 0;
    tiltXTarget.set(0);
    tiltYTarget.set(0);
    setCursor(ready ? "grab" : "default");
  };

  const ball = C.ballSize * Math.max(0.2, C.perspective / 1200);

  return (
    <div
      ref={rootRef}
      data-paused={paused || undefined}
      className="c3d relative h-[80vh] w-full touch-none select-none overflow-hidden"
      style={{ cursor: ready ? "grab" : "default", contain: "layout style paint" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <style>{`
        @keyframes c3d-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes c3d-spin { to { transform: rotate(360deg) } }
        .c3d-bob { animation: c3d-bob 2.8s ease-in-out infinite; width: 100%; height: 100%; position: relative; }
        .c3d[data-paused] .c3d-bob, .c3d[data-paused] .c3d-layer { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) {
          .c3d-bob, .c3d-layer { animation: none !important; }
        }
      `}</style>

      {/* Stage at the tuned size, scaled down as one flat image to fit the container. */}
      <div
        className="absolute left-0 top-0"
        style={{
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          perspective: `${C.perspective}px`,
          perspectiveOrigin: "50% 50%",
        }}
      >
        <motion.div style={{ ...LAYER, rotateX: tiltX, rotateY: tiltY }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: ball,
              height: ball,
              marginLeft: -ball / 2,
              marginTop: -ball / 2,
              transformStyle: "preserve-3d",
            }}
          >
            <motion.div style={{ ...LAYER, rotateY: spin }}>
              {CARDS.map((world, i) => (
                <Card
                  key={i}
                  world={world}
                  index={i}
                  angleStep={360 / CARDS.length}
                  radius={radius}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Card = ({
  world,
  index,
  angleStep,
  radius,
}: {
  world: World;
  index: number;
  angleStep: number;
  radius: MotionValue<number>;
}) => {
  // Pivot sits `radius` px in front of the card, so rotateY swings it around the ring's centre.
  const z = useTransform(radius, (r) => -r);

  return (
    <motion.div
      role="img"
      aria-label={world.name}
      style={{
        ...LAYER,
        z,
        rotateY: index * -angleStep,
        originZ: radius,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        overflow: "hidden",
        borderRadius: 999,
        contain: "layout style paint",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: C.entryDelay }}
    >
      <div
        className="c3d-bob"
        style={{
          animationDelay: `${C.entryDelay + 1.2 + index * 0.08}s`,
          animationDuration: `${2.8 + index * 0.08}s`,
        }}
      >
        <Orb world={world} />
      </div>
    </motion.div>
  );
};

const Orb = ({ world }: { world: World }) => (
  <div
    className="absolute overflow-hidden rounded-full"
    style={{ inset: `${((1 - C.orbSize) / 2) * 100}%`, background: world.base }}
  >
    {world.layers.map((layer, i) => (
      <div
        key={i}
        className="c3d-layer absolute inset-0"
        style={{ background: layer.background, animation: layer.spin }}
      />
    ))}
  </div>
);

export default CylinderCarousel;
