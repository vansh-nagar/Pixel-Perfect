"use client";

import { RoundedBox, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ChevronLeft, ChevronRight, Hand, HandGrab } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type V3 = [number, number, number];

type Level = {
  title: string;
  offset: V3;
  left: string;
  right: string;
  floor: string;
  rug: string;
};

const LEVELS: Level[] = [
  { title: "Basics", offset: [0, 0, 0], left: "#d8cbfa", right: "#ec6fa6", floor: "#f6dbe8", rug: "#63d2cf" },
  { title: "Light", offset: [0, 2, -2], left: "#a9e8dc", right: "#3fb8a8", floor: "#e9f7f3", rug: "#ffb35c" },
  { title: "Physics", offset: [-2, 4, -2], left: "#ffd8b0", right: "#ff8f6b", floor: "#fff1e4", rug: "#7d6bf2" },
  { title: "Shaders", offset: [-2, 6, -4], left: "#b9c4ff", right: "#5b6cf0", floor: "#e8ecff", rug: "#ff7fb0" },
  { title: "Particles", offset: [-4, 8, -4], left: "#ffe6a1", right: "#f5b52e", floor: "#fff7dc", rug: "#6c5ce7" },
  { title: "Portal", offset: [-4, 10, -6], left: "#d3b9ff", right: "#8a54f0", floor: "#efe6ff", rug: "#3fd0c9" },
  { title: "React", offset: [-6, 12, -6], left: "#b5ecff", right: "#3aa8e0", floor: "#e6f8ff", rug: "#ff6f91" },
];

const F = 0.12;

const VIEW = {
  idlePosition: new THREE.Vector3(5.75, 1.725, 5.75),
  lookAt: new THREE.Vector3(0, 0.75, 0),
  positionMin: new THREE.Vector3(-1, 0.2, -1),
  positionMax: new THREE.Vector3(15, 12, 15),
  targetMin: new THREE.Vector3(-0.25, 0.2, -0.75),
  targetMax: new THREE.Vector3(1, 1.5, 1.25),
  phi: { base: Math.PI * 0.35, min: 0.75, max: 1.75 },
  theta: { base: Math.PI * 0.25, min: 0, max: Math.PI * 0.5 },
  distance: { base: 8, min: 5, max: 12 },
  dragMultiplier: -2,
  wheelMultiplier: 0.002,
};

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const pad = (n: number) => String(n + 1).padStart(2, "0");

let glideEase: string | null = null;
function getGlideEase() {
  if (!glideEase) {
    gsap.registerPlugin(CustomEase);
    CustomEase.create("levelGlide", "M0,0 C0.242,0.059 0.492,1.014 1,1.014");
    glideEase = "levelGlide";
  }
  return glideEase;
}

type Eased = { value: number; eased: number };

type Rig = {
  mix: { value: number };
  offset: { target: THREE.Vector3; current: THREE.Vector3 };
  target: { value: THREE.Vector3; eased: THREE.Vector3 };
  phi: Eased;
  theta: Eased;
  distance: Eased;
  idle: THREE.PerspectiveCamera;
  orbit: THREE.PerspectiveCamera;
  spherical: THREE.Spherical;
  quaternion: THREE.Quaternion;
};

function createRig(): Rig {
  const idle = new THREE.PerspectiveCamera();
  idle.position.copy(VIEW.idlePosition);
  idle.lookAt(VIEW.lookAt);
  return {
    mix: { value: 0 },
    offset: { target: new THREE.Vector3(), current: new THREE.Vector3() },
    target: { value: VIEW.lookAt.clone(), eased: VIEW.lookAt.clone() },
    phi: { value: VIEW.phi.base, eased: VIEW.phi.base },
    theta: { value: VIEW.theta.base, eased: VIEW.theta.base },
    distance: { value: VIEW.distance.base, eased: VIEW.distance.base },
    idle,
    orbit: new THREE.PerspectiveCamera(),
    spherical: new THREE.Spherical(),
    quaternion: new THREE.Quaternion(),
  };
}

