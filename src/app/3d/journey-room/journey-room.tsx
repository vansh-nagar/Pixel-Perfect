"use client";

/**
 * Level 1 ("Basics") of the threejs-journey.com hero, rebuilt 1:1 from its shipped code and
 * original baked models.
 *
 * LOCAL STUDY COPY. The .glb/.webp/.jpg assets are Bruno Simon's and live in the gitignored
 * `public/_study/` folder. Never commit them or promote this into the registry.
 *
 * How the original works:
 *  - Lighting is baked in Blender into one texture (baked.webp). Every mesh shares a single
 *    MeshBasicMaterial with that map, so there are no real-time lights or shadows at all.
 *  - Small props (cube, pyramid, dog ears) use matcap materials; screens/lamps use plain white.
 *  - The cube hops every 1.5s, the pyramid tumbles at random, the camera head and dog head
 *    look around at random targets, the dog tilts its head, and the cactus sways in the
 *    vertex shader.
 *  - The camera blends between a low idle view and a drag-to-orbit view (`mix`).
 */

import { useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { Hand, HandGrab } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

const BASE = "/_study/threejs-journey";
const DRACO = "/_study/draco/";

const MODELS = {
  baked: `${BASE}/level1/baked.glb`,
  cameraHead: `${BASE}/level1/cameraHead.glb`,
  sudoHead: `${BASE}/level1/sudoHead.glb`,
  dog: `${BASE}/level1/sudo.glb`,
  cactus: `${BASE}/level1/cactus.glb`,
  cube: `${BASE}/level1/cube.glb`,
  pyramid: `${BASE}/level1/pyramid.glb`,
  emissives: `${BASE}/level1/emissives.glb`,
};

const TEXTURES = {
  baked: `${BASE}/level1/baked.webp`,
  pinkOnBeige: `${BASE}/matcaps/pinkOnBeige.jpg`,
  cyanOnBeige: `${BASE}/matcaps/cyanOnBeige.jpg`,
  whiteOnPurple: `${BASE}/matcaps/whiteOnPurple.jpg`,
};

const VIEW = {
  idlePosition: new THREE.Vector3(5.75, 1.725, 5.75),
  lookAt: new THREE.Vector3(0, 0.75, 0),
  positionMin: new THREE.Vector3(-1, 0.2, -1),
  positionMax: new THREE.Vector3(15, 12, 15),
  phi: { base: Math.PI * 0.35, min: 0.75, max: 1.75 },
  theta: { base: Math.PI * 0.25, min: 0, max: Math.PI * 0.5 },
  distance: { base: 8, min: 5, max: 12 },
};

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

type Looker = {
  model: THREE.Object3D;
  target: THREE.Vector3;
  eased: THREE.Vector3;
};

type Room = {
  group: THREE.Group;
  cameraHead: Looker;
  sudoHead: Looker & { tilt: THREE.Object3D };
  cube: { model: THREE.Object3D; mesh: THREE.Object3D; baseY: number; rx: number; ry: number };
  pyramid: THREE.Object3D;
  cactusTime: { value: number };
};

type Assets = { gltf: Record<keyof typeof MODELS, GLTF>; tex: Record<keyof typeof TEXTURES, THREE.Texture> };

function buildRoom({ gltf, tex }: Assets): Room {
  tex.baked.flipY = false;
  tex.baked.colorSpace = THREE.SRGBColorSpace;
  tex.baked.anisotropy = 4;
  for (const t of [tex.pinkOnBeige, tex.cyanOnBeige, tex.whiteOnPurple]) t.colorSpace = THREE.SRGBColorSpace;

  const bakedMaterial = new THREE.MeshBasicMaterial({ map: tex.baked });
  const applyBaked = (o: THREE.Object3D) =>
    o.traverse((n) => {
      if (n instanceof THREE.Mesh) n.material = bakedMaterial;
    });

  const scenes = Object.fromEntries(
    Object.entries(gltf).map(([key, g]) => [key, g.scene.clone(true)]),
  ) as Record<keyof typeof MODELS, THREE.Group>;

  const group = new THREE.Group();

  const baked = scenes.baked;
  applyBaked(baked);
  group.add(baked);

  const cameraHeadModel = scenes.cameraHead.children[0];
  cameraHeadModel.position.y -= 0.01;
  applyBaked(cameraHeadModel);
  group.add(cameraHeadModel);

  const dog = scenes.dog;
  applyBaked(dog);
  group.add(dog);

  const sudoHeadModel = scenes.sudoHead.children[0];
  sudoHeadModel.rotation.order = "YXZ";
  sudoHeadModel.position.y -= 0.01;
  applyBaked(sudoHeadModel);
  const earsInside = sudoHeadModel.getObjectByName("earsInside");
  if (earsInside instanceof THREE.Mesh) earsInside.material = new THREE.MeshMatcapMaterial({ matcap: tex.pinkOnBeige });
  const earsOutside = sudoHeadModel.getObjectByName("earsOutside");
  if (earsOutside instanceof THREE.Mesh) earsOutside.material = new THREE.MeshMatcapMaterial({ matcap: tex.whiteOnPurple });
  group.add(sudoHeadModel);

  const cactusTime = { value: 0 };
  const cactusModel = scenes.cactus.children[0];
  applyBaked(cactusModel);
  const cactusMaterial = new THREE.MeshBasicMaterial({ map: tex.baked });
  cactusMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = cactusTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `#include <begin_vertex>
        float swayAngle = -sin(uTime * 0.002 + transformed.z * 3.0) * log(abs(transformed.z) + 1.0) * 0.25;
        float swayS = sin(swayAngle);
        float swayC = cos(swayAngle);
        transformed.xz = mat2(swayC, swayS, -swayS, swayC) * transformed.xz;`,
      );
  };
  (cactusModel.children[0] as THREE.Mesh).material = cactusMaterial;
  group.add(cactusModel);

  const cubeModel = scenes.cube.children[0];
  const cubeMesh = cubeModel.children[0] as THREE.Mesh;
  cubeMesh.material = new THREE.MeshMatcapMaterial({ matcap: tex.pinkOnBeige });
  group.add(cubeModel);

  const pyramidModel = scenes.pyramid.children[0];
  (pyramidModel.children[0] as THREE.Mesh).material = new THREE.MeshMatcapMaterial({ matcap: tex.cyanOnBeige });
  group.add(pyramidModel);

  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  scenes.emissives.traverse((n) => {
    if (n instanceof THREE.Mesh) n.material = white;
  });
  group.add(scenes.emissives);

  return {
    group,
    cameraHead: { model: cameraHeadModel, target: new THREE.Vector3(), eased: new THREE.Vector3() },
    sudoHead: {
      model: sudoHeadModel,
      tilt: sudoHeadModel.children[0],
      target: new THREE.Vector3(),
      eased: new THREE.Vector3(),
    },
    cube: { model: cubeModel, mesh: cubeMesh, baseY: cubeModel.position.y, rx: 0, ry: 0 },
    pyramid: pyramidModel,
    cactusTime,
  };
}

