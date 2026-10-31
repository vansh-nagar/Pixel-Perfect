"use client";

/**
 * Streaks of light pouring through a twisted hourglass, like a long exposure of a wormhole.
 *
 *  Tilt   moving the pointer leans the funnel
 *  Warp   hold anywhere to accelerate the flow and stretch the streaks
 *  Tune   the panel changes palette, shape, flow and light live; H hides it
 *
 * Every streak is one instanced ribbon that follows a curve on a hyperboloid (radius grows
 * with height, angle twists with atan(y)), so bundles of streaks cross into the bright
 * diagonal weave at the waist. Ribbons are expanded in screen space in the vertex shader
 * and widened by their distance from a focal plane, which fakes depth of field: streaks
 * near the camera turn into big soft smears, the waist stays crisp. Additive HDR, then
 * bloom, tone mapping and a grain / chromatic-aberration pass.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ControlPanel } from "./control-panel";
import { DEFAULTS, PALETTES, randomSettings, type Settings } from "./settings";

const STREAKS = 11000;
const DUST = 26000;
const SEGMENTS = 10;
const BUNDLES = 46;

// World units: the waist sits at the origin, the flow runs along y.
// Waist, twist, lean, gain, blur and the rest live in settings.ts.
const FUNNEL = { flare: 0.58, height: 2.6, tilt: -0.06 };
const FLOW = { speed: 0.55, warp: 3.2, stretch: 1.8 };
const LENS = { focus: 3.75 };
const BLOOM = { radius: 0.45, threshold: 0.5 };

const CURVE = /* glsl */ `
  uniform float uFlow;
  uniform float uSpin;
  uniform float uWaist;
  uniform float uTwist;
  uniform float uBend;
  uniform float uBlur;
  vec3 funnel(float y, float th, float rho) {
    float a = ${FUNNEL.flare.toFixed(3)};
    float r = uWaist * rho * sqrt(1.0 + (y / a) * (y / a));
    float ph = th + uSpin + uTwist * atan(y / a);
    vec3 p = vec3(cos(ph) * r, y, sin(ph) * r);
    p.x += uBend * sin(y * 0.9 + 0.5);
    return p;
  }
  // How much the funnel surface at this point faces the camera (1 front, -1 back).
  float facing(float y, float th) {
    float ph = th + uSpin + uTwist * atan(y / ${FUNNEL.flare.toFixed(3)});
    return normalize((modelViewMatrix * vec4(cos(ph), 0.0, sin(ph), 0.0)).xyz).z;
  }
`;

const streakVertex = /* glsl */ `
  attribute vec4 aPath;   // angle, radius scale, start offset, speed
  attribute vec4 aLook;   // length, width px, palette, brightness
  uniform vec2 uResolution;
  uniform float uStretch;
  uniform float uPixel;
  uniform float uGain;
  uniform vec3 uPalette[6];
  varying float vSide;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSharp;
  ${CURVE}

  void main() {
    float s = position.x;
    float side = position.y;
    float span = 2.0 * ${FUNNEL.height.toFixed(3)};
    float head = mod(aPath.z + uFlow * aPath.w, span) - ${FUNNEL.height.toFixed(3)};
    float len = aLook.x * uStretch;
    float y = head - s * len;

    vec3 p0 = funnel(y, aPath.x, aPath.y);
    vec3 p1 = funnel(y + 0.01, aPath.x, aPath.y);
    vec4 view = modelViewMatrix * vec4(p0, 1.0);
    vec4 c0 = projectionMatrix * view;
    vec4 c1 = projectionMatrix * modelViewMatrix * vec4(p1, 1.0);
    vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * uResolution;
    d = length(d) > 1e-5 ? normalize(d) : vec2(0.0, 1.0);
    vec2 n = vec2(-d.y, d.x);

    // Depth of field: out-of-focus streaks widen and dim.
    float blur = abs(-view.z - ${LENS.focus.toFixed(3)}) * uBlur;
    float taper = pow(sin(3.14159 * s), 0.9);
    float width = (aLook.y + blur * blur * 20.0) * uPixel * (0.25 + 0.75 * taper);
    c0.xy += n * side * width / uResolution * c0.w;
    gl_Position = c0;

    float ends = smoothstep(${FUNNEL.height.toFixed(3)}, ${(FUNNEL.height * 0.7).toFixed(3)}, abs(y));
    // The far wall is hidden so the funnel reads as a solid sheet, not a see-through cage.
    float face = facing(y, aPath.x);
    float back = mix(0.04, 1.0, smoothstep(-0.25, 0.35, face));
    // Rim light: the silhouette, where the surface turns away, burns brightest.
    float rim = 1.0 + 1.0 * pow(1.0 - abs(face), 4.0) * step(-0.1, face);
    float waist = 1.0 + 0.8 * exp(-y * y * 1.6);
    vSide = side;
    vSharp = mix(2.6, 1.2, clamp(blur, 0.0, 1.0));
    vColor = uPalette[int(aLook.z)] * aLook.w;
    vAlpha = uGain * taper * ends * back * waist * rim / (1.0 + blur * blur * 11.0);
  }
`;

