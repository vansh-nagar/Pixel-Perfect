"use client";

/**
 * The dots hero stage, ported from openai.com/index/introducing-dots.
 *
 * - One orthographic R3F canvas holds the logo "O" plus all four characters; only the
 *   revealed one is visible.
 * - Swapping characters is a spring-driven spin: the current one turns away and shrinks
 *   to 0.9, the next one is swapped in once the spin passes -110°, then it overshoots
 *   to 1.025 and settles at 1.
 * - The newly revealed character plays its "excite" hop (Todd: a look-around).
 * - The pointer steers head tilt and eye offset with an exponential follow.
 * - Characters render into a 4x MSAA half-float target and resolve with ACES tone
 *   mapping plus the site's saturation grade. The logo renders straight to screen.
 *
 * Not ported: the N8AO ambient-occlusion pass (faint contact shading under the
 * glasses and bow tie) and the web worker that pre-bakes the fur off the main thread.
 */
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { spring } from "motion";
import { createContext, Suspense, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import {
  buildCharacter,
  buildLogo,
  CHARACTER_NAMES,
  COLOR_GRADE,
  sampleToddReveal,
  SELECTABLE_CHARACTER_NAMES,
  TODD_REVEAL_SECONDS,
  type SelectableName,
  type StageCharacter,
} from "./characters";
import { applyFur } from "./fur";

export const MODEL_URLS: Record<(typeof CHARACTER_NAMES)[number], string> = {
  Alfred: "/open-ai/dots/alfred.glb",
  Felipe: "/open-ai/dots/felipe.glb",
  Iggy: "/open-ai/dots/iggy.glb",
  Todd: "/open-ai/dots/todd.glb",
};

RectAreaLightUniformsLib.init();

// ---------------------------------------------------------------------------
// Selection renderer: warm every character once (compiles shaders), then draw.
// ---------------------------------------------------------------------------

type SelectionTarget = { root: THREE.Object3D; postprocessing: boolean } | null;
type SelectionRenderer = { targets: SelectionTarget[]; postprocessing: boolean; prepared: boolean; warmed: number };

const createSelectionRenderer = (): SelectionRenderer => ({ targets: [], postprocessing: false, prepared: false, warmed: 0 });

function drawSelectionFrame(selection: SelectionRenderer, draw: (postprocessing: boolean) => void) {
  const targets = selection.targets;
  if (!targets.length || !targets.every((t) => t != null)) return false;
  if (selection.warmed < targets.length) {
    const current = targets[selection.warmed]!;
    const visibility = targets.map((t) => t!.root.visible);
    try {
      targets.forEach((t) => (t!.root.visible = t!.root === current.root));
      draw(current.postprocessing);
      selection.warmed += 1;
    } finally {
      targets.forEach((t, i) => (t!.root.visible = visibility[i]));
    }
    return false;
  }
  draw(selection.postprocessing);
  selection.prepared = true;
  return true;
}

type ViewContextValue = { element: HTMLElement | null; visible: boolean; selection: MutableRefObject<SelectionRenderer> };
const ViewContext = createContext<ViewContextValue | null>(null);

// ---------------------------------------------------------------------------
// Transparent MSAA resolve (tone map + colour grade after multisampling)
// ---------------------------------------------------------------------------

function createResolver(gl: THREE.WebGLRenderer, samples: number) {
  const count = Math.min(samples, gl.capabilities.maxSamples);
  if (count < 2 || !gl.extensions.has("EXT_color_buffer_float")) return null;
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: count,
    depthBuffer: true,
    stencilBuffer: false,
    resolveDepthBuffer: false,
    resolveStencilBuffer: false,
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const material = new THREE.ShaderMaterial({
    name: "DotsTransparentResolve",
    uniforms: {
      artwork: { value: target.texture },
      premultiplyOutput: { value: gl.getContext().getContextAttributes()?.premultipliedAlpha ?? true },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = position.xy * 0.5 + 0.5;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D artwork;
      uniform bool premultiplyOutput;
      varying vec2 vUv;
      void main() {
        vec4 sampleColor = texture2D(artwork, vUv);
        float coverage = clamp(sampleColor.a, 0.0, 1.0);
        // MSAA averages solid geometry with transparent black. Unassociate
        // coverage before the nonlinear transforms to avoid edge halos.
        vec3 straightColor = coverage > 0.00001 ? sampleColor.rgb / coverage : vec3(0.0);
        gl_FragColor = vec4(straightColor, coverage);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        ${COLOR_GRADE}
        if (premultiplyOutput) gl_FragColor.rgb *= coverage;
      }
    `,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: true,
  });
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCamera = new THREE.Camera();
  const size = new THREE.Vector2();
  return {
    render(scene: THREE.Scene, camera: THREE.Camera) {
      gl.getDrawingBufferSize(size);
      if (target.width !== size.x || target.height !== size.y) target.setSize(size.x, size.y);
      gl.setRenderTarget(target);
      gl.render(scene, camera);
      gl.setRenderTarget(null);
      gl.render(quadScene, quadCamera);
    },
    dispose() {
      target.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

function Renderer({ active, samples, onReady, children }: { active: boolean; samples: number; onReady: () => void; children: ReactNode }) {
  const { gl, scene, camera, invalidate } = useThree();
  const view = useContext(ViewContext)!;
  const ready = useRef(false);
  const resolver = useMemo(() => (active && samples > 0 ? createResolver(gl, samples) : null), [active, gl, samples]);
  useEffect(() => () => resolver?.dispose(), [resolver]);
  useEffect(() => {
    if (active) invalidate();
  }, [active, resolver, invalidate]);
  useFrame(() => {
    if (!active || document.hidden) return;
    const drawn = drawSelectionFrame(view.selection.current, (postprocessing) => {
      if (postprocessing && resolver) resolver.render(scene, camera);
      else {
        gl.setRenderTarget(null);
        gl.render(scene, camera);
      }
    });
    if (!drawn) invalidate();
    else if (!ready.current) {
      ready.current = true;
      onReady();
    }
  }, 1);
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const lookTarget = new THREE.Vector3();
const lookMatrix = new THREE.Matrix4();
const aimAtOrigin = (light: THREE.Object3D) => light.quaternion.setFromRotationMatrix(lookMatrix.lookAt(light.position, lookTarget, light.up));

function Lights() {
  const target = useMemo(() => new THREE.Object3D(), []);
  const viewport = useThree((s) => s.viewport);
  const a = Math.max(1, viewport.width / 12.8, viewport.height / 8);
  return (
    <group>
      <ambientLight intensity={1.8} />
      <hemisphereLight args={["#ffffff", "#d8e3f0", 0.35]} />
      <primitive object={target} />
      <directionalLight target={target} position={[-5, 7, 6]} intensity={1.85} />
      <rectAreaLight position={[-6 * a, 7 * a, a]} width={5 * a} height={6 * a} intensity={0.2} onUpdate={aimAtOrigin} />
      <rectAreaLight position={[5 * a, a, -2 * a]} width={4 * a} height={7 * a} intensity={1.3} onUpdate={aimAtOrigin} />
      <rectAreaLight position={[0, -5 * a, -a]} width={5 * a} height={3 * a} intensity={1} onUpdate={aimAtOrigin} />
    </group>
  );
}

function Fur({ scene }: { scene: THREE.Object3D }) {
  useLayoutEffect(() => applyFur(scene), [scene]);
  return null;
}

/** The reveal threshold: the incoming character swaps in once the spin passes -110°. */
const SWAP_YAW = (-110 * Math.PI) / 180;
const smoothRange = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const spin = (from = 0, to = -Math.PI, velocity = 0) =>
  spring({ keyframes: [from, to], velocity, stiffness: 330, damping: 43, mass: 1.5, restDelta: 0.001, restSpeed: 0.005 });

type Transition = {
  from: SelectableName;
  to: SelectableName;
  revealed: SelectableName;
  yaw: number;
  scale: number;
  startYaw: number;
  startScale: number;
  angularVelocity: number;
  elapsed: number;
  active: boolean;
  generator: ReturnType<typeof spin>;
};

function stepTransition(e: Transition, selected: SelectableName, delta: number, animate: boolean) {
  if (!animate) {
    e.from = e.to = e.revealed = selected;
    e.yaw = e.angularVelocity = 0;
    e.scale = 1;
    e.active = false;
    return false;
  }
  const starting = !e.active && e.to !== selected;
  if (e.to !== selected) {
    if (e.active && e.from !== e.to && e.revealed === e.from && selected !== e.from) e.to = selected;
    else {
      e.from = e.revealed;
      e.to = selected;
      e.startYaw = e.yaw;
      e.startScale = e.scale;
      e.elapsed = 0;
      e.active = true;
      e.generator = spin(e.yaw, e.from === selected ? 0 : -Math.PI, e.angularVelocity);
    }
  }
  if (!e.active) return false;
  const dt = starting ? 0 : Math.max(0, Math.min(delta, 0.05));
  const previousYaw = e.yaw;
  const wasSwapped = e.revealed !== e.from;
  e.elapsed += dt;
  const sample = e.generator.next(1000 * e.elapsed);
  const changing = e.from !== e.to;
  if (changing && sample.value <= SWAP_YAW) e.revealed = e.to;
  const swapped = e.revealed !== e.from;
  e.yaw = sample.value + (swapped ? Math.PI : 0);
  if (dt > 0) e.angularVelocity = (e.yaw - previousYaw - (swapped && !wasSwapped ? Math.PI : 0)) / dt;
  if (changing) {
    if (swapped) {
      const t = smoothRange(SWAP_YAW, -Math.PI, sample.value);
      e.scale = t < 0.6 ? 0.9 + 0.125 * smoothRange(0, 0.6, t) : 1 + 0.025 * (1 - smoothRange(0.6, 1, t));
    } else e.scale = e.startScale + (0.9 - e.startScale) * smoothRange(e.startYaw, SWAP_YAW, sample.value);
  } else e.scale = e.startScale + (1 - e.startScale) * smoothRange(0, 1, e.elapsed / 0.3);
  if (sample.done) {
    e.from = e.revealed = e.to;
    e.yaw = e.angularVelocity = 0;
    e.scale = 1;
    e.active = false;
  }
  return e.active;
}

/** Pointer position relative to the render surface, eased with 1 - e^(-12 dt). */
function usePointerLook(enabled: boolean) {
  const view = useContext(ViewContext);
  const invalidate = useThree((s) => s.invalidate);
  const look = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const element = view?.element;
  const visible = view?.visible;
  useEffect(() => {
    const reset = () => {
      look.current.targetX = look.current.targetY = 0;
      if (!document.hidden) invalidate();
    };
    reset();
    if (!enabled || !visible || !element) return;
    const move = (event: PointerEvent) => {
      if (document.hidden || event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      look.current.targetX = THREE.MathUtils.clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1);
      look.current.targetY = THREE.MathUtils.clamp((rect.top + rect.height / 2 - event.clientY) / (rect.height / 4), -1, 1);
      invalidate();
    };
    const out = (event: PointerEvent) => {
      if (event.relatedTarget === null) reset();
    };
    window.addEventListener("pointermove", move, { capture: true, passive: true });
    window.addEventListener("pointerout", out);
    window.addEventListener("blur", reset);
    window.addEventListener("resize", reset);
    return () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", reset);
      reset();
    };
  }, [enabled, visible, element, invalidate]);
  useFrame((_, delta) => {
    if (!visible || document.hidden) return;
    const l = look.current;
    const k = enabled ? 1 - Math.exp(-12 * Math.min(delta, 0.05)) : 1;
    const tx = enabled ? l.targetX : 0;
    const ty = enabled ? l.targetY : 0;
    l.x += (tx - l.x) * k;
    l.y += (ty - l.y) * k;
    if (Math.abs(l.x - tx) + Math.abs(l.y - ty) > 1e-4) invalidate();
    else {
      l.x = tx;
      l.y = ty;
    }
  }, -2);
  return look;
}

type SceneProps = {
  selected: SelectableName;
  playIntro: boolean;
  animateSelection: boolean;
  continuous: boolean;
  onReveal: (name: SelectableName) => void;
};

function DotsScene({ selected, playIntro, animateSelection, continuous, onReveal }: SceneProps) {
  const gltfs = useLoader(GLTFLoader, CHARACTER_NAMES.map((n) => MODEL_URLS[n]));
  const characters = useMemo<StageCharacter[]>(
    () => [buildLogo(), ...gltfs.map((gltf, i) => buildCharacter(gltf.scene, CHARACTER_NAMES[i]))],
    [gltfs],
  );
  useEffect(() => () => characters.forEach((c) => c.dispose()), [characters]);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const transition = useRef<Transition>({
    from: selected,
    to: selected,
    revealed: selected,
    yaw: 0,
    scale: 1,
    startYaw: 0,
    startScale: 1,
    angularVelocity: 0,
    elapsed: 0,
    active: false,
    generator: spin(),
  });
  const revealClock = useRef<number | null>(null);
  const lastRevealed = useRef<SelectableName | null>(null);
  const { viewport, invalidate } = useThree();
  const view = useContext(ViewContext)!;
  const look = usePointerLook(continuous);

  useEffect(() => {
    invalidate();
  }, [selected, playIntro, animateSelection, invalidate, view.visible]);

  useFrame((_, rawDelta) => {
    if (!view.visible || document.hidden) return;
    const delta = Math.min(rawDelta, 0.05);
    const t = transition.current;
    if (stepTransition(t, selected, delta, continuous && animateSelection)) invalidate();
    view.selection.current.postprocessing = t.revealed !== "O";

    if (lastRevealed.current !== t.revealed) {
      const character = characters[SELECTABLE_CHARACTER_NAMES.indexOf(t.revealed)];
      if (continuous && playIntro && character.kind === "motion") character.motion.excite();
      revealClock.current = continuous && playIntro ? 0 : null;
      lastRevealed.current = t.revealed;
      onReveal(t.revealed);
    }
    if (revealClock.current !== null) revealClock.current += delta;

    const halfHeight = viewport.height / 2;
    const height = Math.min(0.78 * halfHeight, 0.6 * viewport.width);
    const l = look.current;
    characters.forEach((character, i) => {
      const group = groups.current[i];
      if (!group) return;
      const name = SELECTABLE_CHARACTER_NAMES[i];
      const visible = name === t.revealed;
      group.visible = visible;
      if (!visible && view.selection.current.prepared) return;
      group.position.set(0, -(0.04 * halfHeight), 0);
      group.rotation.set(name === "O" ? 0 : 0.035 - 0.1 * l.y, t.yaw + (name === "O" ? 0 : 0.16 * l.x), 0);
      group.scale.setScalar((height / character.size.y) * t.scale);
      if (character.kind === "motion") {
        character.motion.update(continuous ? delta : 0);
        character.poseHero({ x: 0.6 * l.x, y: 0.6 * l.y });
        if (continuous && (character.motion.state.playing || character.motion.state.blending)) invalidate();
      } else if (character.kind === "posed") {
        const clock = revealClock.current;
        const revealing = continuous && playIntro && clock !== null && clock < TODD_REVEAL_SECONDS;
        character.pose(revealing ? sampleToddReveal(clock) : undefined, 0.6 * l.x, 0.6 * l.y);
        if (revealing) invalidate();
      }
    });
  });

  return (
    <>
      <Lights />
      {characters.map((character, i) => {
        const name = SELECTABLE_CHARACTER_NAMES[i];
        return (
          <group
            key={name}
            visible={name === selected}
            ref={(group) => {
              groups.current[i] = group;
              view.selection.current.targets[i] = group ? { root: group, postprocessing: name !== "O" } : null;
            }}
          >
            {name !== "O" && <Fur scene={character.scene} />}
            <primitive object={character.scene} position={character.center.clone().negate()} dispose={null} />
          </group>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// View: canvas + visibility + DPR
// ---------------------------------------------------------------------------

export function DotsStage({ className, label, onReady, ...scene }: SceneProps & { className?: string; label: string; onReady: () => void }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [intersecting, setIntersecting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(1);
  const selection = useRef(createSelectionRenderer());

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0),
      { threshold: [0, 0.001] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    const onResize = () => setDpr(Math.min(window.devicePixelRatio, 2));
    onVisibility();
    onResize();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const visible = intersecting && !hidden;
  const view = useMemo(() => ({ element, visible, selection }), [element, visible]);

  return (
    <div ref={setElement} className={className} role="img" aria-label={label} data-renderer={ready ? "webgl" : "fallback"}>
      {element && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ visibility: ready ? undefined : "hidden" }}>
          <Canvas
            orthographic
            camera={{ position: [0, 0, 25], zoom: 100, near: 0.1, far: 100 }}
            dpr={dpr}
            resize={{ scroll: false, offsetSize: true }}
            frameloop={visible ? "demand" : "never"}
            gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.8 }}
            onCreated={({ gl }) => gl.setClearAlpha(0)}
          >
            <ViewContext.Provider value={view}>
              <Suspense fallback={null}>
                <Renderer
                  active={visible}
                  samples={4}
                  onReady={() => {
                    setReady(true);
                    onReady();
                  }}
                >
                  <DotsScene {...scene} />
                </Renderer>
              </Suspense>
            </ViewContext.Provider>
          </Canvas>
        </div>
      )}
    </div>
  );
}
