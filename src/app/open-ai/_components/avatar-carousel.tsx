"use client";

/**
 * Every avatar on the Cylinder Carousel: the four dots characters, four custom plush
 * characters in the same style, the six DevDay faces and eight custom faces.
 *
 * Ring, fly-in, bob, drag and cursor lean are the registry's cylinder-carousel
 * (registry/new-york/carousel/cylinder-carousel.tsx). With 22 cards instead of 10 the
 * ring grows so neighbouring discs keep the original spacing and size, and the camera
 * stays on the rim.
 *
 * 3D characters are drawn per disc by one shared WebGL renderer (./dots/face-renderer).
 * Flat faces are the DevDay face component with its circle as the disc. Everything
 * hops in a wave from the front as the ring settles, and tapping a disc plays it again.
 *
 * Lives here, not in the registry: the dots models and DevDay faces are openai.com's.
 */

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import type { CharacterName } from "./dots/characters";
import {
  createFaceRenderer,
  dotsCharacter,
  loadCharacterModels,
  type Character,
  type CharacterModels,
  type Face,
  type Look,
} from "./dots/face-renderer";
import { buildPlush, type PlushName } from "./dots/plush-characters";
import { FaceDisc, type PlayFace } from "./face-disc";
import { FACE_ROSTER, type RosterFace } from "./face-roster";

type World = { base: string; motif: string; spin: string };

// Flat, high-contrast discs behind the 3D characters (the carousel's worlds plus four more).
const WORLDS = {
  cobaltGrid: {
    base: "#2d4bff",
    motif:
      "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px",
    spin: "c3d-spin 80s linear infinite reverse",
  },
  tangerineChecks: {
    base: "#ff5f1f",
    motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px",
    spin: "c3d-spin 60s linear infinite",
  },
  amberStripes: {
    base: "#ffb000",
    motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)",
    spin: "c3d-spin 50s linear infinite",
  },
  violetDots: {
    base: "#6b3ce6",
    motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px",
    spin: "c3d-spin 70s linear infinite reverse",
  },
  tealRings: {
    base: "#12b5a5",
    motif: "repeating-radial-gradient(circle at 38% 38%, #5fd6cb 0 12px, transparent 12px 34px)",
    spin: "c3d-spin 24s linear infinite",
  },
  orchidRings: {
    base: "#f6a8f2",
    motif: "repeating-radial-gradient(circle at 62% 38%, #ffd6f9 0 12px, transparent 12px 34px)",
    spin: "c3d-spin 28s linear infinite reverse",
  },
  limeChecks: {
    base: "#c6f432",
    motif: "conic-gradient(at 62.5% 37.5%, #151515 25%, transparent 0) 0 0 / 32px 32px",
    spin: "c3d-spin 60s linear infinite reverse",
  },
  tangerineGrid: {
    base: "#ff5f1f",
    motif:
      "linear-gradient(90deg, #ffb38f 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#ffb38f 2px, transparent 0) 0 0 / 44px 44px",
    spin: "c3d-spin 80s linear infinite",
  },
} satisfies Record<string, World>;

type Item =
  | { kind: "3d"; label: string; world: World; build: (models: CharacterModels) => Character }
  | { kind: "face"; label: string; face: RosterFace };

const dots = (name: CharacterName, world: World): Item => ({
  kind: "3d",
  label: name,
  world,
  build: (models) => dotsCharacter(models[name], name),
});
const plush = (name: PlushName, world: World): Item => ({ kind: "3d", label: name, world, build: () => buildPlush(name) });
const face = (name: string): Item => ({ kind: "face", label: name, face: FACE_ROSTER[name] });

// Ring order. The first item faces the viewer once the ring settles.
const LIST: Item[] = [
  dots("Alfred", WORLDS.cobaltGrid),
  face("thinking"),
  face("love"),
  plush("Mochi", WORLDS.tealRings),
  face("designing"),
  face("money"),
  dots("Felipe", WORLDS.tangerineChecks),
  face("building"),
  face("knocked-out"),
  plush("Pip", WORLDS.orchidRings),
  face("iterating"),
  face("online"),
  dots("Iggy", WORLDS.amberStripes),
  face("testing"),
  face("sleepy"),
  plush("Bolt", WORLDS.limeChecks),
  face("shipping"),
  face("calm"),
  dots("Todd", WORLDS.violetDots),
  face("crying"),
  face("curious"),
  plush("Nimbus", WORLDS.tangerineGrid),
];