function startRoomLoops(room: Room, reducedMotion: boolean) {
  const { group, cameraHead, sudoHead, cube, pyramid } = room;

  if (!reducedMotion) {
    group.position.y = -2;
    gsap.to(group.position, { y: 0, duration: 1, ease: "power4.out" });
  }

  const cameraHeadLook = () => {
    gsap.killTweensOf(cameraHead.target);
    gsap.to(cameraHead.target, { duration: 0.3, x: Math.random() * 2, y: Math.random() * 1.5, z: (Math.random() - 0.5) * 1 });
    gsap.delayedCall(1 + Math.random() * 5, cameraHeadLook);
  };

  const sudoLook = () => {
    gsap.killTweensOf(sudoHead.target);
    gsap.to(sudoHead.target, { duration: 0.3, x: 0.6 + Math.random() * 0.4, y: 0.25 + Math.random() * 0.25, z: 0 });
    gsap.delayedCall(1 + Math.random() * 2, sudoLook);
  };

  const sudoTilt = () => {
    gsap.to(sudoHead.tilt.rotation, {
      duration: 1,
      ease: "power3.inOut",
      z: Math.random() < 0.5 ? 0 : (Math.random() - 0.5) * Math.PI * 0.35,
    });
    gsap.delayedCall(0.5 + Math.random() * 2, sudoTilt);
  };

  const cubeJump = () => {
    cube.rx += Math.ceil(Math.random() * 3);
    cube.ry += Math.ceil(Math.random() * 3);
    gsap.to(cube.model.position, {
      duration: 0.5,
      ease: "power4.out",
      y: cube.baseY + 0.2,
      onComplete: () => {
        gsap.to(cube.model.position, { duration: 0.5, ease: "power2.in", y: cube.baseY });
      },
    });
    gsap.to(cube.mesh.rotation, { duration: 1, x: cube.rx * Math.PI * 0.5, y: cube.ry * Math.PI * 0.5 });
    gsap.delayedCall(1.5, cubeJump);
  };

  const pyramidX = () => {
    gsap.to(pyramid.rotation, { duration: 1, ease: "power3.inOut", x: (Math.random() - 0.5) * Math.PI * 3 });
    gsap.delayedCall(0.5 + Math.random() * 2, pyramidX);
  };
  const pyramidZ = () => {
    gsap.to(pyramid.rotation, { duration: 1, ease: "power3.inOut", z: (Math.random() - 0.5) * Math.PI * 3 });
    gsap.delayedCall(0.5 + Math.random() * 2, pyramidZ);
  };

  const loops = [cameraHeadLook, sudoLook];
  if (!reducedMotion) loops.push(sudoTilt, cubeJump, pyramidX, pyramidZ);
  loops.forEach((fn) => fn());

  return () => {
    loops.forEach((fn) => gsap.killTweensOf(fn));
    gsap.killTweensOf([
      group.position,
      cameraHead.target,
      sudoHead.target,
      sudoHead.tilt.rotation,
      cube.model.position,
      cube.mesh.rotation,
    ]);
    gsap.killTweensOf(pyramid.rotation);
  };
}

