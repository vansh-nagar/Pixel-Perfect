"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { makeGlassMaterial } from "../logo-field/glass-material";
import {
  PIXEL_WORDMARK_PATH,
  PIXEL_WORDMARK_VIEWBOX,
} from "../pixel-wordmark-path";

/** World width of the wordmark; the camera is fitted to it. */
const WIDTH = 7.5;
const FOV = 30;

type Letter = { geometry: THREE.ExtrudeGeometry; center: THREE.Vector3 };

/**
 * One extruded piece per letter (each closed outline in the path, so the
 * dot of the "i" is its own piece), each centred on its own origin so it
 * can tilt and pop around its own middle.
 */
function useLetters() {
  const letters = useMemo<Letter[]>(() => {
    // three's SVG parser misreads exponent numbers like "2.93255e-05" (the
    // first coordinate of the "P"), which silently drops that letter.
    // They're all ~0, so round them away.
    const d = PIXEL_WORDMARK_PATH.replace(/-?\d*\.?\d+e[-+]?\d+/gi, "0");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
    const { paths } = new SVGLoader().parse(svg);
    const shapes = paths.flatMap((p) => SVGLoader.createShapes(p));
    // SVG is y-down; flip and scale to WIDTH world units, centred overall.
    const k = WIDTH / PIXEL_WORDMARK_VIEWBOX.width;
    const offset = new THREE.Vector3(
      -PIXEL_WORDMARK_VIEWBOX.width / 2,
      -PIXEL_WORDMARK_VIEWBOX.height / 2,
      0,
    );
    return shapes.map((shape) => {
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: 1.2, // in viewBox units, where one pixel is ~1.1
        bevelEnabled: false,
      });
      g.translate(offset.x, offset.y, -0.6);
      g.scale(k, -k, k);
      g.computeBoundingBox();
      const center = g.boundingBox!.getCenter(new THREE.Vector3());
      g.translate(-center.x, -center.y, -center.z);
      g.computeVertexNormals();
      return { geometry: g, center };
    });
  }, []);
  useEffect(
    () => () => letters.forEach((l) => l.geometry.dispose()),
    [letters],
  );
  return letters;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function Wordmark({
  theme,
  pointer,
  hovered,
  inView,
  reducedMotion,
}: {
  theme: "light" | "dark";
  pointer: React.RefObject<{ x: number; y: number }>;
  hovered: React.RefObject<boolean>;
  inView: React.RefObject<boolean>;
  reducedMotion: React.RefObject<boolean>;
}) {
  const letters = useLetters();
  const material = useMemo(() => makeGlassMaterial(theme), [theme]);
  useEffect(() => () => material.dispose(), [material]);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const react = useRef<{ amt: number; rx: number; ry: number }[]>([]);
  const enteredAt = useRef<number | null>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  // Fit whichever of width/height is tighter, with ~20% room for a hovered
  // letter popping forward and growing, so nothing ever leaves the box.
  const HEIGHT =
    (WIDTH * PIXEL_WORDMARK_VIEWBOX.height) / PIXEL_WORDMARK_VIEWBOX.width;
  const camZ = Math.max(
    (WIDTH * 1.2) / (2 * halfTan * aspect),
    (HEIGHT * 1.6) / (2 * halfTan),
  );

  useEffect(() => {
    camera.position.set(0, 0, camZ);
    camera.lookAt(0, 0, 0);
  }, [camera, camZ]);

  useFrame((state, delta) => {
    // Entrance, once, the first time it scrolls into view: letters tip up
    // one after another, left to right.
    if (enteredAt.current === null && inView.current) {
      enteredAt.current = state.clock.elapsedTime;
    }
    const since =
      enteredAt.current === null
        ? -1
        : state.clock.elapsedTime - enteredAt.current;

    // Cursor on the wordmark's plane, in world units.
    const halfW = camZ * halfTan * aspect;
    const halfH = camZ * halfTan;
    const ptr = pointer.current ?? { x: 0, y: 0 };
    const cx = ptr.x * halfW;
    const cy = -ptr.y * halfH;
    const on = hovered.current && !reducedMotion.current;
    const ease = 1 - Math.exp(-delta * 8);

    letters.forEach((letter, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const r = (react.current[i] ??= { amt: 0, rx: 0, ry: 0 });
      const p = reducedMotion.current
        ? 1
        : since < 0
          ? 0
          : easeOutExpo(Math.max(0, since - i * 0.05) / 1.2);

      // Each letter reacts on its own: full strength under the cursor,
      // fading out over about one letter's width to its neighbours.
      const dx = cx - letter.center.x;
      const dy = cy - letter.center.y;
      const dist = Math.hypot(dx, dy * 0.8);
      const target = on ? Math.max(0, 1 - dist / 0.75) : 0;
      r.amt += (target - r.amt) * ease;
      // Turn the face toward the cursor while it's close.
      r.rx += ((on ? -dy * 1.2 : 0) * r.amt - r.rx) * ease;
      r.ry += ((on ? dx * 1.2 : 0) * r.amt - r.ry) * ease;

      m.position.set(
        letter.center.x,
        letter.center.y - (1 - p) * 0.3,
        letter.center.z + r.amt * 0.5,
      );
      m.rotation.set(-(1 - p) * 1.3 + r.rx, r.ry, 0);
      m.scale.setScalar(1 + r.amt * 0.12);
    });
  });

  return (
    <>
      {letters.map((letter, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={letter.geometry}
          material={material}
          position={letter.center}
        >
          <Edges
            threshold={20}
            lineWidth={1}
            color={theme === "dark" ? "#ffffff" : "#000000"}
            transparent
            opacity={theme === "dark" ? 0.28 : 0.14}
          />
        </mesh>
      ))}
    </>
  );
}

export function Wordmark3DScene({ theme }: { theme: "light" | "dark" }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const hovered = useRef(false);
  const inView = useRef(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) inView.current = true;
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pointer relative to the wordmark (-1…1), only while it's hovered.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  };

  return (
    <div
      ref={wrapper}
      className="w-full aspect-[75/14]"
      aria-hidden
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
      onPointerMove={onPointerMove}
    >
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        camera={{ fov: FOV, position: [0, 0, 20] }}
        gl={{ antialias: true, alpha: true }}
      >
        <Wordmark
          theme={theme}
          pointer={pointer}
          hovered={hovered}
          inView={inView}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