function stepRig(r: Rig, camera: THREE.Camera, delta: number) {
  const ms = Math.min(delta * 1000, 100);
  const k = (easing: number) => Math.min(1, easing * ms);

  r.offset.current.lerp(r.offset.target, k(0.01));
  r.target.eased.lerp(r.target.value, k(0.01));
  r.distance.eased += (r.distance.value - r.distance.eased) * k(0.02);
  r.phi.eased += (r.phi.value - r.phi.eased) * k(0.01);
  r.theta.eased += (r.theta.value - r.theta.eased) * k(0.01);

  r.spherical.set(r.distance.eased, r.phi.eased, r.theta.eased);
  r.orbit.position.setFromSpherical(r.spherical).add(r.target.eased).clamp(VIEW.positionMin, VIEW.positionMax);
  r.orbit.lookAt(r.target.eased);

  camera.position.copy(r.idle.position).lerp(r.orbit.position, r.mix.value);
  camera.quaternion.copy(r.idle.quaternion).slerp(r.orbit.quaternion, r.mix.value);
  camera.position.add(r.offset.current);
  r.quaternion.copy(camera.quaternion);
}

function CameraRig({ rig }: { rig: React.RefObject<Rig> }) {
  useFrame((state, delta) => stepRig(rig.current, state.camera, delta));
  return null;
}

function Bowl() {
  const geometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    for (let i = 0; i < 15; i++) {
      points.push(new THREE.Vector2(Math.pow(i / 15, 0.3) * 25, Math.max(0, ((i - 1) / 15) * 25)));
    }
    return new THREE.LatheGeometry(points, 96);
  }, []);
  const uniforms = useMemo(
    () => ({ uInner: { value: new THREE.Color("#150b28") }, uOuter: { value: new THREE.Color("#3d2c6a") } }),
    [],
  );
  return (
    <mesh geometry={geometry} receiveShadow>
      <shaderMaterial
        side={THREE.DoubleSide}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vWorld;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uInner;
          uniform vec3 uOuter;
          varying vec3 vWorld;
          float rand(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
          void main() {
            float t = clamp(length(vec4(vWorld, 1.0)) * 0.04 + 0.05, 0.0, 1.0);
            vec3 color = mix(uInner, uOuter, t);
            // Dither so the long gradient doesn't band.
            vec3 d = vec3(0.25, -0.25, 0.25) / 255.0;
            color += mix(d * 2.0, d * -2.0, rand(gl_FragCoord.xy));
            gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  );
}

type GroupProps = ThreeElements["group"];

function Block({
  size,
  color,
  radius = 0.025,
  emissive,
  ...props
}: { size: V3; color: string; radius?: number; emissive?: string } & GroupProps) {
  const r = Math.min(radius, Math.min(...size) / 2 - 0.001);
  return (
    <group {...props}>
      <RoundedBox args={size} radius={Math.max(r, 0.001)} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.75}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.9 : 0}
        />
      </RoundedBox>
    </group>
  );
}

function Ball({ r, color, emissive, ...props }: { r: number; color: string; emissive?: string } & GroupProps) {
  return (
    <group {...props}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[r, 24, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 1.2 : 0}
        />
      </mesh>
    </group>
  );
}

