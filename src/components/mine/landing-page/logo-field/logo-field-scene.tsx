"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { makeGlassMaterial } from "./glass-material";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Environment, Lightformer, useGLTF } from "@react-three/drei";

const LOGO_GLB = "/model/Untitled-white.glb";
const CAMERA_Z = 10;
const FOV = 35;
const HALF_TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/* ------------------------------------------------------------------ */
/* Placement: logos are laid out in *page* space, down the whole       */
/* document, and scroll with it.                                       */
/* ------------------------------------------------------------------ */

type Seed = {
  /** -0.5 … 0.5 of the visible width at the logo's depth. */
  x: number;
  /** Distance from the top of the document, in viewport heights. */
  yVh: number;
  z: number;
  scale: number;
  rot: [number, number, number];
  spin: [number, number, number];
  bob: number;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One logo roughly every 0.4 viewport heights, alternating sides and kept
 * near the edges so they frame the content instead of covering it.
 * Deterministic, so the layout is the same on every visit.
 */
function makeSeeds(pageVh: number, portrait: boolean): Seed[] {
  const rand = mulberry32(23);
  const r = (a: number, b: number) => a + rand() * (b - a);
  const step = portrait ? 0.5 : 0.38;
  const count = Math.max(1, Math.floor((pageVh - 0.2) / step));
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    // Mostly hugging the edge; every fourth one drifts further in.
    const inset = i % 4 === 3 ? r(0.3, 0.35) : r(0.38, 0.43);
    const x = side * (portrait ? r(0.34, 0.4) : inset);
    const z = r(0, 2.4);
    return {
      x,
      yVh: 0.25 + i * step + r(-0.12, 0.12),
      z,
      scale: (portrait ? r(0.28, 0.38) : r(0.3, 0.48)) * (1 - z * 0.08),
      // Mostly face-on so the mark reads, turned slightly toward the page.
      rot: [r(-0.35, 0.35), -side * r(0.15, 0.5), r(-0.35, 0.35)],
      spin: [r(-0.05, 0.05), r(-0.08, 0.08), r(-0.03, 0.03)],
      bob: r(0, Math.PI * 2),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Logo geometry from the existing GLB                                 */
/* ------------------------------------------------------------------ */

function useLogoGeometry() {
  const { scene } = useGLTF(LOGO_GLB);
  const geometry = useMemo(() => {
    let source: THREE.Mesh | undefined;
    scene.traverse((o) => {
      if (!source && (o as THREE.Mesh).isMesh) source = o as THREE.Mesh;
    });
    if (!source) return new THREE.BufferGeometry();
    // Bake the node's transform (it's exported lying flat), then centre it
    // and scale to a 1.25-unit footprint with a thin, even slab depth.
    source.updateWorldMatrix(true, false);
    const g = source.geometry.clone();
    g.applyMatrix4(source.matrixWorld);
    g.center();
    g.computeBoundingBox();
    const box = g.boundingBox!;
    const k = 1.25 / Math.max(box.max.x - box.min.x, box.max.y - box.min.y);
    g.scale(k, k, k);
    const depth = (box.max.z - box.min.z) * k;
    if (depth > 0) g.scale(1, 1, 0.2 / depth);
    g.computeVertexNormals();
    return g;
  }, [scene]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function Logos({
  theme,
  pageHeight,
  reducedMotion,
  pointer,
}: {
  theme: "light" | "dark";
  pageHeight: number;
  reducedMotion: boolean;
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  const geometry = useLogoGeometry();
  const size = useThree((s) => s.size);
  const portrait = size.width < size.height;
  // Re-layout only when the page grows by a meaningful amount (200px steps).
  const pageBucket = Math.round(pageHeight / 200);
  const seeds = useMemo(
    () => makeSeeds((pageBucket * 200) / Math.max(1, size.height), portrait),
    [pageBucket, size.height, portrait],
  );
  const meshes = useRef<(THREE.Group | null)[]>([]);
  const start = useRef<number | null>(null);

  const glass = useMemo(() => makeGlassMaterial(theme), [theme]);
  useEffect(() => () => glass.dispose(), [glass]);

  // Per-logo hover amount (0…1, eased) and tilt toward the cursor.
  const hover = useRef<{ amt: number; tx: number; ty: number }[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (start.current === null) start.current = t;
    const since = t - start.current;
    const vw = state.size.width;
    const vh = state.size.height;
    const scrollY = window.scrollY;
    const ptr = pointer.current ?? { x: -9, y: -9 };
    // Cursor in px from the viewport's top-left.
    const px = ((ptr.x + 1) / 2) * vw;
    const py = ((1 - ptr.y) / 2) * vh;
    const ease = 1 - Math.exp(-delta * 6);

    seeds.forEach((seed, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const h = (hover.current[i] ??= { amt: 0, tx: 0, ty: 0 });
      const frameH = 2 * (CAMERA_Z - seed.z) * HALF_TAN;
      const worldPerPx = frameH / vh;
      // Anchored to the page: scrolls exactly with the content.
      const screenY = seed.yVh * vh - scrollY;
      const screenX = vw / 2 + seed.x * vw;

      // Skip the work for logos far off screen.
      const visible = screenY > -vh * 0.6 && screenY < vh * 1.6;
      m.visible = visible;
      if (!visible) return;

      // Entrance, once on load; then still.
      const p = reducedMotion
        ? 1
        : easeOutExpo(Math.min(1, Math.max(0, (since - 0.2 - i * 0.05) / 1.4)));

      // Hover: the cursor is within the logo's on-screen footprint.
      const radius = (seed.scale * 1.25 * 0.6) / worldPerPx + 16;
      const dx = (px - screenX) / radius;
      const dy = (py - screenY) / radius;
      const over = !reducedMotion && dx * dx + dy * dy < 1;
      h.amt += ((over ? 1 : 0) - h.amt) * ease;
      // Tilt so the face turns toward the cursor; settles back on leave.
      h.tx += ((over ? dy * 0.7 : 0) - h.tx) * ease;
      h.ty += ((over ? dx * 0.9 : 0) - h.ty) * ease;

      m.position.set(
        seed.x * frameH * (vw / vh),
        (vh / 2 - screenY) * worldPerPx,
        seed.z + h.amt * 0.6,
      );
      m.rotation.set(
        seed.rot[0] + (1 - p) * 1.4 + h.tx,
        seed.rot[1] - (1 - p) * 1.1 + h.ty,
        seed.rot[2],
      );
      m.scale.setScalar(seed.scale * Math.max(0.0001, p) * (1 + h.amt * 0.12));
    });
  });

  return (
    <>
      {seeds.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
        >
          <mesh geometry={geometry} material={glass}>
            {/* Hairline edges: the site's line language, and what makes the
                outline of the mark read over busy content. */}
            <Edges
              threshold={20}
              lineWidth={1}
              color={theme === "dark" ? "#ffffff" : "#000000"}
              transparent
              opacity={theme === "dark" ? 0.28 : 0.14}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

useGLTF.preload(LOGO_GLB);

export function LogoFieldScene({ theme }: { theme: "light" | "dark" }) {
  // Off-screen until the cursor first moves, so nothing starts "hovered".
  const pointer = useRef({ x: -9, y: -9 });
  const [pageHeight, setPageHeight] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(mq.matches);
    const syncHeight = () =>
      setPageHeight(document.documentElement.scrollHeight);
    syncMotion();
    syncHeight();
    mq.addEventListener("change", syncMotion);
    // Sections below load lazily, so the page keeps growing after mount.
    const ro = new ResizeObserver(syncHeight);
    ro.observe(document.body);

    const onPointer = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      mq.removeEventListener("change", syncMotion);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // Portal to <body>: an ancestor in the page layout creates a containing
  // block, which turns `position: fixed` into "scrolls with the hero".
  return createPortal(
    <Canvas
      aria-hidden
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, CAMERA_Z], fov: FOV }}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        // Above the page grid lines (z-50/z-[60]); click-through, so it
        // never blocks the content underneath.
        zIndex: 70,
      }}
    >
      {pageHeight > 0 && (
        <Logos
          theme={theme}
          pageHeight={pageHeight}
          reducedMotion={reducedMotion}
          pointer={pointer}
        />
      )}
      {/* Local light rig for the glass edges; no HDR download. Lifted in
          dark mode, where reflections are all the glass has to show. */}
      <Environment
        resolution={256}
        frames={1}
        environmentIntensity={theme === "dark" ? 3 : 1}
      >
        <Lightformer
          intensity={2.5}
          position={[0, 4, 6]}
          scale={[10, 1.5, 1]}
        />
        <Lightformer
          intensity={1.5}
          position={[-6, 0, 4]}
          rotation-y={Math.PI / 2}
          scale={[8, 2, 1]}
        />
        <Lightformer
          intensity={1.5}
          position={[6, -2, 4]}
          rotation-y={-Math.PI / 2}
          scale={[8, 2, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.2}
          position={[2, 3, 8]}
          scale={3}
        />
      </Environment>
    </Canvas>,
    document.body,
  );
}