const streakFragment = /* glsl */ `
  varying float vSide;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSharp;
  uniform vec3 uFringe[2];
  void main() {
    float body = exp(-vSide * vSide * vSharp * 2.0);
    float core = exp(-vSide * vSide * vSharp * 9.0);
    // Thin-film fringe: warm on one edge, cool on the other.
    vec3 fringe = vSide < 0.0 ? uFringe[0] : uFringe[1];
    vec3 col = vColor * (body * 1.4 + core * 0.6) + vec3(1.0, 0.93, 0.85) * core * 0.5 * min(1.0, length(vColor)) + fringe * (body - core) * 0.5;
    gl_FragColor = vec4(col * vAlpha, 1.0);
  }
`;

const dustVertex = /* glsl */ `
  attribute vec4 aPath;
  attribute vec2 aLook;   // size, phase
  uniform float uPixel;
  uniform float uTime;
  uniform float uDust;
  varying float vAlpha;
  ${CURVE}
  void main() {
    float span = 2.0 * ${FUNNEL.height.toFixed(3)};
    float y = mod(aPath.z + uFlow * aPath.w * 0.35, span) - ${FUNNEL.height.toFixed(3)};
    vec4 view = modelViewMatrix * vec4(funnel(y, aPath.x, aPath.y), 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = aLook.x * uPixel;
    float twinkle = 0.55 + 0.45 * sin(uTime * 3.0 + aLook.y * 6.2831);
    float ends = smoothstep(${FUNNEL.height.toFixed(3)}, ${(FUNNEL.height * 0.7).toFixed(3)}, abs(y));
    float blur = abs(-view.z - ${LENS.focus.toFixed(3)}) * uBlur;
    float back = mix(0.05, 1.0, smoothstep(-0.25, 0.35, facing(y, aPath.x)));
    vAlpha = uDust * twinkle * ends * back / (1.0 + blur * blur * 14.0);
  }
`;

const dustFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(q));
    gl_FragColor = vec4(vec3(1.0, 0.9, 0.8) * a * vAlpha * 0.9, 1.0);
  }
