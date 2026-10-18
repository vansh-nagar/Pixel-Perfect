"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const bump = (x: number, a: number, b: number, c: number, d: number) => smooth(a, b, x) * (1 - smooth(c, d, x));
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function write<T>(ref: React.RefObject<T>, value: T) {
  ref.current = value;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x, y);
    x *= 2.03;
    y *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

const PALETTE = { sky: "#cdd1dc", snow: "#e6e8ef", stone: "#9ea3b0", glow: "#f4f7ff" };

function terrainHeight(x: number, z: number) {
  const d = Math.hypot(x, z);
  const drifts = (fbm(x * 0.11, z * 0.11, 6) - 0.5) * 3.2;
  const ridges = Math.pow(fbm(x * 0.04 + 11, z * 0.04 - 7, 6), 1.6) * 26 * smooth(9, 30, d);
  const mound = 0.55 * (1 - smooth(1.5, 6, d));
  return drifts * smooth(2.5, 8, d) + ridges + mound;
}

function Terrain({ progress }: { progress: React.RefObject<number> }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(110, 110, 260, 260).rotateX(-Math.PI / 2);
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) p.setY(i, terrainHeight(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (material.current) material.current.opacity = smooth(0.1, 0.3, progress.current);
  });
  return (
    <mesh geometry={geometry} position={[0, -0.02, 0]}>
      <meshStandardMaterial ref={material} color={PALETTE.snow} roughness={1} transparent />
    </mesh>
  );
}

type Brick = {
  home: THREE.Vector3;
  angle: number;
  course: number;
  width: number;
  scatter: THREE.Vector3;
  spin: THREE.Euler;
  delay: number;
};

const COURSES = 8;
const BRICK = { height: 0.4, depth: 0.42, gap: 0.05 };
const TOWER_HEIGHT = COURSES * BRICK.height;
const radiusAt = (course: number) => THREE.MathUtils.lerp(1.9, 1.05, course / (COURSES - 1));

function makeBricks(): Brick[] {
  const random = seeded(7);
  const bricks: Brick[] = [];
  for (let c = 0; c < COURSES; c++) {
    const r = radiusAt(c);
    const count = Math.max(8, Math.round((2 * Math.PI * r) / 0.78));
    const step = (2 * Math.PI) / count;
    const offset = c % 2 ? step / 2 : 0;
    for (let k = 0; k < count; k++) {
      const angle = offset + k * step;
      if (c < 3 && Math.abs(Math.atan2(Math.sin(angle - Math.PI / 2), Math.cos(angle - Math.PI / 2))) < 0.36) continue;
      const home = new THREE.Vector3(r * Math.cos(angle), BRICK.height * (c + 0.5), r * Math.sin(angle));
      const out = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      bricks.push({
        home,
        angle,
        course: c,
        width: r * step - BRICK.gap,
        scatter: out.multiplyScalar(4 + 5 * random()).add(new THREE.Vector3(0, 7 + 6 * random(), 0)),
        spin: new THREE.Euler((random() - 0.5) * 4, (random() - 0.5) * 4, (random() - 0.5) * 4),
        delay: random(),
      });
    }
  }
  return bricks;
}