const COUNT = LIST.length;
// At spin 180° the card at index COUNT / 2 sits at the far wall, facing the viewer.
const FRONT = Math.round(COUNT / 2);
const CARDS = Array.from({ length: COUNT }, (_, i) => LIST[(i - FRONT + COUNT) % COUNT]);

// The original ring: 10 cards on an 800px radius, camera on the rim.
const ORIGINAL = { cards: 10, radius: 800 };
const RING = (COUNT / ORIGINAL.cards) * ORIGINAL.radius;

const C = {
  radius: RING, // ring radius (px), grown so card spacing matches the original
  perspective: RING, // camera distance (px); puts the viewer on the ring's rim
  ball: (800 * 800) / 1200, // card size (px), the original's ballSize * perspective / 1200
  orbSize: 0.8, // disc diameter as a share of its card, leaving a gap between neighbours
  dragSensitivity: 0.5 * (ORIGINAL.radius / RING), // degrees of spin per px dragged
  flyInSwing: 90 * (ORIGINAL.radius / RING), // degrees the ring swings in from
  entryDelay: 0.3, // s before the fly-in starts
  stageWidth: 1440, // container width the numbers above were tuned at
  facePixels: 640, // backing size of each character canvas
  waveDelay: 0.9, // s after the fly-in starts that the front disc hops
  waveStagger: 0.09, // s between neighbouring hops
  tapSlop: 6, // px a tap may move before it counts as a drag
};

const IS_TOUCH = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
const SPIN_SPRING = IS_TOUCH ? { stiffness: 28, damping: 22 } : { stiffness: 35, damping: 24 };
const SPREAD_SPRING = IS_TOUCH ? { stiffness: 24, damping: 18 } : { stiffness: 30, damping: 20 };
const TILT_SPRING = { stiffness: 50, damping: 18 };

const LAYER: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  transformStyle: "preserve-3d",
};

/** Shortest distance around the ring between two card indices. */
const ringDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % COUNT;
  return Math.min(d, COUNT - d);
};