`;

const FinishShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAberration: { value: 0.0035 }, uHue: { value: 0 }, uSaturation: { value: 1 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAberration;
    uniform float uHue;
    uniform float uSaturation;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 off = (vUv - 0.5) * uAberration;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      // Hue rotation in YIQ, then saturation around luma.
      vec3 yiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312) * col;
      float c = cos(uHue), s = sin(uHue);
      yiq.yz = mat2(c, s, -s, c) * yiq.yz * uSaturation;
      col = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703) * yiq;
      float v = smoothstep(1.05, 0.3, length((vUv - 0.5) * vec2(1.1, 1.0)));
      col *= mix(0.35, 1.0, v);
      col += (hash(vUv * 1000.0 + fract(uTime) * 61.0) - 0.5) * 0.045;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

// Mulberry32: the same funnel every load.
const random = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (rand: () => number) => Math.sqrt(-2 * Math.log(rand() || 1e-6)) * Math.cos(Math.PI * 2 * rand());

export default function LightFunnel() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(true);
  const targetRef = useRef(settings);
  useEffect(() => {
    targetRef.current = settings;
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "h" || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, [contenteditable]")) return;
      setPanelOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = random(7);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setClearColor(0x050304, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    renderer.domElement.className = "absolute inset-0 size-full";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0, 4.4);
    const funnel = new THREE.Group();
    funnel.rotation.z = FUNNEL.tilt;
    scene.add(funnel);

    // What the scene actually shows: eases toward the panel's settings every frame.
    const live = { ...targetRef.current };
    const toColor = (c: [number, number, number]) => new THREE.Color(c[0], c[1], c[2]);
    const palette = PALETTES[live.palette];

    const shared = {
      uWaist: { value: live.waist },
      uTwist: { value: live.twist },
      uBend: { value: live.lean },
      uBlur: { value: live.blur },
      uGain: { value: live.brightness },
      uDust: { value: live.dust },
      uPalette: { value: palette.colors.map(toColor) },
      uFringe: { value: palette.fringe.map(toColor) },
      uFlow: { value: 0 },
      uSpin: { value: 0 },
      uTime: { value: 0 },
      uPixel: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uStretch: { value: 1 },
    };

    // Streaks: one ribbon strip, instanced. position = (along 0..1, side ±1).
    const strip: number[] = [];
    const index: number[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      strip.push(i / SEGMENTS, -1, 0, i / SEGMENTS, 1, 0);
      if (i < SEGMENTS) {
        const a = i * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const streakGeometry = new THREE.InstancedBufferGeometry();
    streakGeometry.setAttribute("position", new THREE.Float32BufferAttribute(strip, 3));
    streakGeometry.setIndex(index);
    streakGeometry.instanceCount = STREAKS;

    // Most streaks cluster into bundles around the funnel; the rest are loose strays.
    const bundles = Array.from({ length: BUNDLES }, () => ({ angle: rand() * Math.PI * 2, weight: 0.7 + rand() * 0.35 }));
    const path = new Float32Array(STREAKS * 4);
    const look = new Float32Array(STREAKS * 4);
    for (let i = 0; i < STREAKS; i++) {
      const stray = rand() < 0.16;
      const bundle = bundles[Math.floor(rand() * BUNDLES)];
      path[i * 4] = stray ? rand() * Math.PI * 2 : bundle.angle + gauss(rand) * 0.07;
      path[i * 4 + 1] = stray ? 0.82 + rand() * 0.6 : 1 + gauss(rand) * 0.05;
      path[i * 4 + 2] = rand() * FUNNEL.height * 2;
      path[i * 4 + 3] = 0.65 + rand() * 0.7;
      const p = rand();
      look[i * 4] = 0.08 + rand() ** 2.5 * 0.7;
      look[i * 4 + 1] = 0.6 + rand() ** 3 * 3.4;
      look[i * 4 + 2] = p < 0.4 ? 0.5 : p < 0.63 ? 1.5 : p < 0.8 ? 2.5 : p < 0.91 ? 3.5 : p < 0.96 ? 4.5 : 5.5;
      look[i * 4 + 3] = (0.25 + rand() ** 2 * 1.4) * (stray ? 0.6 : 1) * bundle.weight;
      // Sheet: wide, faint, long smears that fill the gaps between bundles.
      if (!stray && rand() < 0.22) {
        look[i * 4] = 0.5 + rand() * 0.7;
        look[i * 4 + 1] = 6 + rand() * 8;
        look[i * 4 + 2] = rand() < 0.6 ? 0.5 : 2.5;
        look[i * 4 + 3] = 0.08 + rand() * 0.1;
      }
      // Flares: short, thick, hot beads riding the bundles.
      if (!stray && rand() < 0.06) {
        const f = rand();
        look[i * 4] = 0.14 + rand() * 0.34;
        look[i * 4 + 1] = 2.5 + rand() * 4;
        look[i * 4 + 2] = f < 0.45 ? 1.5 : f < 0.7 ? 2.5 : f < 0.85 ? 0.5 : f < 0.93 ? 3.5 : 4.5;
        look[i * 4 + 3] = 1.8 + rand() * 2.2;
      }
    }
    streakGeometry.setAttribute("aPath", new THREE.InstancedBufferAttribute(path, 4));
    streakGeometry.setAttribute("aLook", new THREE.InstancedBufferAttribute(look, 4));
    const streakMaterial = new THREE.ShaderMaterial({
      uniforms: shared,
      vertexShader: streakVertex,
      fragmentShader: streakFragment,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const streaks = new THREE.Mesh(streakGeometry, streakMaterial);
    streaks.frustumCulled = false;
    funnel.add(streaks);

    // Dust: fine glitter drifting slower along the same surface.
    const dustPath = new Float32Array(DUST * 4);
    const dustLook = new Float32Array(DUST * 2);
    for (let i = 0; i < DUST; i++) {
      dustPath[i * 4] = rand() * Math.PI * 2;
      dustPath[i * 4 + 1] = 0.9 + Math.abs(gauss(rand)) * 0.18;
      dustPath[i * 4 + 2] = rand() * FUNNEL.height * 2;
      dustPath[i * 4 + 3] = 0.5 + rand();
      dustLook[i * 2] = 0.8 + rand() ** 4 * 2.6;
      dustLook[i * 2 + 1] = rand();
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(DUST * 3), 3));
    dustGeometry.setAttribute("aPath", new THREE.Float32BufferAttribute(dustPath, 4));
    dustGeometry.setAttribute("aLook", new THREE.Float32BufferAttribute(dustLook, 2));
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: shared,
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    dust.frustumCulled = false;
    funnel.add(dust);

    const composer = new EffectComposer(
      renderer,
      new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }),
    );
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), live.glow, BLOOM.radius, BLOOM.threshold);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const finish = new ShaderPass(FinishShader);
    composer.addPass(finish);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
      camera.aspect = width / Math.max(1, height);
      // Portrait screens pull back so the waist still fits across.
      camera.position.z = 4.4 * Math.max(1, 0.85 / camera.aspect);
      camera.updateProjectionMatrix();
      shared.uResolution.value.set(width * dpr, height * dpr);
      shared.uPixel.value = dpr * Math.max(0.6, height / 1000);
    };

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, down: false, warp: 0 };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("[data-panel]")) return;
      pointer.down = true;
    };
    const onUp = () => (pointer.down = false);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const frame = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      const ease = 1 - Math.exp(-4 * dt);
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;
      pointer.warp += ((pointer.down ? 1 : 0) - pointer.warp) * (1 - Math.exp(-(pointer.down ? 2.5 : 3.5) * dt));

      const target = targetRef.current;
      const k = 1 - Math.exp(-6 * dt);
      for (const key of Object.keys(live) as (keyof Settings)[]) {
        if (key !== "palette") live[key] += (target[key] - live[key]) * k;
      }
      const goal = PALETTES[target.palette];
      shared.uPalette.value.forEach((c, i) => c.lerp(toColor(goal.colors[i]), k));
      shared.uFringe.value.forEach((c, i) => c.lerp(toColor(goal.fringe[i]), k));
      shared.uWaist.value = live.waist;
      shared.uTwist.value = live.twist;
      shared.uBend.value = live.lean;
      shared.uBlur.value = live.blur;
      shared.uGain.value = live.brightness;
      shared.uDust.value = live.dust;

      const speed = reducedMotion ? 0.08 : FLOW.speed * live.speed * (1 + FLOW.warp * pointer.warp);
      shared.uFlow.value += speed * dt;
      shared.uSpin.value += (reducedMotion ? 0 : live.spin) * dt;
      shared.uTime.value = now / 1000;
      shared.uStretch.value = live.length * (1 + FLOW.stretch * pointer.warp);
      bloom.strength = live.glow * (1 + 0.35 * pointer.warp);
      finish.uniforms.uTime.value = now / 1000;
      finish.uniforms.uAberration.value = 0.01 * live.aberration + 0.006 * pointer.warp;
      finish.uniforms.uHue.value = (live.hue * Math.PI) / 180;
      finish.uniforms.uSaturation.value = live.saturation;

      funnel.rotation.x = pointer.y * 0.22;
      funnel.rotation.y = pointer.x * 0.3;
      funnel.rotation.z = FUNNEL.tilt - pointer.x * 0.06;

      composer.render(dt);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    // Stop drawing while scrolled away.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(host);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      streakGeometry.dispose();
      streakMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      composer.dispose();
      bloom.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="relative h-dvh w-full cursor-crosshair touch-none overflow-hidden bg-[#050304]">
      <span className="sr-only">Streaks of light flowing through a twisted hourglass. Hold to warp.</span>
      <ControlPanel
        settings={settings}
        onChange={update}
        onRandomize={() => setSettings(randomSettings())}
        onReset={() => setSettings(DEFAULTS)}
        open={panelOpen}
        onToggle={() => setPanelOpen(true)}
      />
    </div>
  );
}
