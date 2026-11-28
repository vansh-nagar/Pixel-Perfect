"use client";

/**
 * A chart card drawn as a cloud of tiny shaded grains that morphs between line, bar, area and
 * donut views, and drills into any month: click it and every grain re-forms as that month's
 * daily bars.
 *
 * How it works:
 *  - Every grain gets a fixed random (u, v). u is sampled so each month owns a share of grains
 *    proportional to its value; that makes bars, area and donut slices evenly dense. Each view
 *    is just a different mapping of (u, v) to a position, so grain i keeps the same month in
 *    every view and the morph reads as data moving, not noise.
 *  - The five layouts (four views plus the drilled-in month) live on the GPU as attributes; a
 *    morph is a per-grain mix in the vertex shader, staggered by u so it sweeps across the
 *    chart, landing on a spring. Only the detail layout is rewritten, once per drill.
 *  - Grains are sphere impostors (lit round sprites). Hovering a month or day puffs its grains
 *    out on a spring and dims the rest; the latest month carries the accent colour.
 */

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DATA = [18, 24, 21, 29, 26, 34, 31, 38, 35, 44, 41, 52]; // $k per month
const YEAR = 2026;
const N = DATA.length;
const TOTAL = DATA.reduce((a, b) => a + b, 0);
const MAX = Math.max(...DATA) * 1.08;
const VIEWS = ["Line", "Bar", "Area", "Donut"] as const;
export type ChartView = (typeof VIEWS)[number];
const DETAIL = 4; // layout slot for the drilled-in month
const H = 31; // most hover targets in any layout (days in a month)

const COUNT = 4200;
const MORPH = 1.25; // seconds per morph, including the spring settle
const HOVER = { stiffness: 260, damping: 16 }; // per-item hover spring
const AUTO = 3.2; // seconds per view while auto-playing
const PAD_X = 0.06; // world units of side padding (world height is 1)
const BASE = -0.42; // baseline y
const TOP = 0.42; // y of the scale max
const R0 = 0.24; // donut inner radius
const R1 = 0.42; // donut outer radius
const GAP = 0.007; // donut gap between slices, as a fraction of the circle

