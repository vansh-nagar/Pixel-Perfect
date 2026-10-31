"use client";

/**
 * The Porsche 911 GT3 R as line art on paper, seen for real only through a handheld
 * camera's viewfinder.
 *
 *  Move   the camera follows the pointer on a spring, tilting with the hand and swaying
 *         a little when idle; it drifts back to centre when the pointer leaves
 *  Click  take a photo: the shutter flashes and the shot drops onto a stack of prints
 *  Drag   orbit the car; it turns slowly on its own
 *  Scroll zoom
 *
 * Each frame renders the scene twice into offscreen targets: once lit (studio environment
 * reflections, a soft key-light shadow, 4× MSAA), once with a normal material plus a
 * depth texture. A full-screen pass finds the line art from the second (normal creases
 * and depth jumps, a Sobel-style cross of samples) and picks per pixel: paper and ink
 * outside the viewfinder's rotated rounded-rectangle SDF, the real render (tone-mapped,
 * vignetted like a lens) inside. Photos are cropped from the canvas right after it draws.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const CAR_URL = "/playground/car/porsche-gt3r.glb";
const PAPER = "#e9e8e4";
const INK = "#8f8d88";
const CARD = { widthRatio: 0.3, maxWidth: 560, aspect: 1.5, radius: 14, stiffness: 110, damping: 15 };
const PRINTS = { width: 150, keep: 5 };

type Shot = { id: number; src: string; tilt: number; from: { x: number; y: number; scale: number } };

const timecode = (t: number) => {
  const f = Math.floor((t % 1) * 24);
  const s = Math.floor(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
};

// A print flies from the viewfinder to its spot on the stack.
function Print({ shot, index }: { shot: Shot; index: number }) {
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setLanded(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const rest = `translate(calc(100vw - ${PRINTS.width / 2 + 40 + index * 46}px), calc(100dvh - ${110 + (index % 2) * 14}px)) translate(-50%, -50%) rotate(${shot.tilt}deg) scale(1)`;
  const start = `translate(${shot.from.x}px, ${shot.from.y}px) translate(-50%, -50%) rotate(0deg) scale(${shot.from.scale})`;
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 bg-[#fbfaf7] p-2 pb-7 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      style={{ width: PRINTS.width, transform: landed ? rest : start }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.src} alt="" className="block w-full" />
    </div>
  );
}

const compositeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const compositeFragment = /* glsl */ `
  uniform sampler2D tReal;
  uniform sampler2D tNormal;
  uniform sampler2D tDepth;
  uniform vec2 uResolution;   // device px
  uniform vec4 uCard;         // centre xy, half size zw (device px, y up)
  uniform float uRadius;
  uniform float uAngle;
  uniform float uFlash;
  uniform float uPixel;
  uniform float uNear;
  uniform float uFar;
  uniform vec3 uPaper;
  uniform vec3 uInk;
  varying vec2 vUv;

  float viewDepth(vec2 uv) {
    float d = texture2D(tDepth, uv).x;
    return (uNear * uFar) / (uFar - d * (uFar - uNear));
  }

  float edges(vec2 uv) {
    vec2 o = uPixel / uResolution;
    vec4 n0 = texture2D(tNormal, uv);
    float d0 = viewDepth(uv);
    float crease = 0.0;
    float jump = 0.0;
    float silhouette = 0.0;
    vec2 dirs[4];
    dirs[0] = vec2(o.x, 0.0); dirs[1] = vec2(-o.x, 0.0); dirs[2] = vec2(0.0, o.y); dirs[3] = vec2(0.0, -o.y);
    for (int i = 0; i < 4; i++) {
      vec4 n = texture2D(tNormal, uv + dirs[i]);
      silhouette += abs(n.a - n0.a);
      if (n.a > 0.5 && n0.a > 0.5) {
        crease += 1.0 - dot(n.xyz * 2.0 - 1.0, n0.xyz * 2.0 - 1.0);
        jump += abs(viewDepth(uv + dirs[i]) - d0) / d0;
      }
    }
    return clamp(smoothstep(0.25, 0.9, crease) + smoothstep(0.015, 0.05, jump) + silhouette, 0.0, 1.0);
  }

  // Rounded-rectangle signed distance (negative inside).
  vec2 local(vec2 p) {
    vec2 d = p - uCard.xy;
    float c = cos(uAngle), s = sin(uAngle);
    return vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  }
  float card(vec2 p) {
    vec2 q = abs(local(p)) - uCard.zw + uRadius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  }

  vec3 aces(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }
  vec3 toSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }

  void main() {
    vec2 px = vUv * uResolution;
    float inside = 1.0 - smoothstep(-0.75, 0.75, card(px));

    // Outside: paper and ink. The drawing is a touch thicker and softened.
    float line = edges(vUv);
    vec3 drawn = mix(uPaper, uInk, line * 0.9);

    // Inside: the real render over a dark studio, vignetted like a lens, plus the flash.
    vec4 real = texture2D(tReal, vUv);
    vec2 uvCard = local(px) / uCard.zw;
    vec3 studio = mix(vec3(0.03), vec3(0.008), length(uvCard) * 0.7);
    vec3 lit = toSrgb(aces(real.rgb * 0.95));
    vec3 shown = mix(studio, lit, clamp(real.a, 0.0, 1.0));
    shown *= 1.0 - 0.35 * smoothstep(0.55, 1.45, length(uvCard * vec2(1.0, 0.85)));
    shown = mix(shown, vec3(1.0), uFlash);

    gl_FragColor = vec4(mix(drawn, shown, inside), 1.0);
  }
`;