function Tower({ progress }: { progress: React.RefObject<number> }) {
  const bricks = useMemo(() => makeBricks(), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const wire = useRef<THREE.LineSegments>(null);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const crystal = useRef<THREE.Mesh>(null);
  const crystalLight = useRef<THREE.PointLight>(null);

  const box = useMemo(() => new RoundedBoxGeometry(1, BRICK.height - BRICK.gap, BRICK.depth, 3, 0.06), []);
  const ghost = useMemo(() => {
    const edges = new THREE.EdgesGeometry(box);
    const parts: number[] = [];
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const p = edges.getAttribute("position");
    for (const b of bricks) {
      m.compose(b.home, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -b.angle + Math.PI / 2, 0)), new THREE.Vector3(b.width, 1, 1));
      for (let i = 0; i < p.count; i++) parts.push(...v.fromBufferAttribute(p, i).applyMatrix4(m).toArray());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(parts, 3));
    return g;
  }, [box, bricks]);

  useEffect(() => {
    const random = seeded(3);
    const color = new THREE.Color();
    bricks.forEach((b, i) => {
      color.setHSL(0.62, 0.08, 0.5 + 0.12 * random() + 0.035 * b.course);
      mesh.current!.setColorAt(i, color);
    });
    mesh.current!.instanceColor!.needsUpdate = true;
  }, [bricks]);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const euler = useMemo(() => new THREE.Euler(), []);

  useFrame((state) => {
    const t = progress.current;
    const breath = bump(t, 0.45, 0.6, 0.66, 0.78);
    bricks.forEach((b, i) => {
      const start = 0.12 + (b.course / COURSES) * 0.2 + b.delay * 0.05;
      const land = clamp01((t - start) / 0.12);
      const eased = easeOutBack(land);
      position.lerpVectors(b.scatter.clone().add(b.home), b.home, Math.min(1, eased));
      if (eased > 1) position.y -= (eased - 1) * 0.3;
      position.x += Math.cos(b.angle) * breath * 0.38;
      position.z += Math.sin(b.angle) * breath * 0.38;
      position.y += breath * b.course * 0.07;
      euler.set(b.spin.x * (1 - land), -b.angle + Math.PI / 2 + b.spin.y * (1 - land), b.spin.z * (1 - land));
      quaternion.setFromEuler(euler);
      scale.set(b.width, 1, 1).multiplyScalar(smooth(0, 0.25, land) * 0.9 + 0.1 * (land > 0 ? 1 : 0));
      matrix.compose(position, quaternion, scale);
      mesh.current!.setMatrixAt(i, matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;

    const blueprint = 1 - smooth(0.1, 0.22, t);
    (wire.current!.material as THREE.LineBasicMaterial).opacity = 0.9 * blueprint;
    const walls = smooth(0.3, 0.42, t);
    const glow = walls * (1.1 + 2.8 * breath);
    core.current!.color.set(PALETTE.glow).multiplyScalar(glow);
    core.current!.visible = walls > 0.01;
    const time = state.clock.elapsedTime;
    crystal.current!.rotation.y = time * 0.5;
    crystal.current!.position.y = TOWER_HEIGHT + 0.75 + Math.sin(time * 1.3) * 0.08 + breath * 0.6;
    crystal.current!.scale.setScalar(smooth(0.3, 0.45, t));
    crystalLight.current!.intensity = 4 + 10 * breath;
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[box, undefined, bricks.length]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <mesh position={[0, TOWER_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[1.0, 1.65, TOWER_HEIGHT * 0.98, 32, 1, true]} />
        <meshBasicMaterial ref={core} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <lineSegments ref={wire} geometry={ghost}>
        <lineBasicMaterial color="#ffffff" transparent toneMapped={false} />
      </lineSegments>
      <mesh ref={crystal}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#eef2ff" emissive="#dfe7ff" emissiveIntensity={0.8} roughness={0.15} flatShading />
      </mesh>
      <pointLight ref={crystalLight} position={[0, TOWER_HEIGHT + 0.6, 0]} color="#dfe7ff" distance={9} />
    </group>
  );
}

function Constellation({ progress }: { progress: React.RefObject<number> }) {
  const geometry = useMemo(() => {
    const random = seeded(21);
    const points = Array.from({ length: 180 }, () => new THREE.Vector3((random() - 0.5) * 26, random() * 12 - 2, (random() - 0.5) * 20));
    const segments: number[] = [];
    for (const a of points) {
      const nearest = points
        .filter((b) => b !== a)
        .sort((b, c) => a.distanceToSquared(b) - a.distanceToSquared(c))
        .slice(0, 2);
      for (const b of nearest) segments.push(...a.toArray(), ...b.toArray());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
    return g;
  }, []);
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.LineBasicMaterial>(null);
  useFrame((state) => {
    const t = progress.current;
    material.current!.opacity = 0.55 * (1 - smooth(0.06, 0.2, t));
    group.current!.rotation.y = state.clock.elapsedTime * 0.02;
    group.current!.visible = material.current!.opacity > 0.001;
  });
  return (
    <group ref={group}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial ref={material} color="#ffffff" transparent toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function Rig({ progress, target }: { progress: React.RefObject<number>; target: React.RefObject<number> }) {
  const look = useMemo(() => new THREE.Vector3(), []);
  const sky = useMemo(() => new THREE.Color(), []);
  const blueprintSky = useMemo(() => new THREE.Color("#8f97a8"), []);
  const fieldSky = useMemo(() => new THREE.Color(PALETTE.sky), []);
  const parallax = useRef({ x: 0, y: 0 });

  useFrame(({ camera, scene, pointer }, delta) => {
    write(progress, THREE.MathUtils.damp(progress.current, target.current, 3.2, delta));
    const t = progress.current;
    parallax.current.x = THREE.MathUtils.damp(parallax.current.x, pointer.x, 2.5, delta);
    parallax.current.y = THREE.MathUtils.damp(parallax.current.y, pointer.y, 2.5, delta);

    const orbit = THREE.MathUtils.lerp(-0.25, 1.15, smooth(0, 1, t)) + parallax.current.x * 0.06;
    const distance = 11.5 + 5 * bump(t, 0.1, 0.35, 0.55, 0.85) - 1.2 * smooth(0.8, 1, t);
    const height = 2.6 + 3.2 * bump(t, 0.15, 0.4, 0.5, 0.8) + parallax.current.y * 0.4;
    camera.position.set(Math.sin(orbit) * distance, height, Math.cos(orbit) * distance);
    look.set(0, TOWER_HEIGHT * 0.45 + 0.6 * bump(t, 0.4, 0.55, 0.65, 0.8), 0);
    camera.lookAt(look);

    sky.copy(blueprintSky).lerp(fieldSky, smooth(0.08, 0.3, t));
    (scene.background as THREE.Color).copy(sky);
    (scene.fog as THREE.Fog).color.copy(sky);
  });
  return null;
}

function Scene({ target }: { target: React.RefObject<number> }) {
  const progress = useRef(0);
  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      <fog attach="fog" args={[PALETTE.sky, 18, 85]} />
      <hemisphereLight args={["#eef1f8", "#6f7686", 0.9]} />
      <directionalLight position={[-9, 5, 3]} intensity={2.4} color="#ffffff" />
      <Rig progress={progress} target={target} />
      <Terrain progress={progress} />
      <Tower progress={progress} />
      <Constellation progress={progress} />
      <Sparkles count={420} scale={[34, 12, 34]} position={[0, 5, 0]} size={2.2} speed={0.35} opacity={0.8} color="#ffffff" />
    </>
  );
}

const CHAPTERS = [
  { at: 0, title: "Blueprint", body: "Every structure starts as a drawing of light." },
  { at: 0.25, title: "Assembly", body: "Stone by stone, from the ground up." },
  { at: 0.55, title: "Breath", body: "Open it up and let the light out." },
  { at: 0.82, title: "Rest", body: "Then close it, and keep the fire going." },
];

export default function CairnScene() {
  const section = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const chapter = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = section.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const t = clamp01(-rect.top / (rect.height - window.innerHeight));
      target.current = t;
      if (bar.current) bar.current.style.transform = `scaleX(${t})`;
      const index = CHAPTERS.findLastIndex((c) => t >= c.at);
      if (chapter.current && chapter.current.dataset.index !== String(index)) {
        chapter.current.dataset.index = String(index);
        const c = CHAPTERS[index];
        chapter.current.animate(
          [
            { opacity: 0, transform: "translateY(10px)", filter: "blur(6px)" },
            { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
          ],
          { duration: 600, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
        chapter.current.querySelector("h2")!.textContent = c.title;
        chapter.current.querySelector("p")!.textContent = c.body;
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={section} className="relative h-[500vh] bg-[#cdd1dc]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas camera={{ fov: 38, near: 0.1, far: 200, position: [0, 3, 10] }} dpr={[1, 2]} gl={{ antialias: true }}>
          <Scene target={target} />
        </Canvas>

        <div className="pointer-events-none absolute inset-0 p-6 font-mono text-[11px] leading-snug text-white md:p-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight">CAIRN</div>
              <div className="mt-1 opacity-80">{"// field station 07"}</div>
            </div>
            <div className="max-w-[200px] text-right opacity-90">
              <div className="mb-1 opacity-70">{"////// notes"}</div>
              A tower of stacked stone on the ice, built to hold one small light through the long night.
            </div>
          </div>
          <div ref={chapter} data-index="-1" className="absolute bottom-16 left-6 md:bottom-20 md:left-10">
            <h2 className="text-lg font-bold uppercase tracking-widest" />
            <p className="mt-1 max-w-[260px] opacity-80" />
          </div>
          <div className="absolute right-6 bottom-6 left-6 flex items-center gap-4 md:right-10 md:bottom-10 md:left-10">
            <span className="opacity-80">scroll</span>
            <div className="h-px flex-1 bg-white/30">
              <div ref={bar} className="h-px origin-left scale-x-0 bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