function Cyl({ r, h, color, ...props }: { r: number; h: number; color: string } & GroupProps) {
  return (
    <group {...props}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, 24]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

function FrameCube({ size, bar = 0.022, color, ...props }: { size: number; bar?: number; color: string } & GroupProps) {
  const h = size / 2;
  const bars: { p: V3; s: V3 }[] = [];
  for (const a of [-h, h]) {
    for (const b of [-h, h]) {
      bars.push({ p: [0, a, b], s: [size + bar, bar, bar] });
      bars.push({ p: [a, 0, b], s: [bar, size + bar, bar] });
      bars.push({ p: [a, b, 0], s: [bar, bar, size + bar] });
    }
  }
  return (
    <group {...props}>
      {bars.map((e, i) => (
        <mesh key={i} position={e.p} castShadow>
          <boxGeometry args={e.s} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

const UV_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

function ShaderPlane({ size, fragment, ...props }: { size: [number, number]; fragment: string } & GroupProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });
  return (
    <group {...props}>
      <mesh>
        <planeGeometry args={size} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={UV_VERTEX} fragmentShader={fragment} />
      </mesh>
    </group>
  );
}

const PLASMA = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 6.0;
    float v = sin(p.x + uTime) + sin(p.y * 1.3 - uTime * 1.2) + sin((p.x + p.y) * 0.7 + uTime * 0.8);
    vec3 a = vec3(0.36, 0.42, 0.94);
    vec3 b = vec3(1.0, 0.5, 0.72);
    vec3 color = mix(a, b, 0.5 + 0.5 * sin(v * 1.6));
    gl_FragColor = vec4(color, 1.0);
  }`;

const SWIRL = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * vec2(0.64, 1.0);
    float r = length(p);
    float a = atan(p.y, p.x);
    float s = sin(a * 3.0 + r * 18.0 - uTime * 2.5);
    vec3 color = mix(vec3(0.55, 0.33, 0.94), vec3(1.0, 0.95, 1.0), smoothstep(0.2, 1.0, s) * (1.0 - r * 1.4));
    gl_FragColor = vec4(color, 1.0);
  }`;

function BasicsProps() {
  const balls: { p: V3; c: string }[] = [];
  const colors = ["#ff6fa8", "#7d6bf2", "#ffb35c"];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      balls.push({ p: [-0.74 + (i - 1) * 0.085, F + 1.27, -0.45 + (j - 1) * 0.085], c: colors[(i + j) % 3] });
    }
  }
  return (
    <>
      <Block size={[0.28, 0.04, 1.1]} color="#f4ecff" position={[-0.74, F + 0.75, -0.15]} />
      <Block size={[0.28, 0.04, 1.1]} color="#f4ecff" position={[-0.74, F + 1.2, -0.15]} />
      <FrameCube size={0.2} color="#ef6fa6" position={[-0.74, F + 0.89, -0.45]} />
      <mesh position={[-0.74, F + 0.89, 0.05]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.15, 0.24, 4]} />
        <meshStandardMaterial color="#45c7b8" roughness={0.6} />
      </mesh>
      {balls.map((b, i) => (
        <Ball key={i} r={0.04} color={b.c} position={b.p} />
      ))}

      <Block size={[0.75, 0.04, 0.42]} color="#fdf7ff" position={[0.25, F + 0.5, -0.66]} />
      {[-0.33, 0.33].flatMap((x) =>
        [-0.17, 0.17].map((z) => (
          <Block key={`${x}${z}`} size={[0.035, 0.48, 0.035]} color="#e6dcf7" position={[0.25 + x, F + 0.24, -0.66 + z]} />
        )),
      )}
      <Block size={[0.04, 0.14, 0.04]} color="#d9cff0" position={[0.25, F + 0.59, -0.8]} />
      <Block size={[0.42, 0.27, 0.03]} color="#4b3d8f" position={[0.25, F + 0.8, -0.8]} />
      <Block size={[0.38, 0.23, 0.005]} color="#9f8cff" emissive="#9f8cff" position={[0.25, F + 0.8, -0.783]} />
      <Block size={[0.3, 0.015, 0.09]} color="#cfc4ea" position={[0.25, F + 0.53, -0.56]} />
      <Cyl r={0.025} h={0.28} color="#d9cff0" position={[0.3, F + 0.14, -0.22]} />
      <Block size={[0.3, 0.05, 0.3]} color="#ff8a5c" position={[0.3, F + 0.3, -0.22]} />
      <Block size={[0.3, 0.32, 0.05]} color="#ff8a5c" position={[0.3, F + 0.48, -0.07]} />

      <Cyl r={0.1} h={0.16} color="#f5b52e" position={[-0.55, F + 0.08, -0.66]} />
      <mesh position={[-0.55, F + 0.42, -0.66]} castShadow>
        <capsuleGeometry args={[0.07, 0.35, 6, 16]} />
        <meshStandardMaterial color="#5fd0b8" roughness={0.7} />
      </mesh>
      <mesh position={[-0.46, F + 0.5, -0.66]} rotation={[0, 0, -0.35]} castShadow>
        <capsuleGeometry args={[0.04, 0.12, 6, 12]} />
        <meshStandardMaterial color="#5fd0b8" roughness={0.7} />
      </mesh>

      <group position={[0.35, F, 0.45]} rotation={[0, 0.4, 0]}>
        <Block size={[0.5, 0.025, 0.15]} color="#8f7bff" position={[0, 0.06, 0]} />
        {[-0.17, 0.17].flatMap((x) =>
          [-0.06, 0.06].map((z) => (
            <Cyl key={`${x}${z}`} r={0.025} h={0.025} color="#ff8a5c" position={[x, 0.025, z]} rotation={[Math.PI / 2, 0, 0]} />
          )),
        )}
      </group>
    </>
  );
}