export function AvatarCarousel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const faces = useRef<(Face | null)[]>([]);
  const plays = useRef<(PlayFace | null)[]>([]);
  const drag = useRef({ active: false, x0: 0, y0: 0, rot0: 0, card: -1 });
  const rect = useRef<DOMRect | null>(null);
  const stageWidth = useRef(C.stageWidth);
  const tiltFrame = useRef(0);
  const look = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const pausedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);

  // Targets are set directly; springs chase them.
  const spinTarget = useMotionValue(180 + C.flyInSwing);
  const spreadTarget = useMotionValue(1.8);
  const tiltXTarget = useMotionValue(0);
  const tiltYTarget = useMotionValue(0);
  const spin = useSpring(spinTarget, SPIN_SPRING);
  const spread = useSpring(spreadTarget, SPREAD_SPRING);
  const tiltX = useSpring(tiltXTarget, TILT_SPRING);
  const tiltY = useSpring(tiltYTarget, TILT_SPRING);
  const radius = useTransform(spread, (s) => s * C.radius);

  // Fly-in: swing the ring in and pull it in from 1.8x radius.
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

  // 3D characters: load, hop everything in a wave from the front, draw the visible discs each frame.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mountedAt = performance.now();
    const hops: ReturnType<typeof setTimeout>[] = [];
    let renderer: ReturnType<typeof createFaceRenderer> | null = null;
    let cancelled = false;
    let frame = 0;
    let last = performance.now();

    loadCharacterModels().then((models) => {
      if (cancelled) return;
      renderer = createFaceRenderer(C.facePixels);
      faces.current = CARDS.map((item) => (item.kind === "3d" ? renderer!.createFace(item.build(models)) : null));
      if (reduce) return;
      const firstHop = Math.max(0, mountedAt + (C.entryDelay + C.waveDelay) * 1000 - performance.now());
      CARDS.forEach((item, i) => {
        const at = firstHop + ringDistance(i, FRONT) * C.waveStagger * 1000;
        hops.push(setTimeout(() => (item.kind === "3d" ? faces.current[i]?.excite() : plays.current[i]?.("hop")), at));
      });
    });

    const step = (2 * Math.PI) / COUNT;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!renderer || pausedRef.current || document.hidden) return;

      const l = look.current;
      const k = 1 - Math.exp(-12 * delta);
      l.x += (l.targetX - l.x) * k;
      l.y += (l.targetY - l.y) * k;
      const eased: Look = { x: l.x, y: l.y };

      // From the rim, a card at ring angle θ from the far wall appears θ/2 off-centre.
      const halfView = Math.atan(stageWidth.current / 2 / C.perspective) + 0.14;
      const ring = (spin.get() * Math.PI) / 180;
      faces.current.forEach((face, i) => {
        const canvas = canvases.current[i];
        if (!face || !canvas) return;
        const angle = Math.atan2(Math.sin(ring - i * step), Math.cos(ring - i * step));
        if (Math.abs(angle) / 2 > halfView) return;
        const ctx = canvas.getContext("2d");
        if (ctx) face.draw(ctx, reduce ? 0 : delta, eased);
      });
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      hops.forEach(clearTimeout);
      faces.current.forEach((face) => face?.dispose());
      faces.current = [];
      renderer?.dispose();
    };
  }, [spin]);

  // Shrink the whole scene uniformly when the container is narrower than the stage.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const k = width / C.stageWidth;
      setScale(Math.min(1, Math.max(0.3, k)));
      stageWidth.current = Math.max(C.stageWidth, width);
      rect.current = null;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pause the bob, disc, face and character loops while off-screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      pausedRef.current = !entry.isIntersecting;
      setPaused(!entry.isIntersecting);
    });
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
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    drag.current = { active: true, x0: e.clientX, y0: e.clientY, rot0: spinTarget.get(), card: card ? Number(card.dataset.card) : -1 };
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
      const nx = ((x - r.left) / r.width) * 2 - 1;
      const ny = ((y - r.top) / r.height) * 2 - 1;
      tiltXTarget.set(-ny * 5);
      tiltYTarget.set(-nx * 3);
      // 3D characters look the same way the scene leans.
      look.current.targetX = nx;
      look.current.targetY = -ny;
    });
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setCursor("grab");
    // A tap, not a drag: play the tapped disc.
    if (d.card < 0 || Math.hypot(e.clientX - d.x0, e.clientY - d.y0) >= C.tapSlop) return;
    if (CARDS[d.card].kind === "3d") faces.current[d.card]?.excite();
    else plays.current[d.card]?.();
  };

  const onPointerLeave = () => {
    drag.current.active = false;
    cancelAnimationFrame(tiltFrame.current);
    tiltFrame.current = 0;
    tiltXTarget.set(0);
    tiltYTarget.set(0);
    look.current.targetX = look.current.targetY = 0;
    setCursor(ready ? "grab" : "default");
  };

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
              width: C.ball,
              height: C.ball,
              marginLeft: -C.ball / 2,
              marginTop: -C.ball / 2,
              transformStyle: "preserve-3d",
            }}
          >
            <motion.div style={{ ...LAYER, rotateY: spin }}>
              {CARDS.map((item, i) => (
                <Card key={i} index={i} label={item.label} angleStep={360 / COUNT} radius={radius}>
                  {item.kind === "3d" ? (
                    <>
                      <Orb world={item.world} />
                      <canvas
                        ref={(canvas) => {
                          canvases.current[i] = canvas;
                        }}
                        width={C.facePixels}
                        height={C.facePixels}
                        className="pointer-events-none absolute inset-0 size-full"
                      />
                    </>
                  ) : (
                    <FaceDisc
                      entry={item.face}
                      diameter={C.ball * C.orbSize}
                      inset={(C.ball * (1 - C.orbSize)) / 2}
                      active={!paused}
                      register={(play) => {
                        plays.current[i] = play;
                      }}
                    />
                  )}
                </Card>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const Card = ({
  index,
  label,
  angleStep,
  radius,
  children,
}: {
  index: number;
  label: string;
  angleStep: number;
  radius: MotionValue<number>;
  children: React.ReactNode;
}) => {
  // Pivot sits `radius` px in front of the card, so rotateY swings it around the ring's centre.
  const z = useTransform(radius, (r) => -r);

  return (
    <motion.div
      role="img"
      aria-label={label}
      data-card={index}
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
        {children}
      </div>
    </motion.div>
  );
};

const Orb = ({ world }: { world: World }) => (
  <div
    className="absolute overflow-hidden rounded-full"
    style={{ inset: `${((1 - C.orbSize) / 2) * 100}%`, background: world.base }}
  >
    <div className="c3d-layer absolute inset-0" style={{ background: world.motif, animation: world.spin }} />
  </div>
);