// Daily revenue per month: deterministic noise with a weekend dip, scaled to the month total.
const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const DAYS = DATA.map((total, k) => {
  const rand = mulberry(k * 7919 + 13);
  const count = new Date(YEAR, k + 1, 0).getDate();
  const raw = Array.from({ length: count }, (_, d) => {
    const dow = new Date(YEAR, k, d + 1).getDay();
    return (
      (0.65 + 0.7 * rand()) *
      (dow === 0 || dow === 6 ? 0.62 : 1) *
      (1 + (d / count) * 0.25)
    );
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((r) => (r / sum) * total);
});

const ymap = (value: number, max = MAX) => BASE + (value / max) * (TOP - BASE);
const cumOf = (values: number[]) => {
  const total = values.reduce((a, b) => a + b, 0);
  return values.reduce<number[]>(
    (acc, v) => [...acc, acc[acc.length - 1] + v / total],
    [0],
  );
};
const indexAt = (cum: number[], c: number) => {
  for (let k = 0; k < cum.length - 1; k++) if (c < cum[k + 1]) return k;
  return cum.length - 2;
};
const CUM = cumOf(DATA);

// Straight-line value between month centres; xs is in month units, month k centred at k + 0.5.
const lerpAt = (xs: number) => {
  const x = Math.min(N - 1, Math.max(0, xs - 0.5));
  const k = Math.min(N - 2, Math.floor(x));
  return DATA[k] + (DATA[k + 1] - DATA[k]) * (x - k);
};
const MARK = 0.2; // share of each month's grains that form its dot on the line

export type ChartTheme = "light" | "dark";
// Grain colours per theme (linear-ish RGB 0..1) and the card colour dimmed grains fade toward.
const GRAINS = {
  light: {
    lit: [0.62, 0.64, 0.68],
    dark: [0.08, 0.09, 0.11],
    accentLit: [1.0, 0.55, 0.4],
    accentDark: [0.75, 0.16, 0.06],
    card: [0.93, 0.93, 0.93],
  },
  dark: {
    lit: [0.6, 0.64, 0.98],
    dark: [0.15, 0.17, 0.44],
    accentLit: [1.0, 1.0, 1.0],
    accentDark: [0.55, 0.62, 1.0],
    card: [0.07, 0.08, 0.3],
  },
} satisfies Record<ChartTheme, Record<string, [number, number, number]>>;
// UI colours per theme, read by the Tailwind classes through CSS variables.
const UI = {
  light: {
    "--ink": "#050505",
    "--card": "#ffffff",
    "--pill": "#ffffff",
    "--accent": "#c2410c",
    "--edge": "rgba(0,0,0,0.06)",
  },
  dark: {
    "--ink": "#eef0ff",
    "--card": "#10124a",
    "--pill": "#2b2f86",
    "--accent": "#a9b3ff",
    "--edge": "rgba(255,255,255,0.08)",
  },
};

const vertexShader = /* glsl */ `
  attribute vec3 aPos0;
  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aPos3;
  attribute vec3 aPos4;
  attribute vec2 aDir;
  attribute float aU;
  attribute float aK;   // month
  attribute float aDay; // day inside the drilled-in month
  attribute float aSize;
  attribute float aShade;
  uniform float uFrom;  // layout index we're leaving
  uniform float uTo;    // layout index we're heading to
  uniform float uW;     // cartesian chart width; the donut isn't stretched
  uniform float uMorph;
  uniform float uTime;
  uniform float uPx;
  uniform float uHi[${H}];  // per-item hover spring (overshoots past 1 on the way in)
  uniform float uHoverOn;  // 0..1, eased: is anything hovered
  varying float vShade;
  varying float vHi;
  varying float vAccent;
  vec3 pick(float i) {
    vec3 p = i < 0.5 ? aPos0 : i < 1.5 ? aPos1 : i < 2.5 ? aPos2 : i < 3.5 ? aPos3 : aPos4;
    p.x *= (i > 2.5 && i < 3.5) ? 1.0 : uW;
    return p;
  }
  // Only the latest month is accented, and only in the year views.
  float accent(float i) { return i > 3.5 ? 0.0 : step(${N - 1}.0 - 0.5, aK); }
  // Underdamped spring step response: rises fast, overshoots ~12%, settles by t = 1.
  float spring(float t) {
    float k = 8.0, w = 12.0;
    return 1.0 - exp(-k * t) * (cos(w * t) + (k / w) * sin(w * t));
  }
  void main() {
    // Sweep left to right: each grain leaves a little after the one before it. It eases out
    // of its old spot, then lands on a spring so it overshoots and settles into the new one.
    float t = clamp(uMorph * 1.7 - aU * 0.55 - aShade * 0.15, 0.0, 1.0);
    float e = spring(t * t * (3.0 - 2.0 * t) * 0.35 + t * 0.65);
    vec3 p = mix(pick(uFrom), pick(uTo), e);
    // Mid-flight the grains loosen into a soft cloud, then tighten as they land.
    float flight = sin(3.14159 * clamp(t * 1.15, 0.0, 1.0));
    p.xy += aDir * flight * (0.025 + aShade * 0.05);
    p.z += flight * (aShade - 0.5) * 0.25;
    p.xy += 0.0025 * vec2(sin(uTime * 1.6 + aShade * 40.0), cos(uTime * 1.2 + aShade * 70.0));
    float hi = uHi[int((uTo > 3.5 ? aDay : aK) + 0.5)];
    // The hovered item puffs outward along each grain's own direction and lifts toward you.
    p.xy += aDir * hi * (0.004 + aShade * 0.01);
    p.z += hi * 0.06;
    vHi = mix(1.0, mix(0.35, 1.25, clamp(hi, 0.0, 1.0)), uHoverOn);
    vAccent = mix(accent(uFrom), accent(uTo), clamp(e, 0.0, 1.0));
    vShade = aShade;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPx * (1.0 + 0.15 * hi);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLit;
  uniform vec3 uDark;
  uniform vec3 uAccentLit;
  uniform vec3 uAccentDark;
  uniform vec3 uCard; // what dimmed grains fade toward
  varying float vShade;
  varying float vHi;
  varying float vAccent;
  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(uv, uv);
    if (r2 > 1.0) discard;
    vec3 n = vec3(uv.x, -uv.y, sqrt(1.0 - r2));
    float light = clamp(dot(n, normalize(vec3(-0.5, 0.7, 0.6))), 0.0, 1.0);
    float l = light * (0.75 + 0.35 * vShade);
    vec3 col = mix(mix(uDark, uLit, l), mix(uAccentDark, uAccentLit, l), vAccent);
    // Hover: lift the hovered item toward its lit colour, fade the rest toward the card.
    col = mix(uCard, col, clamp(vHi, 0.0, 1.0)) + max(vHi - 1.0, 0.0) * 0.4 * light;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// The four year layouts in normalised space. Cartesian x is in [-0.5, 0.5] and gets stretched
// to the chart width in the shader; donut x/y are plain world units.
function buildLayouts() {
  const line = new Float32Array(COUNT * 3);
  const bar = new Float32Array(COUNT * 3);
  const area = new Float32Array(COUNT * 3);
  const donut = new Float32Array(COUNT * 3);
  const us = new Float32Array(COUNT);
  const vs = new Float32Array(COUNT);
  const zs = new Float32Array(COUNT);
  const ks = new Float32Array(COUNT);
  const dirs = new Float32Array(COUNT * 2);
  const sizes = new Float32Array(COUNT);
  const shades = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const u = Math.random();
    const v = Math.random();
    const z = (Math.random() - 0.5) * 0.03;
    // u → month k and position inside it, weighted by value.
    const k = indexAt(CUM, u);
    const frac = (u - CUM[k]) / (CUM[k + 1] - CUM[k]);
    const s = k + frac;

    // Line and area run centre to centre through each month's value with straight segments.
    // A fifth of each month's grains form a dot on its value, so it reads as a real line chart.
    const xs = 0.5 + (s * (N - 1)) / N;
    if (v < MARK) {
      const r = Math.sqrt(v / MARK) * 0.022;
      const a = frac * Math.PI * 2 * 7;
      line.set(
        [
          (k + 0.5) / N - 0.5 + (Math.cos(a) * r) / 2,
          ymap(DATA[k]) + Math.sin(a) * r,
          z,
        ],
        i * 3,
      );
    } else {
      line.set(
        [
          xs / N - 0.5,
          ymap(lerpAt(xs)) + ((v - MARK) / (1 - MARK) - 0.5) * 0.014,
          z,
        ],
        i * 3,
      );
    }
    area.set([xs / N - 0.5, BASE + v * (ymap(lerpAt(xs)) - BASE), z], i * 3);
    bar.set(
      [
        (k + 0.5 + (frac - 0.5) * 0.62) / N - 0.5,
        BASE + v * (ymap(DATA[k]) - BASE),
        z,
      ],
      i * 3,
    );
    const c = CUM[k] + GAP / 2 + frac * (CUM[k + 1] - CUM[k] - GAP);
    const ang = c * Math.PI * 2;
    const r = Math.sqrt(R0 * R0 + v * (R1 * R1 - R0 * R0));
    donut.set([Math.sin(ang) * r, Math.cos(ang) * r, z], i * 3);

    us[i] = u;
    vs[i] = v;
    zs[i] = z;
    ks[i] = k;
    const d = Math.random() * Math.PI * 2;
    dirs.set([Math.cos(d), Math.sin(d)], i * 2);
    sizes[i] = 0.011 + Math.random() * 0.009;
    shades[i] = Math.random();
  }
  return {
    layouts: [line, bar, area, donut],
    us,
    vs,
    zs,
    ks,
    dirs,
    sizes,
    shades,
  };
}

// Daily bars for month k, using the same (u, v) so the drill sweeps in left to right.
function fillDetail(
  k: number,
  out: Float32Array,
  days: Float32Array,
  us: Float32Array,
  vs: Float32Array,
  zs: Float32Array,
) {
  const values = DAYS[k];
  const n = values.length;
  const cum = cumOf(values);
  const max = Math.max(...values) * 1.08;
  for (let i = 0; i < COUNT; i++) {
    const d = indexAt(cum, us[i]);
    const frac = (us[i] - cum[d]) / (cum[d + 1] - cum[d]);
    out.set(
      [
        (d + 0.5 + (frac - 0.5) * 0.66) / n - 0.5,
        BASE + vs[i] * (ymap(values[d], max) - BASE),
        zs[i],
      ],
      i * 3,
    );
    days[i] = d;
  }
}

type Cloud = { setView: (i: number, month?: number) => void };

function mountChart(
  host: HTMLDivElement,
  initial: number,
  onHover: (index: number) => void,
  onPick: (month: number) => void,
  onSize: (w: number, h: number) => void,
  theme: ChartTheme,
): Cloud & { dispose: () => void } {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "absolute inset-0 size-full";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, -10, 10);

  const { layouts, us, vs, zs, ks, dirs, sizes, shades } = buildLayouts();
  const detail = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
  const days = new THREE.BufferAttribute(new Float32Array(COUNT), 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(layouts[0], 3));
  layouts.forEach((l, i) =>
    geometry.setAttribute(`aPos${i}`, new THREE.BufferAttribute(l, 3)),
  );
  geometry.setAttribute(`aPos${DETAIL}`, detail);
  geometry.setAttribute("aDay", days);
  geometry.setAttribute("aU", new THREE.BufferAttribute(us, 1));
  geometry.setAttribute("aK", new THREE.BufferAttribute(ks, 1));
  geometry.setAttribute("aDir", new THREE.BufferAttribute(dirs, 2));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aShade", new THREE.BufferAttribute(shades, 1));

  const uniforms = {
    uFrom: { value: initial },
    uTo: { value: initial },
    uW: { value: 1 },
    uMorph: { value: 1 },
    uTime: { value: 0 },
    uPx: { value: 1 },
    uHi: { value: new Array<number>(H).fill(0) },
    uHoverOn: { value: 0 },
    uLit: { value: new THREE.Vector3(...GRAINS[theme].lit) },
    uDark: { value: new THREE.Vector3(...GRAINS[theme].dark) },
    uAccentLit: { value: new THREE.Vector3(...GRAINS[theme].accentLit) },
    uAccentDark: { value: new THREE.Vector3(...GRAINS[theme].accentDark) },
    uCard: { value: new THREE.Vector3(...GRAINS[theme].card) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  let aspect = 2;
  let width = 1; // cartesian chart width in world units
  const resize = () => {
    // Layout size, not the on-screen box: a 3D-rotated or scaled parent (like a laptop lid
    // opening) would otherwise squash the canvas and the grain size.
    const r = { width: host.clientWidth, height: host.clientHeight };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(r.width, r.height, false);
    aspect = r.width / Math.max(1, r.height);
    camera.left = -aspect / 2;
    camera.right = aspect / 2;
    camera.updateProjectionMatrix();
    width = aspect - PAD_X * 2;
    uniforms.uW.value = width;
    uniforms.uPx.value = r.height * dpr;
    onSize(r.width, r.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Morph queue: a new target waits for the current morph to land so grains never jump.
  let from = initial;
  let to = initial;
  let month = -1; // drilled-in month, while to === DETAIL
  let pending: { i: number; month: number } | null = null;
  let morph = 1;

  // Hover: map the pointer to a month, or to a day when drilled in.
  let hovered = -1;
  const setHover = (index: number) => {
    host.style.cursor = index >= 0 && to !== DETAIL ? "pointer" : "crosshair";
    if (index === hovered) return;
    hovered = index;
    onHover(index);
  };
  const onMove = (e: PointerEvent) => {
    if (morph < 1) return setHover(-1);
    const r = host.getBoundingClientRect();
    // The on-screen box can be scaled; world units are relative to its height either way.
    const x = (e.clientX - r.left) / r.height - aspect / 2;
    const y = 0.5 - (e.clientY - r.top) / r.height;
    if (to === 3) {
      const d = Math.hypot(x, y);
      if (d < R0 - 0.04 || d > R1 + 0.04) return setHover(-1);
      return setHover(indexAt(CUM, (Math.atan2(x, y) / (Math.PI * 2) + 1) % 1));
    }
    const xn = x / width + 0.5;
    const n = to === DETAIL ? DAYS[month].length : N;
    setHover(xn < 0 || xn >= 1 ? -1 : Math.floor(xn * n));
  };
  const onLeave = () => setHover(-1);
  const onClick = () => {
    if (to !== DETAIL && morph === 1 && hovered >= 0) onPick(hovered);
  };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("click", onClick);

  const setView = (i: number, m = -1) => {
    if (morph < 1) {
      pending = { i, month: m };
      return;
    }
    if (i === to && (i !== DETAIL || m === month)) return;
    if (i === DETAIL) {
      // Safe to rewrite: the detail slot is never the layout we're leaving.
      fillDetail(
        m,
        detail.array as Float32Array,
        days.array as Float32Array,
        us,
        vs,
        zs,
      );
      detail.needsUpdate = true;
      days.needsUpdate = true;
    }
    from = to;
    to = i;
    month = m;
    morph = still ? 1 : 0;
    setHover(-1);
  };

  const hoverVel = new Array<number>(H).fill(0);
  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (morph < 1) {
      morph = Math.min(1, morph + dt / MORPH);
      if (morph === 1 && pending) {
        const next = pending;
        pending = null;
        setView(next.i, next.month);
      }
    }
    uniforms.uFrom.value = from;
    uniforms.uTo.value = to;
    uniforms.uMorph.value = morph;
    uniforms.uTime.value = still ? 0 : now / 1000;
    // One spring per item so a hover puffs in with a little overshoot and eases back out,
    // and sliding across items hands off smoothly instead of popping.
    const hi = uniforms.uHi.value;
    for (let k = 0; k < H; k++) {
      const target = k === hovered ? 1 : 0;
      if (still) hi[k] = target;
      else {
        hoverVel[k] +=
          ((target - hi[k]) * HOVER.stiffness - hoverVel[k] * HOVER.damping) *
          dt;
        hi[k] += hoverVel[k] * dt;
      }
    }
    const on = hovered >= 0 ? 1 : 0;
    uniforms.uHoverOn.value +=
      (on - uniforms.uHoverOn.value) * (still ? 1 : 1 - Math.exp(-12 * dt));
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return {
    setView,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("click", onClick);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

// Swaps text with a short roll: the old value lifts out and blurs while the new one rises in.
function Roll({
  k,
  dir = 1,
  className,
  children,
}: {
  k: string;
  dir?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`relative inline-grid ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={k}
          className="col-start-1 row-start-1 whitespace-nowrap"
          initial={{ y: 8 * dir, opacity: 0, filter: "blur(3px)" }}
          animate={{
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            transitionEnd: { filter: "none" },
          }}
          exit={{ y: -8 * dir, opacity: 0, filter: "blur(3px)" }}
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// "$" and "k" stay put; only the number rolls.
function Money({ value, className }: { value: number; className?: string }) {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <span
      className={`inline-flex items-baseline tabular-nums ${className ?? ""}`}
    >
      $<Roll k={text}>{text}</Roll>k
    </span>
  );
}

const weekday = (k: number, d: number) =>
  new Date(YEAR, k, d + 1).toLocaleDateString("en-US", { weekday: "long" });

export default function ParticleChart({
  autoPlay = true,
  radius = 22,
  theme = "light",
}: {
  autoPlay?: boolean;
  /** Card corner radius in px, so it can nest concentrically inside a window. */
  radius?: number;
  /** Light card, or a navy card for dark/blue surroundings. */
  theme?: ChartTheme;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<Cloud | null>(null);
  const viewRef = useRef(0);
  const [view, setViewState] = useState(0);
  const [drill, setDrill] = useState(-1); // month we're inside, or -1 for the year
  const [hover, setHover] = useState(-1); // month, or day when drilled in
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [auto, setAuto] = useState(autoPlay);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const cloud = mountChart(
      host,
      viewRef.current,
      setHover,
      (m) => {
        setAuto(false);
        setHover(-1);
        setDrill(m);
        cloudRef.current?.setView(DETAIL, m);
      },
      (w, h) => setSize({ w, h }),
      theme,
    );
    cloudRef.current = cloud;
    return () => {
      cloud.dispose();
      cloudRef.current = null;
    };
  }, [theme]);

  const go = (i: number) => {
    viewRef.current = i;
    setViewState(i);
    cloudRef.current?.setView(i);
  };
  const back = () => {
    setHover(-1);
    setDrill(-1);
    cloudRef.current?.setView(viewRef.current);
  };

  // Esc climbs back out of a month.
  useEffect(() => {
    if (drill < 0) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && back();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drill]);

  // Auto-play through the views until the user picks one; pause while hovering.
  useEffect(() => {
    if (!auto || hover >= 0 || drill >= 0) return;
    const id = window.setTimeout(
      () => go((viewRef.current + 1) % VIEWS.length),
      AUTO * 1000,
    );
    return () => window.clearTimeout(id);
  }, [auto, hover, view, drill]);

  const inside = drill >= 0;
  const donut = view === 3 && !inside;
  const chartW = size.h ? size.w - PAD_X * 2 * size.h : 0;
  const dayCount = inside ? DAYS[drill].length : 0;

  // Header copy for each state: year, hovered month, inside a month, hovered day.
  const label = inside
    ? hover >= 0
      ? `${MONTHS[drill]} ${hover + 1}`
      : `${MONTHS[drill]} revenue`
    : hover >= 0
      ? `${MONTHS[hover]} revenue`
      : "Revenue this year";
  const value = inside
    ? hover >= 0
      ? DAYS[drill][hover]
      : DATA[drill]
    : hover >= 0
      ? DATA[hover]
      : TOTAL;
  const sub = inside
    ? hover >= 0
      ? weekday(drill, hover)
      : `${dayCount} days · avg $${(DATA[drill] / dayCount).toFixed(1)}k a day`
    : hover >= 0
      ? `${((DATA[hover] / TOTAL) * 100).toFixed(1)}% of year · click for days`
      : "+12.4% vs last year";
  const accentSub = !inside && (hover < 0 || hover === N - 1);

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{ borderRadius: radius, ...UI[theme] } as React.CSSProperties}
        className="relative w-full max-w-[560px] bg-(--card) p-5 text-(--ink) shadow-[0_40px_24px_rgba(0,0,0,0.02),0_23px_14px_rgba(0,0,0,0.03),0_10px_10px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_0_0_1px_var(--edge)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[13px] text-(--ink)/50">
              <AnimatePresence initial={false}>
                {inside && (
                  <motion.button
                    type="button"
                    onClick={back}
                    initial={{ opacity: 0, x: -6, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "auto" }}
                    exit={{ opacity: 0, x: -6, width: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-(--ink)/70 hover:text-(--ink)"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M7.5 2.5 4 6l3.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {YEAR}
                    <span className="text-(--ink)/25">/</span>
                  </motion.button>
                )}
              </AnimatePresence>
              <Roll k={label}>{label}</Roll>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <Money
                value={value}
                className="text-[28px] font-medium tracking-[-0.03em]"
              />
              <Roll
                k={sub}
                className={`text-[13px] tabular-nums ${accentSub ? "text-(--accent)" : "text-(--ink)/40"}`}
              >
                {sub}
              </Roll>
            </div>
          </div>
          <div
            className={`relative flex shrink-0 rounded-full bg-(--ink)/[0.05] p-0.5 text-[13px] transition-opacity duration-300 ${
              inside ? "pointer-events-none opacity-30" : ""
            }`}
          >
            {VIEWS.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setAuto(false);
                  go(i);
                }}
                className={`relative rounded-full px-3 py-1.5 transition-colors duration-200 active:scale-[0.97] ${
                  i === view
                    ? "text-(--ink)"
                    : "text-(--ink)/50 hover:text-(--ink)/80"
                }`}
              >
                {/* One shared pill that springs from tab to tab. */}
                {i === view && (
                  <motion.span
                    layoutId="particle-chart-tab"
                    className="absolute inset-0 rounded-full bg-(--pill) shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_var(--edge)]"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                      mass: 0.8,
                    }}
                  />
                )}
                <span className="relative">{name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4 h-[240px]">
          {/* Gridlines and labels sit under the cloud and fade out for the donut. */}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${donut ? "opacity-0" : "opacity-100"}`}
          >
            {[0, 1 / 3, 2 / 3, 1].map((f) => (
              <div
                key={f}
                className={`absolute inset-x-0 h-px ${f === 0 ? "bg-(--ink)/10" : "border-t border-dashed border-(--ink)/[0.07]"}`}
                style={{ top: `${(0.5 - (BASE + f * (TOP - BASE))) * 100}%` }}
              />
            ))}
          </div>
          <div
            className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500 ${donut ? "opacity-100 delay-300" : "opacity-0"}`}
          >
            <div className="flex flex-col items-center">
              <Roll k={`c${hover}`} className="text-[12px] text-(--ink)/45">
                {hover >= 0 && !inside ? MONTHS[hover] : "Total"}
              </Roll>
              <Money
                value={!inside && hover >= 0 ? DATA[hover] : TOTAL}
                className="text-[20px] font-medium tracking-[-0.02em]"
              />
            </div>
          </div>
          <div
            ref={hostRef}
            className="absolute inset-0 cursor-crosshair touch-none"
          />
        </div>

        <div
          className={`relative mt-1 h-4 text-[11px] text-(--ink)/40 transition-opacity duration-500 ${donut ? "opacity-0" : "opacity-100"}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={inside ? `d${drill}` : "months"}
              className="absolute inset-0"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {chartW > 0 &&
                (inside
                  ? [0, 7, 14, 21, 28].map((d) => (
                      <span
                        key={d}
                        className={`absolute -translate-x-1/2 tabular-nums transition-colors ${d === hover ? "text-(--ink)" : ""}`}
                        style={{
                          left:
                            size.w / 2 + ((d + 0.5) / dayCount - 0.5) * chartW,
                        }}
                      >
                        {d + 1}
                      </span>
                    ))
                  : MONTHS.map((m, k) => (
                      <span
                        key={m}
                        className={`absolute -translate-x-1/2 tabular-nums transition-colors ${k === hover ? "text-(--ink)" : k === N - 1 ? "text-(--accent)" : ""}`}
                        style={{
                          left: size.w / 2 + ((k + 0.5) / N - 0.5) * chartW,
                        }}
                      >
                        {m}
                      </span>
                    )))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