function Orbs() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      child.position.y = F + 0.95 + i * 0.12 + Math.sin(clock.elapsedTime * 1.5 + i * 2) * 0.06;
    });
  });
  const orbs: { x: number; z: number; c: string }[] = [
    { x: -0.3, z: 0.1, c: "#ffe08a" },
    { x: 0.1, z: -0.25, c: "#ff8fb8" },
    { x: 0.35, z: 0.25, c: "#9be3d6" },
  ];
  return (
    <group ref={group}>
      {orbs.map((o, i) => (
        <Ball key={i} r={0.07} color={o.c} emissive={o.c} position={[o.x, F + 1, o.z]} />
      ))}
    </group>
  );
}

function LightProps() {
  return (
    <>
      <Block size={[0.9, 0.18, 0.36]} color="#ffb35c" position={[-0.1, F + 0.12, -0.7]} />
      <Block size={[0.9, 0.32, 0.12]} color="#ffb35c" position={[-0.1, F + 0.3, -0.86]} />
      <Block size={[0.12, 0.28, 0.36]} color="#f59f3d" position={[-0.6, F + 0.17, -0.7]} />
      <Block size={[0.12, 0.28, 0.36]} color="#f59f3d" position={[0.4, F + 0.17, -0.7]} />

      <Cyl r={0.12} h={0.03} color="#2f7f75" position={[0.62, F + 0.015, -0.62]} />
      <Cyl r={0.015} h={1} color="#2f7f75" position={[0.62, F + 0.5, -0.62]} />
      <mesh position={[0.62, F + 1.02, -0.62]}>
        <cylinderGeometry args={[0.08, 0.18, 0.18, 24, 1, true]} />
        <meshStandardMaterial color="#fff0c2" emissive="#fff0c2" emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0.62, F + 0.9, -0.62]} color="#ffd9a0" intensity={2} distance={2.5} decay={2} />

      <Orbs />
    </>
  );
}

function BouncingBall() {
  const ball = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ball.current) return;
    const s = Math.abs(Math.sin(clock.elapsedTime * 3));
    ball.current.position.y = F + 0.1 + s * 0.55;
    const squash = s < 0.12 ? 1 - (0.12 - s) * 2 : 1 + s * 0.06;
    ball.current.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
  });
  return (
    <group ref={ball} position={[0.2, F + 0.1, 0.25]}>
      <Ball r={0.1} color="#7d6bf2" position={[0, 0, 0]} />
    </group>
  );
}

function PhysicsProps() {
  return (
    <>
      <Block size={[0.9, 0.04, 0.4]} color="#fff8f0" position={[-0.35, F + 0.24, -0.55]} rotation={[0, 0, 0.42]} />
      <Block size={[0.06, 0.55, 0.36]} color="#ffcf9e" position={[-0.72, F + 0.27, -0.55]} />
      <Block size={[0.26, 0.26, 0.26]} color="#ff8f6b" position={[0.55, F + 0.13, -0.6]} />
      <Block size={[0.26, 0.26, 0.26]} color="#ffb35c" position={[0.55, F + 0.39, -0.6]} rotation={[0, 0.3, 0]} />
      <Block size={[0.26, 0.26, 0.26]} color="#ffcf9e" position={[0.25, F + 0.13, -0.66]} rotation={[0, -0.2, 0]} />
      <BouncingBall />
    </>
  );
}