function stepRoom(room: Room, deltaMs: number, elapsedMs: number) {
  const { cameraHead, sudoHead } = room;
  cameraHead.eased.lerp(cameraHead.target, Math.min(1, 0.005 * deltaMs));
  cameraHead.model.lookAt(cameraHead.eased);

  sudoHead.eased.lerp(sudoHead.target, Math.min(1, 0.005 * deltaMs));
  sudoHead.model.lookAt(sudoHead.eased);
  sudoHead.model.rotation.x = Math.min(sudoHead.model.rotation.x, -0.05);

  room.cactusTime.value = elapsedMs;
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

function Level1({ reducedMotion }: { reducedMotion: boolean }) {
  const baked = useGLTF(MODELS.baked, DRACO);
  const cameraHead = useGLTF(MODELS.cameraHead, DRACO);
  const sudoHead = useGLTF(MODELS.sudoHead, DRACO);
  const dog = useGLTF(MODELS.dog, DRACO);
  const cactus = useGLTF(MODELS.cactus, DRACO);
  const cube = useGLTF(MODELS.cube, DRACO);
  const pyramid = useGLTF(MODELS.pyramid, DRACO);
  const emissives = useGLTF(MODELS.emissives, DRACO);
  const textures = useTexture(TEXTURES);

  const room = useMemo(
    () =>
      buildRoom({
        gltf: { baked, cameraHead, sudoHead, dog, cactus, cube, pyramid, emissives },
        tex: textures,
      }),
    [baked, cameraHead, sudoHead, dog, cactus, cube, pyramid, emissives, textures],
  );

  useEffect(() => startRoomLoops(room, reducedMotion), [room, reducedMotion]);
  useFrame((state, delta) => stepRoom(room, Math.min(delta * 1000, 100), state.clock.elapsedTime * 1000));

  return <primitive object={room.group} />;
}

type Eased = { value: number; eased: number };
type Rig = {
  mix: { value: number };
  phi: Eased;
  theta: Eased;
  distance: Eased;
  idle: THREE.PerspectiveCamera;
  orbit: THREE.PerspectiveCamera;
  spherical: THREE.Spherical;
};

function createRig(): Rig {
  const idle = new THREE.PerspectiveCamera();
  idle.position.copy(VIEW.idlePosition);
  idle.lookAt(VIEW.lookAt);
  return {
    mix: { value: 0 },
    phi: { value: VIEW.phi.base, eased: VIEW.phi.base },
    theta: { value: VIEW.theta.base, eased: VIEW.theta.base },
    distance: { value: VIEW.distance.base, eased: VIEW.distance.base },
    idle,
    orbit: new THREE.PerspectiveCamera(),
    spherical: new THREE.Spherical(),
  };
}

function stepRig(r: Rig, camera: THREE.Camera, delta: number) {
  const ms = Math.min(delta * 1000, 100);
  r.distance.eased += (r.distance.value - r.distance.eased) * Math.min(1, 0.02 * ms);
  r.phi.eased += (r.phi.value - r.phi.eased) * Math.min(1, 0.01 * ms);
  r.theta.eased += (r.theta.value - r.theta.eased) * Math.min(1, 0.01 * ms);

  r.spherical.set(r.distance.eased, r.phi.eased, r.theta.eased);
  r.orbit.position.setFromSpherical(r.spherical).add(VIEW.lookAt).clamp(VIEW.positionMin, VIEW.positionMax);
  r.orbit.lookAt(VIEW.lookAt);

  camera.position.copy(r.idle.position).lerp(r.orbit.position, r.mix.value);
  camera.quaternion.copy(r.idle.quaternion).slerp(r.orbit.quaternion, r.mix.value);
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
    <mesh geometry={geometry}>
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
            vec3 d = vec3(0.25, -0.25, 0.25) / 255.0;
            color += mix(d * 2.0, d * -2.0, rand(gl_FragCoord.xy));
            gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  );
}