export default function CarShowroom() {
  const hostRef = useRef<HTMLDivElement>(null);
  const finderRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "absolute inset-0 size-full";
    host.prepend(renderer.domElement);
    const anisotropy = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 60);
    camera.position.set(4.3, 1.45, 4.9);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.55, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 3.8;
    controls.maxDistance = 13;
    controls.maxPolarAngle = 1.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;

    // Studio lighting: room reflections for the paint, one soft key light for the shadow.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, 0.03);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.9;
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 8, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
    key.shadow.radius = 6;
    key.shadow.bias = -0.0003;
    scene.add(key);

    // Floor (real pass only): a soft pool of light plus a shadow catcher.
    const FLOOR = 1;
    const pool = document.createElement("canvas");
    pool.width = pool.height = 256;
    const pc = pool.getContext("2d")!;
    const g = pc.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(70,70,74,1)");
    g.addColorStop(0.55, "rgba(30,30,32,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    pc.fillStyle = g;
    pc.fillRect(0, 0, 256, 256);
    const poolTexture = new THREE.CanvasTexture(pool);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: poolTexture, transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2;
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.55 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.y = 0.001;
    catcher.receiveShadow = true;
    floor.layers.set(FLOOR);
    catcher.layers.set(FLOOR);
    scene.add(floor, catcher);

    const car = new THREE.Group();
    scene.add(car);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      CAR_URL,
      (gltf) => {
        if (cancelled) return;
        gltf.scene.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          for (const mat of ([] as THREE.Material[]).concat(mesh.material)) {
            const std = mat as THREE.MeshStandardMaterial;
            for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"] as const) {
              if (std[k]) std[k]!.anisotropy = anisotropy;
            }
          }
        });
        car.add(gltf.scene);
        setReady(true);
      },
      (e) => e.total && setProgress(e.loaded / e.total),
    );

    // Offscreen targets: lit colour (linear HDR, MSAA) and normals + depth.
    const realTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const normalTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    normalTarget.depthTexture = new THREE.DepthTexture(1, 1, THREE.FloatType);
    const normalMaterial = new THREE.MeshNormalMaterial();

    const composite = new THREE.ShaderMaterial({
      vertexShader: compositeVertex,
      fragmentShader: compositeFragment,
      uniforms: {
        tReal: { value: realTarget.texture },
        tNormal: { value: normalTarget.texture },
        tDepth: { value: normalTarget.depthTexture },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uCard: { value: new THREE.Vector4() },
        uRadius: { value: CARD.radius },
        uAngle: { value: 0 },
        uFlash: { value: 0 },
        uPixel: { value: 1 },
        uNear: { value: camera.near },
        uFar: { value: camera.far },
        // The pass writes straight to the screen, so colours go in as sRGB values.
        uPaper: { value: new THREE.Color(PAPER).convertLinearToSRGB() },
        uInk: { value: new THREE.Color(INK).convertLinearToSRGB() },
      },
      depthTest: false,
      depthWrite: false,
    });
    const quadScene = new THREE.Scene();
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), composite);
    quad.frustumCulled = false;
    quadScene.add(quad);

    let width = 1;
    let height = 1;
    let dpr = 1;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      realTarget.setSize(width * dpr, height * dpr);
      normalTarget.setSize(width * dpr, height * dpr);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      composite.uniforms.uResolution.value.set(width * dpr, height * dpr);
      composite.uniforms.uPixel.value = dpr;
      composite.uniforms.uRadius.value = CARD.radius * dpr;
    };

    // The camera, in CSS px (y down): a damped spring toward the pointer, or the centre.
    const cam = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, angle: 0, hovering: false, init: false };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      cam.tx = e.clientX - r.left;
      cam.ty = e.clientY - r.top;
      cam.hovering = true;
    };
    const onLeave = () => (cam.hovering = false);

    // A click (not a drag) takes a photo on the next frame.
    let press = { x: 0, y: 0, t: 0 };
    let snap = false;
    let flash = 0;
    let shotId = 0;
    const onDown = (e: PointerEvent) => (press = { x: e.clientX, y: e.clientY, t: performance.now() });
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6 && performance.now() - press.t < 350) snap = true;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", onUp);
    const grab = document.createElement("canvas");

    const takePhoto = (cardW: number, cardH: number) => {
      const w = Math.round(cardW * dpr);
      const h = Math.round(cardH * dpr);
      grab.width = w;
      grab.height = h;
      grab.getContext("2d")!.drawImage(renderer.domElement, Math.round((cam.x - cardW / 2) * dpr), Math.round((cam.y - cardH / 2) * dpr), w, h, 0, 0, w, h);
      const shot: Shot = {
        id: ++shotId,
        src: grab.toDataURL("image/jpeg", 0.9),
        tilt: (Math.random() - 0.5) * 12,
        from: { x: cam.x, y: cam.y, scale: cardW / PRINTS.width },
      };
      setShots((list) => [...list, shot].slice(-PRINTS.keep));
    };

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      controls.update(dt);

      const cardW = Math.min(width * CARD.widthRatio, CARD.maxWidth);
      const cardH = cardW / CARD.aspect;
      if (!cam.hovering) {
        cam.tx = width / 2;
        cam.ty = height / 2;
      }
      if (!cam.init) {
        Object.assign(cam, { x: cam.tx, y: cam.ty, init: true });
      }
      // Hand sway: a few slow, unrelated sines so it never looks like a loop.
      const t = now / 1000;
      const swayX = Math.sin(t * 0.9) * 3 + Math.sin(t * 2.3 + 1) * 1.2;
      const swayY = Math.sin(t * 1.1 + 2) * 2.5 + Math.sin(t * 2.9) * 1;
      cam.vx += (CARD.stiffness * (cam.tx + swayX - cam.x) - CARD.damping * cam.vx) * dt;
      cam.vy += (CARD.stiffness * (cam.ty + swayY - cam.y) - CARD.damping * cam.vy) * dt;
      cam.x += cam.vx * dt;
      cam.y += cam.vy * dt;
      // The wrist rolls with sideways speed, plus a slight idle roll.
      const roll = THREE.MathUtils.clamp(cam.vx * 0.00022, -0.12, 0.12) + Math.sin(t * 0.7) * 0.012;
      cam.angle += (roll - cam.angle) * (1 - Math.exp(-10 * dt));
      flash *= Math.exp(-9 * dt);
      composite.uniforms.uFlash.value = flash;
      composite.uniforms.uAngle.value = -cam.angle;
      composite.uniforms.uCard.value.set(cam.x * dpr, (height - cam.y) * dpr, (cardW / 2) * dpr, (cardH / 2) * dpr);
      if (finderRef.current) {
        finderRef.current.style.width = `${cardW}px`;
        finderRef.current.style.height = `${cardH}px`;
        finderRef.current.style.transform = `translate(${cam.x - cardW / 2}px, ${cam.y - cardH / 2}px) rotate(${cam.angle}rad) scale(${1 - flash * 0.03})`;
      }
      if (timeRef.current) timeRef.current.textContent = timecode(t);

      // Pass 1: lit, with the floor.
      camera.layers.enable(FLOOR);
      renderer.setRenderTarget(realTarget);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);

      // Pass 2: normals and depth, car only.
      camera.layers.disable(FLOOR);
      scene.overrideMaterial = normalMaterial;
      renderer.setRenderTarget(normalTarget);
      renderer.clear();
      renderer.render(scene, camera);
      scene.overrideMaterial = null;

      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
      if (snap) {
        snap = false;
        takePhoto(cardW, cardH);
        flash = 1;
      }
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

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
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      controls.dispose();
      car.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        for (const mat of ([] as THREE.Material[]).concat(mesh.material)) {
          for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
          mat.dispose();
        }
      });
      for (const d of [realTarget, normalTarget, normalMaterial, composite, quad.geometry, floor.geometry, floor.material, poolTexture, catcher.geometry, catcher.material, envTarget, pmrem]) d.dispose();
      room.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="relative h-dvh w-full cursor-crosshair touch-none overflow-hidden select-none" style={{ background: PAPER }}>
      {/* Viewfinder chrome, laid over the shader's window and moved with it. */}
      <div ref={finderRef} className="pointer-events-none absolute top-0 left-0 z-10 origin-center text-white">
        <div className="absolute inset-0 rounded-[14px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_30px_60px_-24px_rgba(0,0,0,0.55)]" />
        {(["top-3 left-3 border-t-2 border-l-2", "top-3 right-3 border-t-2 border-r-2", "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"] as const).map((c) => (
          <span key={c} className={`absolute size-5 border-white/90 ${c}`} />
        ))}
        <div className="absolute inset-x-[33.33%] inset-y-3 border-x border-white/10" />
        <div className="absolute inset-y-[33.33%] inset-x-3 border-y border-white/10" />
        <div className="absolute top-1/2 left-1/2 size-14 -translate-1/2 border border-white/70">
          <span className="absolute top-1/2 left-1/2 h-px w-3 -translate-1/2 bg-white/80" />
          <span className="absolute top-1/2 left-1/2 h-3 w-px -translate-1/2 bg-white/80" />
        </div>
        <div className="absolute top-4 left-9 flex items-center gap-1.5 text-[11px] font-medium tabular-nums tracking-wide">
          <span className="size-2 animate-pulse rounded-full bg-[#ff3b30]" />
          <span ref={timeRef}>00:00:00:00</span>
        </div>
        <div className="absolute right-9 bottom-4 flex items-center gap-3 text-[11px] font-medium tabular-nums tracking-wide text-white/85">
          <span>ISO 400</span>
          <span>1/250</span>
          <span>f/2.8</span>
        </div>
      </div>
      {shots.map((shot, i) => (
        <Print key={shot.id} shot={shot} index={shots.length - 1 - i} />
      ))}
      {!ready && (
        <div className="absolute inset-0 z-20 grid place-items-center text-sm text-[#151514]/60" style={{ background: PAPER }}>
          <span className="tabular-nums">Loading {Math.round(progress * 100)}%</span>
        </div>
      )}
    </div>
  );
}