function ShadersProps() {
  return (
    <>
      <Block size={[0.04, 0.8, 1.2]} color="#2b2160" position={[-0.87, F + 0.95, -0.15]} />
      <ShaderPlane size={[1.1, 0.7]} fragment={PLASMA} position={[-0.848, F + 0.95, -0.15]} rotation={[0, Math.PI / 2, 0]} />
      <Block size={[0.5, 0.04, 0.3]} color="#f4f6ff" position={[0.35, F + 0.42, -0.7]} />
      <Block size={[0.04, 0.42, 0.26]} color="#c9d0ff" position={[0.13, F + 0.21, -0.7]} />
      <Block size={[0.04, 0.42, 0.26]} color="#c9d0ff" position={[0.57, F + 0.21, -0.7]} />
      <Cyl r={0.12} h={0.04} color="#ff7fb0" position={[0.2, F + 0.3, -0.25]} />
      <Cyl r={0.02} h={0.28} color="#c9d0ff" position={[0.2, F + 0.14, -0.25]} />
    </>
  );
}

function ParticlesProps() {
  return (
    <>
      <Sparkles count={40} scale={[1.6, 1.4, 1.6]} position={[0.05, F + 0.85, 0.05]} size={3} speed={0.4} color="#ffffff" />
      <mesh position={[0.3, F + 0.17, -0.4]} scale={[1, 0.58, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 32, 20]} />
        <meshStandardMaterial color="#6c5ce7" roughness={0.85} />
      </mesh>
      <Cyl r={0.09} h={0.18} color="#fffaf0" position={[-0.6, F + 0.09, -0.6]} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.6, F + 0.38, -0.6]} rotation={[0.35, (i * Math.PI * 2) / 3, 0]} castShadow>
          <coneGeometry args={[0.06, 0.4, 8]} />
          <meshStandardMaterial color="#3fae7a" roughness={0.7} />
        </mesh>
      ))}
    </>
  );
}

function PortalProps() {
  return (
    <>
      <Block size={[0.9, 0.04, 0.32]} color="#d8cdf5" position={[0, F + 0.02, -0.32]} />
      <Block size={[0.16, 0.92, 0.18]} color="#d8cdf5" position={[-0.35, F + 0.46, -0.55]} />
      <Block size={[0.16, 0.92, 0.18]} color="#d8cdf5" position={[0.35, F + 0.46, -0.55]} />
      <Block size={[0.88, 0.14, 0.22]} color="#c4b5f0" position={[0, F + 0.98, -0.55]} />
      <ShaderPlane size={[0.54, 0.84]} fragment={SWIRL} position={[0, F + 0.46, -0.55]} />
      <pointLight position={[0, F + 0.5, -0.3]} color="#b48cff" intensity={1.5} distance={1.6} decay={2} />
      <Block size={[0.1, 0.14, 0.1]} color="#ffe08a" emissive="#ffe08a" position={[-0.6, F + 0.07, 0.35]} />
      <Block size={[0.1, 0.14, 0.1]} color="#ffe08a" emissive="#ffe08a" position={[0.6, F + 0.07, 0.35]} />
    </>
  );
}

function Atom() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.6;
  });
  return (
    <group ref={group} position={[0, F + 0.85, -0.2]}>
      <Ball r={0.07} color="#3aa8e0" emissive="#61c8f0" position={[0, 0, 0]} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2 + 0.2, 0, (i * Math.PI) / 3]}>
          <torusGeometry args={[0.32, 0.013, 8, 64]} />
          <meshStandardMaterial color="#3aa8e0" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function ReactProps() {
  return (
    <>
      <Cyl r={0.2} h={0.3} color="#f4fcff" position={[0, F + 0.15, -0.2]} />
      <Atom />
      <mesh position={[0.5, F + 0.15, 0.3]} scale={[1, 0.55, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.26, 32, 20]} />
        <meshStandardMaterial color="#ff6f91" roughness={0.85} />
      </mesh>
    </>
  );
}