export default function JourneyRoom() {
  const rig = useRef<Rig>(createRig());
  const container = useRef<HTMLDivElement>(null);
  const mixTween = useRef<gsap.core.Tween | null>(null);
  const interactingRef = useRef(false);
  const [interacting, setInteracting] = useState(false);
  const [dragging, setDragging] = useState(false);
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

  const endRef = useRef(end);
  useEffect(() => {
    endRef.current = end;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") endRef.current();
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
      d.value = clamp(d.value + pixelY * 0.002, VIEW.distance.min, VIEW.distance.max);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName !== "CANVAS") return;
    start();
    setDragging(true);
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
      r.theta.value = clamp(r.theta.value - dx * 2, VIEW.theta.min, VIEW.theta.max);
      r.phi.value = clamp(r.phi.value - dy * 2, VIEW.phi.min, VIEW.phi.max);
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={container}
      className="relative h-full w-full touch-none overflow-hidden bg-[#2a1d4e] select-none"
      onPointerDown={onPointerDown}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      <style>{`
        @keyframes journey-hand {
          5% { transform: translateX(0); }
          10% { transform: translateX(5px); }
          20% { transform: translateX(-5px); }
          30% { transform: translateX(5px); }
          40% { transform: translateX(-5px); }
          45% { transform: translateX(0); }
        }
        @keyframes journey-grab {
          0%, 4.9% { opacity: 0; }
          5%, 45% { opacity: 1; }
          45.1%, 100% { opacity: 0; }
        }
        @keyframes journey-open {
          0%, 4.9% { opacity: 1; }
          5%, 45% { opacity: 0; }
          45.1%, 100% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .journey-hand, .journey-hand * { animation: none !important; }
        }
      `}</style>

      <Canvas flat dpr={[1, 2]} camera={{ fov: 25, near: 1, far: 50, position: VIEW.idlePosition.toArray() }}>
        <CameraRig rig={rig} />
        <Bowl />
        <Suspense fallback={null}>
          <Level1 reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>

      <div
        aria-hidden
        className="journey-hand pointer-events-none absolute bottom-[45px] left-[calc(50%-77px)] z-[3] flex h-[52px] w-[154px] items-center justify-center rounded-[29px] bg-white text-[#202020]"
        style={{
          boxShadow: "0 30px 70px #3c00bd22",
          opacity: interacting ? 0 : 1,
          transform: `translateY(${interacting ? 105 : 0}px)`,
          transition: "opacity 0.5s, transform 0.5s",
          transitionDelay: interacting ? "0s" : "1s",
        }}
      >
        <svg width="11" height="7" viewBox="0 0 11 7" className="rotate-90" fill="currentColor">
          <path d="M5.5 7a1.5 1.5 0 0 1-1.06-.44l-4-4A1.5 1.5 0 1 1 2.56.44L5.5 3.38 8.44.44a1.5 1.5 0 1 1 2.12 2.12l-4 4A1.5 1.5 0 0 1 5.5 7Z" />
        </svg>
        <div className="relative mx-[17px] size-[30px]" style={{ animation: "journey-hand 2s infinite" }}>
          <Hand className="absolute inset-0 m-auto" size={26} style={{ animation: "journey-open 2s infinite" }} />
          <HandGrab className="absolute inset-0 m-auto" size={26} style={{ animation: "journey-grab 2s infinite" }} />
        </div>
        <svg width="11" height="7" viewBox="0 0 11 7" className="-rotate-90" fill="currentColor">
          <path d="M5.5 7a1.5 1.5 0 0 1-1.06-.44l-4-4A1.5 1.5 0 1 1 2.56.44L5.5 3.38 8.44.44a1.5 1.5 0 1 1 2.12 2.12l-4 4A1.5 1.5 0 0 1 5.5 7Z" />
        </svg>
      </div>

      <button
        type="button"
        aria-label="Close"
        onClick={end}
        className="absolute top-1/2 left-10 z-[3] block transition-transform duration-[450ms] ease-[cubic-bezier(0.75,0,0.25,1)] hover:rotate-180"
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
