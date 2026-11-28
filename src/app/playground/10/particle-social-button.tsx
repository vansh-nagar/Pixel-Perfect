"use client";

/**
 * A glass pill social button whose logo is a cloud of tiny shaded spheres, like a scanned
 * point cloud, that cycles X → Discord → Reddit: every grain lifts off one logo, drifts, and
 * lands in the next while the label rolls over and the pill glides to the new width. The cloud
 * tilts toward the pointer and spins a full turn on hover; hovering also pauses the cycle so
 * the link you click is the one you see. The pill is stacked layers: a tinted fill with a long soft shadow,
 * a top gloss that brightens on hover, a dark centre vignette that deepens on press, and a
 * 1px gradient rim. Dark and light variants.
 *
 * How it works:
 *  - Each logo is rasterised once from its SVG path onto a 2D canvas, then exactly 2,200 points
 *    are rejection-sampled inside it and given a random depth, so the logo is a thick slab.
 *    Point i of every logo is a pair, so a morph is a per-point mix in the vertex shader,
 *    staggered by a per-point random so the grains don't all leave at once.
 *  - Each point is drawn as a sphere impostor: the fragment shader turns the round sprite
 *    into a fake normal and lights it, so the cloud reads as solid grains with shadow.
 *  - The burst is one spring value (uBurst) in JS; the vertex shader pushes every point
 *    along its own random direction by that amount, so there is no per-point work on the CPU.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";

// Logos in a 24-unit box (simple-icons paths) with their default labels and links.
const ICONS = {
  x: {
    label: "Follow on X",
    href: "https://x.com/",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
  discord: {
    label: "Join the Discord",
    href: "https://discord.com/",
    path: "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
  },
  reddit: {
    label: "Join on Reddit",
    href: "https://www.reddit.com/",
    path: "M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z",
  },
} as const;
export type ParticleIcon = keyof typeof ICONS;
const COUNT = 2200;
const DEPTH = 0.16; // half thickness of the slab, in logo widths
const BURST = { stiffness: 170, damping: 14 };
const SPIN = 1.1; // seconds for the full turn on hover
const HOLD = 2.4; // seconds on each logo
const MORPH = 1.0; // seconds for the grains to travel to the next
const TILT = 0.45; // radians at the edge of the button

const vertexShader = /* glsl */ `
  attribute vec3 aPos0;
  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aDir;
  attribute float aSize;
  attribute float aShade;
  uniform float uBurst;
  uniform float uTime;
  uniform float uPx;
  uniform vec3 uFrom;   // one-hot: which logo we're leaving
  uniform vec3 uTo;     // one-hot: which logo we're heading to
  uniform float uMorph; // 0 → 1 over the transition
  varying float vShade;
  void main() {
    vec3 a = aPos0 * uFrom.x + aPos1 * uFrom.y + aPos2 * uFrom.z;
    vec3 b = aPos0 * uTo.x + aPos1 * uTo.y + aPos2 * uTo.z;
    // Each grain leaves at its own moment and arcs outward mid-flight.
    float e = smoothstep(0.0, 1.0, clamp(uMorph * 1.6 - aShade * 0.6, 0.0, 1.0));
    vec3 p = mix(a, b, e) + aDir * sin(3.14159 * e) * (0.14 + aShade * 0.22);
    // Burst along each point's own direction, plus a slow shimmer so it never sits dead still.
    p += aDir * uBurst * (0.35 + aShade * 0.5);
    p += 0.006 * vec3(sin(uTime * 1.7 + aShade * 40.0), cos(uTime * 1.3 + aShade * 70.0), 0.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPx / -mv.z;
    vShade = aShade;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLit;
  uniform vec3 uDark;
  varying float vShade;
  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(uv, uv);
    if (r2 > 1.0) discard;
    // Sphere impostor: fake a normal from the sprite and light it from the top left.
    vec3 n = vec3(uv.x, -uv.y, sqrt(1.0 - r2));
    float light = clamp(dot(n, normalize(vec3(-0.5, 0.7, 0.6))), 0.0, 1.0);
    vec3 col = mix(uDark, uLit, light * (0.75 + 0.35 * vShade));
    // A few grains catch a glint.
    col += step(0.985, vShade) * pow(light, 6.0) * 0.8;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Points inside the glyph, centred, x/y in [-0.5, 0.5].
const sampleGlyph = (path: string) => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(size / 24, size / 24);
  ctx.fill(new Path2D(path));
  const data = ctx.getImageData(0, 0, size, size).data;
  const out: number[] = [];
  let guard = 0;
  while (out.length < COUNT * 3 && guard++ < COUNT * 400) {
    const x = Math.random();
    const y = Math.random();
    if (data[(((y * size) | 0) * size + ((x * size) | 0)) * 4 + 3] < 128) continue;
    out.push(x - 0.5, 0.5 - y, (Math.random() * 2 - 1) * DEPTH);
  }
  // Always exactly COUNT points, so every logo pairs up point for point.
  while (out.length < COUNT * 3) out.push(...out.slice(0, 3));
  return new Float32Array(out);
};

// Builds the scene into `host` and runs it; returns the cleanup. Kept outside the component
// so the per-point randomness is plainly effect-time work, not render.
function mountCloud(
  link: HTMLAnchorElement,
  host: HTMLSpanElement,
  names: ParticleIcon[],
  variant: "dark" | "light",
  hoverRef: { current: boolean },
  onActive: (index: number) => void,
  loop: boolean,
) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "absolute inset-0 size-full";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
  camera.position.z = 3.1; // logo fills ~60% of the canvas, leaving room for the burst

  const logos = names.map((name) => sampleGlyph(ICONS[name].path));
  while (logos.length < 3) logos.push(logos[0]);
  const positions = logos[0];
  const n = COUNT;
  const dirs = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  const shades = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // Burst direction: mostly outward from the centre, with some scatter in depth.
    const v = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2] * 2)
      .add(new THREE.Vector3().randomDirection().multiplyScalar(0.35))
      .normalize();
    dirs.set([v.x, v.y, v.z], i * 3);
    sizes[i] = 0.018 + Math.random() * 0.016;
    shades[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  logos.forEach((logo, i) => geometry.setAttribute(`aPos${i}`, new THREE.BufferAttribute(logo, 3)));
  geometry.setAttribute("aDir", new THREE.BufferAttribute(dirs, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aShade", new THREE.BufferAttribute(shades, 1));

  const uniforms = {
    uBurst: { value: 0 },
    uFrom: { value: new THREE.Vector3(1, 0, 0) },
    uTo: { value: new THREE.Vector3(0, 1, 0) },
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uPx: { value: 1 },
    // Grains: pale on the dark pill, graphite on the light one.
    uLit: { value: variant === "dark" ? new THREE.Vector3(0.95, 0.96, 0.98) : new THREE.Vector3(0.62, 0.64, 0.68) },
    uDark: { value: variant === "dark" ? new THREE.Vector3(0.38, 0.4, 0.45) : new THREE.Vector3(0.08, 0.09, 0.11) },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // positions move in the shader
  scene.add(points);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, loop ? 16 : 2); // recordings shoot close up at up to 16x
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    // Point size in world units → pixels at this canvas height.
    uniforms.uPx.value = (height * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Pointer tilt, relative to the whole button.
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    const r = link.getBoundingClientRect();
    tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 2 * TILT;
    tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 2 * TILT;
  };
  const onLeave = () => (tilt.tx = tilt.ty = 0);
  link.addEventListener("pointermove", onMove);
  link.addEventListener("pointerleave", onLeave);

  const burst = { x: 0, v: 0 };
  let wasHover = false;
  let spinStart = -Infinity; // time the hover spin began
  let cycle = 0;
  let shown = 0;
  const slot = (i: number) => new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    // Kick the spring on hover-in so it overshoots outward, then settles slightly open.
    const isHover = hoverRef.current && !still;
    // Hover-in starts one full turn (if the last one has finished) and opens the cloud a touch.
    if (isHover && !wasHover && t - spinStart > SPIN) spinStart = t;
    wasHover = isHover;
    const target = isHover ? 0.04 : 0;
    burst.v += ((target - burst.x) * BURST.stiffness - burst.v * BURST.damping) * dt;
    burst.x += burst.v * dt;
    uniforms.uBurst.value = Math.max(0, burst.x);
    // Loop mode runs on its own clock so everything repeats over one full logo cycle.
    const period = names.length * (HOLD + MORPH);
    const lt = loop ? cycle % period : t;
    uniforms.uTime.value = still ? 0 : lt;

    // Logo cycle, paused while hovered.
    if (names.length > 1) {
      if (!hoverRef.current || loop) cycle += dt;
      const step = HOLD + MORPH;
      const i = Math.floor(cycle / step);
      const local = cycle - i * step;
      const morph = still ? (local > HOLD ? 1 : 0) : Math.min(1, Math.max(0, (local - HOLD) / MORPH));
      const from = i % names.length;
      const to = (i + 1) % names.length;
      uniforms.uFrom.value.copy(slot(from));
      uniforms.uTo.value.copy(slot(to));
      uniforms.uMorph.value = morph;
      const label = morph > 0.45 ? to : from;
      if (label !== shown) onActive((shown = label));
    }

    const k = 1 - Math.exp(-8 * dt);
    tilt.x += (tilt.tx - tilt.x) * k;
    tilt.y += (tilt.ty - tilt.y) * k;
    // Loop mode: a slow periodic sway and tilt instead of the pointer, and a spin partway
    // through every logo's hold instead of hover.
    const w = (Math.PI * 2) / period;
    if (loop) {
      tilt.x = 0.16 * Math.sin(2 * w * lt);
      tilt.y = 0.22 * Math.sin(w * lt + 0.6);
    }
    const idle = still || loop ? 0 : Math.sin(t * 0.8) * 0.25;
    // easeInOutCubic over SPIN seconds: winds up, whips round, settles.
    const local = cycle % (HOLD + MORPH);
    const sp = loop
      ? Math.min(1, Math.max(0, (local - 0.6) / SPIN))
      : Math.min(1, Math.max(0, (t - spinStart) / SPIN));
    const spin = (sp < 0.5 ? 4 * sp ** 3 : 1 - (-2 * sp + 2) ** 3 / 2) * Math.PI * 2;
    points.rotation.set(tilt.x, idle + tilt.y + (sp < 1 ? spin : 0), 0);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    link.removeEventListener("pointermove", onMove);
    link.removeEventListener("pointerleave", onLeave);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

const ALL: ParticleIcon[] = ["x", "discord", "reddit"];

export default function ParticleSocialButton({
  icons = ALL,
  variant = "dark",
  loop = false,
}: {
  /** Logos to cycle through, up to three. One logo means no cycling. */
  icons?: ParticleIcon[];
  variant?: "dark" | "light";
  /** Recording mode: drives tilt and spin from a periodic script instead of the pointer. */
  loop?: boolean;
}) {
  const list = icons.slice(0, 3);
  const listKey = list.join(",");
  const [active, setActive] = useState(0);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [widths, setWidths] = useState<number[]>([]);

  // Measure every label so the pill can glide to the active one's width.
  useLayoutEffect(() => {
    const measure = () => setWidths(labelRefs.current.map((el) => el?.offsetWidth ?? 0));
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [listKey]);
  const canvasHostRef = useRef<HTMLSpanElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    const link = linkRef.current;
    const host = canvasHostRef.current;
    if (!link || !host) return;
    return mountCloud(link, host, listKey.split(",") as ParticleIcon[], variant, hoverRef, setActive, loop);
  }, [variant, listKey, loop]);

  const dark = variant === "dark";
  const overlay = "pointer-events-none absolute inset-0 rounded-full";
  return (
    <a
      ref={linkRef}
      href={ICONS[list[active]].href}
      target="_blank"
      rel="noreferrer"
      onPointerEnter={() => (hoverRef.current = true)}
      onPointerLeave={() => (hoverRef.current = false)}
      onFocus={() => (hoverRef.current = true)}
      onBlur={() => (hoverRef.current = false)}
      className={`group relative inline-flex h-14 items-center rounded-full pr-6 pl-1 text-[15px] tracking-[-0.01em] backdrop-blur-[6px] outline-none select-none transition-[scale] duration-200 active:scale-[0.99] active:duration-[50ms] focus-visible:ring-2 focus-visible:ring-black/20 ${
        dark ? "text-white/90" : "text-[#050505]/80"
      }`}
    >
      {/* Layered like a real glass pill: tinted fill with a long soft shadow, top gloss,
          a dark centre vignette, then a 1px gradient rim. */}
      <span
        aria-hidden
        className={`${overlay} transition-all duration-200 ${
          dark
            ? "bg-black/56 shadow-[inset_0_-12px_16px_rgba(255,255,255,0.06),inset_0_4px_16px_rgba(255,255,255,0.16),inset_0_0.75px_0.25px_rgba(255,255,255,0.12),inset_0_0.25px_0.25px_rgba(255,255,255,0.32),0_40px_24px_rgba(0,0,0,0.06),0_23px_14px_rgba(0,0,0,0.08),0_10px_10px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.19),0_0_0_0.75px_rgba(0,0,0,0.56)] group-hover:shadow-[inset_0_-12px_16px_rgba(255,255,255,0.06),inset_0_4px_16px_rgba(255,255,255,0.16),inset_0_0.75px_0.25px_rgba(255,255,255,0.12),inset_0_0.25px_0.25px_rgba(255,255,255,0.32),0_40px_24px_rgba(0,0,0,0.08),0_23px_14px_rgba(0,0,0,0.1),0_10px_10px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.19),0_0_0_0.75px_rgba(0,0,0,0.56)]"
            : "bg-white/90 shadow-[inset_0_-12px_16px_rgba(255,255,255,0.06),inset_0_4px_16px_rgba(255,255,255,0.16),inset_0_0.75px_0.25px_rgba(255,255,255,0.12),inset_0_0.25px_0.25px_rgba(255,255,255,0.32),0_40px_24px_rgba(0,0,0,0.02),0_23px_14px_rgba(0,0,0,0.02),0_10px_10px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.05)] group-hover:shadow-[inset_0_-12px_16px_rgba(255,255,255,0.06),inset_0_4px_16px_rgba(255,255,255,0.16),inset_0_0.75px_0.25px_rgba(255,255,255,0.12),inset_0_0.25px_0.25px_rgba(255,255,255,0.32),0_40px_24px_rgba(0,0,0,0.04),0_23px_14px_rgba(0,0,0,0.04),0_10px_10px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.06)]"
        }`}
      />
      {!dark && <span aria-hidden className={`${overlay} bg-black/[0.06]`} />}
      <span
        aria-hidden
        className={`${overlay} bg-linear-to-b from-white to-white/0 transition-opacity duration-200 group-active:opacity-0 group-active:duration-[50ms] ${
          dark ? "opacity-12 group-hover:opacity-16" : "opacity-32 group-hover:opacity-44"
        }`}
      />
      <span
        aria-hidden
        className={`${overlay} bg-[radial-gradient(65.62%_65.62%,#000_0%,transparent_100%)] transition-opacity duration-200 group-active:duration-[50ms] ${
          dark ? "opacity-32 group-active:opacity-44" : "opacity-[0.08] group-active:opacity-[0.14]"
        }`}
      />
      <span
        aria-hidden
        className={`${overlay} bg-[linear-gradient(#fff_0%,#999_55%,#fff_80%,#999_95%)] p-px ${dark ? "opacity-24" : "opacity-60"}`}
        style={{
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <span ref={canvasHostRef} aria-hidden className="relative size-12 shrink-0" />
      {/* Labels share one grid cell; the cell's width glides to the active label, so the pill
          resizes with the text while the new label rolls in from below. */}
      <span
        className="relative grid pl-1 transition-[width] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] box-content"
        style={widths[active] ? { width: widths[active] } : undefined}
      >
        {list.map((name, i) => (
          <span
            key={name}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            aria-hidden={i !== active}
            className={`col-start-1 row-start-1 w-max whitespace-nowrap transition-[opacity,translate,filter] duration-300 ease-out ${
              i === active ? "translate-y-0 opacity-100 blur-0" : i === (active + list.length - 1) % list.length ? "-translate-y-2 opacity-0 blur-[3px]" : "translate-y-2 opacity-0 blur-[3px]"
            }`}
          >
            {ICONS[name].label}
          </span>
        ))}
      </span>
    </a>
  );
}