const ROOM_PROPS = [BasicsProps, LightProps, PhysicsProps, ShadersProps, ParticlesProps, PortalProps, ReactProps];

function useLabelTexture(index: number, title: string) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.textBaseline = "top";
    ctx.font = "800 250px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(pad(index), 20, 0);
    ctx.font = "700 76px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(title, 30, 250);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [index, title]);
}

function Room({
  level,
  index,
  reachable,
  reducedMotion,
  onSelect,
  onHover,
}: {
  level: Level;
  index: number;
  reachable: boolean;
  reducedMotion: boolean;
  onSelect: (index: number) => void;
  onHover: (hovered: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const label = useLabelTexture(index, level.title);
  const Contents = ROOM_PROPS[index];

  useEffect(() => {
    const g = group.current;
    if (!g || reducedMotion) return;
    const from = -level.offset[1] - 2;
    g.position.y = from;
    const tween = gsap.to(g.position, { y: 0, duration: Math.abs(from) * 0.5, ease: "power4.out" });
    return () => {
      tween.kill();
    };
  }, [level.offset, reducedMotion]);

  return (
    <group position={level.offset}>
      <group ref={group}>
        <Block size={[2, F, 2]} color={level.floor} radius={0.03} position={[0, F / 2, 0]} />
        <Block size={[0.12, 1.7, 2]} color={level.left} position={[-0.94, F + 0.85, 0]} />
        <Block size={[2, 1.7, 0.12]} color={level.right} position={[0, F + 0.85, -0.94]} />
        <mesh position={[0.3, F + 1.25, -0.879]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial map={label} transparent toneMapped={false} />
        </mesh>
        <Block size={[1.1, 0.015, 1.1]} color={level.rug} radius={0.005} position={[0.15, F + 0.008, 0.2]} />
        <Contents />
      </group>

      <mesh
        position={[0, 1, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta < 15 && reachable) onSelect(index);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(reachable);
        }}
        onPointerOut={() => onHover(false)}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

const NAV_SHADOW = "0 30px 70px #3c00bd22";

export default function LevelStack() {
  const rig = useRef<Rig>(createRig());
  const container = useRef<HTMLDivElement>(null);
  const mixTween = useRef<gsap.core.Tween | null>(null);
  const interactingRef = useRef(false);
  const levelRef = useRef(0);

  const [interacting, setInteracting] = useState(false);
  const [level, setLevel] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hoverReachable, setHoverReachable] = useState(false);
  const reducedMotion = useReducedMotion();

  const start = () => {
    if (interactingRef.current) return;
    interactingRef.current = true;
    setInteracting(true);
    mixTween.current?.kill();
    mixTween.current = gsap.to(rig.current.mix, { value: 1, duration: 1, delay: 0.3, ease: "power4.inOut" });
  };

  const end = () => {
    if (!interactingRef.current) return;
    interactingRef.current = false;
    setInteracting(false);
    mixTween.current?.kill();
    mixTween.current = gsap.to(rig.current.mix, { value: 0, duration: 1, ease: "power3.inOut" });
  };

  const goTo = (index: number) => {
    if (index === levelRef.current || index < 0 || index >= LEVELS.length) return;
    const [x, y, z] = LEVELS[index].offset;
    gsap.to(rig.current.offset.target, { x, y, z, duration: 1, ease: getGlideEase(), overwrite: true });
    levelRef.current = index;
    setLevel(index);
  };

  const handlers = useRef({ start, end, goTo });
  useEffect(() => {
    handlers.current = { start, end, goTo };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { end, goTo } = handlers.current;
      if (e.code === "Escape") end();
      if (!interactingRef.current) return;
      if (e.code === "ArrowLeft") goTo(levelRef.current - 1);
      if (e.code === "ArrowRight") goTo(levelRef.current + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!interactingRef.current) return;
      e.preventDefault();
      const pixelY = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const d = rig.current.distance;
      d.value = clamp(d.value + pixelY * VIEW.wheelMultiplier, VIEW.distance.min, VIEW.distance.max);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName !== "CANVAS") return;
    start();
    setDragging(true);
    const mode = e.button === 0 && !e.shiftKey ? "rotation" : "position";
    const norm = () => Math.max(window.innerWidth, window.innerHeight);
    let prevX = e.clientX / norm();
    let prevY = e.clientY / norm();

    const onMove = (ev: PointerEvent) => {
      const n = norm();
      const dx = ev.clientX / n - prevX;
      const dy = ev.clientY / n - prevY;
      prevX = ev.clientX / n;
      prevY = ev.clientY / n;
      const r = rig.current;
      if (mode === "rotation") {
        r.theta.value = clamp(r.theta.value + dx * VIEW.dragMultiplier, VIEW.theta.min, VIEW.theta.max);
        r.phi.value = clamp(r.phi.value + dy * VIEW.dragMultiplier, VIEW.phi.min, VIEW.phi.max);
      } else {
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(r.quaternion).setLength(dx * VIEW.dragMultiplier);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(r.quaternion).setLength(-dy * VIEW.dragMultiplier);
        r.target.value.add(right).add(up).clamp(VIEW.targetMin, VIEW.targetMax);
      }
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const cursor = dragging ? "grabbing" : hoverReachable ? "pointer" : "grab";
  const hasPrevious = level > 0;
  const hasNext = level < LEVELS.length - 1;

  return (
    <div
      ref={container}
      className="relative h-full w-full touch-none overflow-hidden bg-[#2a1d4e] select-none"
      onPointerDown={onPointerDown}
      style={{ cursor }}
    >
      <style>{`
        @keyframes level-stack-hand {
          5% { transform: translateX(0); }
          10% { transform: translateX(5px); }
          20% { transform: translateX(-5px); }
          30% { transform: translateX(5px); }
          40% { transform: translateX(-5px); }
          45% { transform: translateX(0); }
        }
        @keyframes level-stack-grab {
          0%, 4.9% { opacity: 0; }
          5%, 45% { opacity: 1; }
          45.1%, 100% { opacity: 0; }
        }
        @keyframes level-stack-open {
          0%, 4.9% { opacity: 1; }
          5%, 45% { opacity: 0; }
          45.1%, 100% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .level-stack-hand, .level-stack-hand * { animation: none !important; }
        }
      `}</style>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 25, near: 0.5, far: 60, position: VIEW.idlePosition.toArray() }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
        }}
      >
        <CameraRig rig={rig} />
        <hemisphereLight args={["#ffffff", "#5b3fa0", 1.3]} />
        <directionalLight
          position={[5, 20, 7]}
          intensity={1.8}
          color="#fff4f8"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-camera-near={1}
          shadow-camera-far={50}
        />
        <Bowl />
        {LEVELS.map((l, i) => (
          <Room
            key={l.title}
            level={l}
            index={i}
            reachable={i !== level}
            reducedMotion={reducedMotion}
            onSelect={goTo}
            onHover={setHoverReachable}
          />
        ))}
      </Canvas>

      <div
        aria-hidden
        className="level-stack-hand pointer-events-none absolute bottom-[45px] left-[calc(50%-77px)] z-[3] flex h-[52px] w-[154px] items-center justify-center rounded-[29px] bg-white text-[#202020]"
        style={{
          boxShadow: NAV_SHADOW,
          opacity: interacting ? 0 : 1,
          transform: `translateY(${interacting ? 105 : 0}px)`,
          transition: "opacity 0.5s, transform 0.5s",
          transitionDelay: interacting ? "0s" : "1s",
        }}
      >
        <ChevronLeft size={16} strokeWidth={3} />
        <div className="relative mx-[17px] size-[30px]" style={{ animation: "level-stack-hand 2s infinite" }}>
          <Hand className="absolute inset-0 m-auto" size={26} style={{ animation: "level-stack-open 2s infinite" }} />
          <HandGrab className="absolute inset-0 m-auto" size={26} style={{ animation: "level-stack-grab 2s infinite" }} />
        </div>
        <ChevronRight size={16} strokeWidth={3} />
      </div>

      <div
        className="absolute bottom-[45px] left-[calc(50%-131px)] z-[3] h-[58px] w-[262px] cursor-default rounded-[29px] bg-white"
        style={{
          boxShadow: NAV_SHADOW,
          opacity: interacting ? 1 : 0,
          transform: `translateY(${interacting ? 0 : 105}px)`,
          transition: "opacity 0.5s, transform 0.5s",
          transitionDelay: interacting ? "1s" : "0s",
          pointerEvents: interacting ? "auto" : "none",
        }}
      >
        <button
          type="button"
          aria-label="Previous level"
          disabled={!hasPrevious}
          onClick={() => goTo(level - 1)}
          className="absolute top-0 left-0 flex h-full w-[60px] items-center justify-center pl-[3px] text-[#705df2] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-[#705df2] after:opacity-10 enabled:cursor-pointer"
        >
          <ChevronLeft size={16} strokeWidth={3} className="transition-opacity duration-200" style={{ opacity: hasPrevious ? 1 : 0.2 }} />
        </button>
        <div className="absolute inset-y-0 right-[60px] left-[60px] flex justify-center text-[18px] leading-[58px] text-[#202020] opacity-90">
          Level&nbsp;
          <span className="relative inline-block tabular-nums" aria-live="polite">
            <span className="invisible">00</span>
            {LEVELS.map((_, i) => (
              <span
                key={i}
                aria-hidden={i !== level}
                className="absolute inset-0"
                style={{
                  transform: `translateY(${i < level ? 10 : i > level ? -10 : 0}px)`,
                  opacity: i === level ? 1 : 0,
                  transition: "transform 0.5s, opacity 0.5s",
                  transitionDelay: i === level ? "0.2s" : "0s",
                }}
              >
                {pad(i)}
              </span>
            ))}
          </span>
        </div>
        <button
          type="button"
          aria-label="Next level"
          disabled={!hasNext}
          onClick={() => goTo(level + 1)}
          className="absolute top-0 right-0 flex h-full w-[60px] items-center justify-center pr-[3px] text-[#705df2] after:absolute after:top-0 after:left-0 after:h-full after:w-px after:bg-[#705df2] after:opacity-10 enabled:cursor-pointer"
        >
          <ChevronRight size={16} strokeWidth={3} className="transition-opacity duration-200" style={{ opacity: hasNext ? 1 : 0.2 }} />
        </button>
      </div>

      <button
        type="button"
        aria-label="Close"
        onClick={end}
        className="group absolute top-1/2 left-10 z-[3] block transition-transform duration-[450ms] ease-[cubic-bezier(0.75,0,0.25,1)] hover:rotate-180"
        style={{ pointerEvents: interacting ? "auto" : "none" }}
      >
        <span
          className="absolute -top-[30px] -left-[30px] block size-[60px] rounded-full bg-white"
          style={{
            boxShadow: "0 30px 70px #3c00bd21",
            transform: `scale(${interacting ? 1 : 0.0001})`,
            transition: "transform 0.5s",
            transitionDelay: interacting ? "0.95s" : "0.1s",
            transitionTimingFunction: interacting ? "cubic-bezier(0.59, 1.97, 0.55, 0.83)" : "ease",
          }}
        />
        <span
          className="absolute top-0 left-0 block"
          style={{
            transform: `scale(${interacting ? 1 : 0.0001})`,
            transition: "transform 0.5s",
            transitionDelay: interacting ? "1s" : "0s",
            transitionTimingFunction: interacting ? "cubic-bezier(0.59, 1.97, 0.55, 0.83)" : "ease",
          }}
        >
          <span className="absolute -top-px -left-[9px] block h-[3px] w-[19px] -rotate-45 rounded-[2px] bg-[#705df2]" />
          <span className="absolute -top-px -left-[9px] block h-[3px] w-[19px] rotate-45 rounded-[2px] bg-[#705df2]" />
        </span>
      </button>
    </div>
  );
}
