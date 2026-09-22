"use client";

/**
 * A field of dots that flies between six generated forms — sphere, torus, helix, knot, cube, wave — on every click, swept around the axis by a staggered GSAP tween.
 */

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export type ParticleShapeName =
  | "sphere"
  | "torus"
  | "helix"
  | "knot"
  | "cube"
  | "wave";

export interface ParticleShapeMorphProps {
  className?: string;
  /** Forms to cycle through, in order. A click advances to the next one. */
  shapes?: ParticleShapeName[];
  /** How many dots make up the form. */
  count?: number;
  /** Seconds one morph takes. */
  duration?: number;
}

const DEFAULT_SHAPES: ParticleShapeName[] = [
  "sphere",
  "torus",
  "helix",
  "knot",
  "cube",
  "wave",
];

const LABELS: Record<ParticleShapeName, string> = {
  sphere: "Lattice sphere",
  torus: "Torus",
  helix: "Double helix",
  knot: "Trefoil knot",
  cube: "Cube lattice",
  wave: "Wave grid",
};

const TAU = Math.PI * 2;
/** Turn by this much between successive points and they never line up into rows. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Fraction of the tween the sweep is spread over: 0 would move every dot at once. */
const STAGGER = 0.45;
/** How far a dot bows off its straight path, as a fraction of how far it travels. */
const BOW = 0.15;
/** Camera distance in scene units. Smaller exaggerates the perspective. */
const FOV = 5;
/** Half the form's size, as a fraction of the shorter canvas edge. */
const FIT = 0.345;
/** Depth is quantised into this many alpha steps so a frame costs that many fills. */
const DEPTH_STEPS = 8;

/* ------------------------------------------------------------------ shapes */
/*
 * Every builder fills `out` with exactly `count` xyz triples in roughly unit
 * space; `normalize` then fits each form to the same box, so no shape reads
 * larger than another and none reaches the canvas edge.
 */

function buildSphere(out: Float32Array, n: number) {
  // Golden-angle (Fibonacci) sphere: even coverage, no crowding at the poles.
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * i + 1) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * GOLDEN;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
}

function buildTorus(out: Float32Array, n: number) {
  // A slim tube: any fatter and the hole closes up under the camera's tilt,
  // which is the one thing that has to stay visible for a torus to read.
  const R = 0.79;
  const r = 0.2;
  // Split the budget so the lattice cells come out roughly square.
  const nv = Math.max(6, Math.round(Math.sqrt((n * r) / R)));
  const nu = Math.max(8, Math.floor(n / nv));
  const grid = nu * nv;
  for (let i = 0; i < n; i++) {
    let u: number;
    let v: number;
    if (i < grid) {
      const a = Math.floor(i / nv);
      // Half-offset every other ring, which staggers the lattice like brickwork.
      u = (a / nu) * TAU;
      v = ((i - a * nv + (a % 2) * 0.5) / nv) * TAU;
    } else {
      u = ((i - grid) / (n - grid)) * TAU;
      v = 0;
    }
    const rad = R + r * Math.cos(v);
    out[i * 3] = rad * Math.cos(u);
    out[i * 3 + 1] = r * Math.sin(v);
    out[i * 3 + 2] = rad * Math.sin(u);
  }
}

function buildHelix(out: Float32Array, n: number) {
  const TURNS = 2.2;
  const RAD = 0.62;
  const H = 1;
  const BARS = 13;
  const strand = Math.floor(n * 0.34);
  const rungs = n - strand * 2;
  const perBar = Math.max(1, Math.floor(rungs / BARS));

  const place = (i: number, t: number, phase: number, mix: number) => {
    const y = -H + 2 * H * t;
    const a = t * TURNS * TAU + phase;
    const x = RAD * Math.cos(a);
    const z = RAD * Math.sin(a);
    // mix 0 sits on one strand, 1 on the other, between them for a rung.
    out[i * 3] = x - 2 * x * mix;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z - 2 * z * mix;
  };

  for (let i = 0; i < strand; i++) place(i, i / (strand - 1 || 1), 0, 0);
  for (let i = 0; i < strand; i++) place(strand + i, i / (strand - 1 || 1), 0, 1);
  for (let j = 0; j < rungs; j++) {
    const bar = Math.min(BARS - 1, Math.floor(j / perBar));
    const inner = j - bar * perBar;
    // Keep rung points strictly inside, so they never double up on a strand.
    place(2 * strand + j, (bar + 0.5) / BARS, 0, (inner + 1) / (perBar + 1));
  }
}

function buildKnot(out: Float32Array, n: number) {
  const TUBE = 0.34;
  /** The (2,3) torus knot: three lobes, each passing through the next. */
  const centre = (t: number, p: Float32Array) => {
    p[0] = Math.sin(t) + 2 * Math.sin(2 * t);
    p[1] = Math.cos(t) - 2 * Math.cos(2 * t);
    p[2] = -Math.sin(3 * t);
  };
  const ring = Math.max(5, Math.round(Math.sqrt(n / 7)));
  const stations = Math.max(8, Math.ceil(n / ring));
  const here = new Float32Array(3);
  const next = new Float32Array(3);
  const tan = new Float32Array(3);
  const nrm = new Float32Array(3);
  const bin = new Float32Array(3);
  let station = -1;
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i / ring);
    if (a !== station) {
      // Sweep a circle along the curve. The frame comes from the tangent and a
      // fixed up vector, which is enough for a closed loop that never runs
      // vertical — no need for a full Frenet frame.
      station = a;
      const t = (a / stations) * TAU;
      centre(t, here);
      centre(t + 1e-3, next);
      let len = Math.hypot(next[0] - here[0], next[1] - here[1], next[2] - here[2]) || 1;
      for (let k = 0; k < 3; k++) tan[k] = (next[k] - here[k]) / len;
      const up = Math.abs(tan[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      nrm[0] = tan[1] * up[2] - tan[2] * up[1];
      nrm[1] = tan[2] * up[0] - tan[0] * up[2];
      nrm[2] = tan[0] * up[1] - tan[1] * up[0];
      len = Math.hypot(nrm[0], nrm[1], nrm[2]) || 1;
      for (let k = 0; k < 3; k++) nrm[k] /= len;
      bin[0] = tan[1] * nrm[2] - tan[2] * nrm[1];
      bin[1] = tan[2] * nrm[0] - tan[0] * nrm[2];
      bin[2] = tan[0] * nrm[1] - tan[1] * nrm[0];
    }
    // Half-offset alternate rings so the tube reads as a weave, not as stripes.
    const v = ((i - a * ring + (a % 2) * 0.5) / ring) * TAU;
    const cs = Math.cos(v) * TUBE;
    const sn = Math.sin(v) * TUBE;
    for (let k = 0; k < 3; k++) out[i * 3 + k] = here[k] + nrm[k] * cs + bin[k] * sn;
  }
}

function buildCube(out: Float32Array, n: number) {
  // Face lattices read as solid panels; the leftovers trace the 12 edges, which
  // is what makes the silhouette snap to a box rather than a cloud.
  const faceBudget = Math.round(n * 0.82);
  const side = Math.max(2, Math.round(Math.sqrt(faceBudget / 6)));
  const grid = side * side * 6;
  const edgePoints = n - grid;
  const write = (i: number, p: number[]) => {
    out[i * 3] = p[0];
    out[i * 3 + 1] = p[1];
    out[i * 3 + 2] = p[2];
  };
  for (let i = 0; i < grid; i++) {
    const face = Math.floor(i / (side * side));
    const cell = i - face * side * side;
    const u = ((Math.floor(cell / side) + 0.5) / side) * 2 - 1;
    const v = (((cell % side) + 0.5) / side) * 2 - 1;
    // Faces come in pairs: 0/1 are ±x, 2/3 are ±y, 4/5 are ±z.
    const axis = face >> 1;
    const s = face & 1 ? -1 : 1;
    write(i, axis === 0 ? [s, u, v] : axis === 1 ? [u, s, v] : [u, v, s]);
  }
  const perEdge = Math.max(1, Math.ceil(edgePoints / 12));
  for (let j = 0; j < edgePoints; j++) {
    const e = j % 12;
    const t = ((Math.floor(j / 12) + 0.5) / perEdge) * 2 - 1;
    // Edges 0-3 run along x, 4-7 along y, 8-11 along z.
    const axis = Math.floor(e / 4);
    const a = e & 1 ? -1 : 1;
    const b = e & 2 ? -1 : 1;
    write(
      grid + j,
      axis === 0 ? [t, a, b] : axis === 1 ? [a, t, b] : [a, b, t],
    );
  }
}

function buildWave(out: Float32Array, n: number) {
  const side = Math.max(2, Math.floor(Math.sqrt(n)));
  const grid = side * side;
  const height = (u: number, v: number) =>
    0.34 * Math.sin(u * Math.PI * 1.5 + v * Math.PI * 0.55) +
    0.12 * Math.sin(v * Math.PI * 2.2);
  for (let i = 0; i < n; i++) {
    let u: number;
    let v: number;
    if (i < grid) {
      u = ((Math.floor(i / side) + 0.5) / side) * 2 - 1;
      v = (((i % side) + 0.5) / side) * 2 - 1;
    } else {
      // Leftovers run the border, so the sheet ends on a clean edge.
      const t = ((i - grid) / (n - grid)) * 4;
      const leg = Math.floor(t);
      const s = (t - leg) * 2 - 1;
      u = leg === 0 ? s : leg === 1 ? 1 : leg === 2 ? -s : -1;
      v = leg === 0 ? -1 : leg === 1 ? s : leg === 2 ? 1 : -s;
    }
    out[i * 3] = u;
    out[i * 3 + 1] = height(u, v);
    out[i * 3 + 2] = v;
  }
}

const BUILDERS: Record<
  ParticleShapeName,
  (out: Float32Array, n: number) => void
> = {
  sphere: buildSphere,
  torus: buildTorus,
  helix: buildHelix,
  knot: buildKnot,
  cube: buildCube,
  wave: buildWave,
};

/** Centre a form and fit its bounding box into ±0.95, so every shape frames alike. */
function normalize(p: Float32Array, n: number) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n * 3; i++) {
    const a = i % 3;
    if (p[i] < lo[a]) lo[a] = p[i];
    if (p[i] > hi[a]) hi[a] = p[i];
  }
  const mid = [0, 1, 2].map((a) => (lo[a] + hi[a]) / 2);
  const half = Math.max(...[0, 1, 2].map((a) => (hi[a] - lo[a]) / 2), 1e-6);
  const k = 0.95 / half;
  for (let i = 0; i < n * 3; i++) p[i] = (p[i] - mid[i % 3]) * k;
}

/**
 * Reorder a form so index 0..n sweeps once around the vertical axis, rising
 * within each sector. Every shape shares that order, so a dot lands near the
 * bearing it left from and the morph reads as one turning object rather than
 * a swarm shuffling at random.
 */
function sortByBearing(p: Float32Array, n: number) {
  const SECTORS = 48;
  const order = Array.from({ length: n }, (_, i) => i);
  const key = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const bearing = (Math.atan2(p[i * 3 + 2], p[i * 3]) + Math.PI) / TAU;
    key[i] = Math.floor(bearing * SECTORS) * 4 + (p[i * 3 + 1] + 1);
  }
  order.sort((a, b) => key[a] - key[b]);
  const sorted = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    sorted[i * 3] = p[order[i] * 3];
    sorted[i * 3 + 1] = p[order[i] * 3 + 1];
    sorted[i * 3 + 2] = p[order[i] * 3 + 2];
  }
  return sorted;
}

function buildShape(name: ParticleShapeName, n: number) {
  const data = new Float32Array(n * 3);
  (BUILDERS[name] ?? buildSphere)(data, n);
  normalize(data, n);
  return sortByBearing(data, n);
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* --------------------------------------------------------------- component */

const ParticleShapeMorph = ({
  className = "",
  shapes = DEFAULT_SHAPES,
  count = 1200,
  duration = 1.25,
}: ParticleShapeMorphProps) => {
  const hostRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indexRef = useRef(0);
  const [active, setActive] = useState(0);

  const list = shapes.length ? shapes : DEFAULT_SHAPES;
  const key = list.join("|");

  useGSAP(
    () => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const n = Math.max(120, Math.min(4000, Math.round(count) || 1200));
      const span = Math.max(0.05, duration) || 1.25;
      const forms = list.map((name) => buildShape(name, n));
      if (indexRef.current >= forms.length) indexRef.current = 0;

      const from = Float32Array.from(forms[indexRef.current]);
      const live = Float32Array.from(from);
      let to = forms[indexRef.current];
      // Fixed per-dot jitter, so a dot bows the same way every time it flies.
      const jitter = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i++) jitter[i] = Math.random() * 2 - 1;
      const bow = new Float32Array(n * 3);
      const reach = new Float32Array(n);
      let sweep = 0;

      // Projection scratch, allocated once: reallocating these every frame is
      // what turns a smooth canvas loop into a garbage-collection stutter.
      const sx = new Float32Array(n);
      const sy = new Float32Array(n);
      const sr = new Float32Array(n);
      const step = new Uint8Array(n);

      const state = { p: 1 };
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      let width = 0;
      let height = 0;
      let color = "#000";
      let frame = 0;
      let previous = 0;
      let spin = 0.6;
      let clock = 0;
      let visible = false;

      /** Write the in-flight positions for progress `p` into `live`. */
      const sample = (p: number) => {
        const total = 1 + STAGGER;
        for (let i = 0; i < n; i++) {
          // Each dot waits its turn: the delay runs once around the bearing.
          const offset = (i / n + sweep) % 1;
          const raw = p * total - offset * STAGGER;
          const t = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
          const e = easeInOutCubic(t);
          const arc = reach[i] * BOW * Math.sin(Math.PI * t);
          for (let a = 0; a < 3; a++) {
            const j = i * 3 + a;
            live[j] = from[j] + (to[j] - from[j]) * e + bow[j] * arc;
          }
        }
      };

      const draw = () => {
        ctx.clearRect(0, 0, width, height);
        if (!width || !height) return;
        const cx = width / 2;
        const cy = height / 2;
        const fit = Math.min(width, height) * FIT;
        const dot = Math.max(0.7, Math.min(width, height) * 0.0055);
        const tiltX = 0.42 + 0.08 * Math.sin(clock * 0.31);
        const cosY = Math.cos(spin);
        const sinY = Math.sin(spin);
        const cosX = Math.cos(tiltX);
        const sinX = Math.sin(tiltX);

        // One pass to project and bucket, then one fill per depth step — eight
        // paths a frame instead of one per dot.
        for (let i = 0; i < n; i++) {
          const x = live[i * 3];
          const y = live[i * 3 + 1];
          const z = live[i * 3 + 2];
          const x1 = x * cosY + z * sinY;
          const z1 = z * cosY - x * sinY;
          const y2 = y * cosX - z1 * sinX;
          const z2 = y * sinX + z1 * cosX;
          const scale = FOV / (FOV + z2);
          sx[i] = cx + x1 * scale * fit;
          sy[i] = cy - y2 * scale * fit;
          const depth = Math.max(0, Math.min(1, (scale - 0.74) / 0.66));
          sr[i] = dot * (0.55 + 0.75 * depth);
          step[i] = Math.min(DEPTH_STEPS - 1, (depth * DEPTH_STEPS) | 0);
        }

        ctx.fillStyle = color;
        for (let b = 0; b < DEPTH_STEPS; b++) {
          ctx.globalAlpha = 0.2 + 0.8 * Math.pow((b + 0.5) / DEPTH_STEPS, 1.3);
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            if (step[i] !== b) continue;
            ctx.moveTo(sx[i] + sr[i], sy[i]);
            ctx.arc(sx[i], sy[i], sr[i], 0, TAU);
          }
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      const tick = (now: number) => {
        const delta = Math.min((now - previous) / 1000, 0.1);
        previous = now;
        clock += delta;
        spin += delta * 0.22;
        sample(state.p);
        draw();
        frame = requestAnimationFrame(tick);
      };

      const stop = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      };

      const update = () => {
        stop();
        sample(state.p);
        draw();
        if (visible && !document.hidden && !reduced.matches) {
          previous = performance.now();
          frame = requestAnimationFrame(tick);
        }
      };

      const advance = () => {
        // Start the next flight from wherever the dots are right now, so a
        // click part-way through a morph redirects instead of snapping.
        from.set(live);
        indexRef.current = (indexRef.current + 1) % forms.length;
        to = forms[indexRef.current];
        setActive(indexRef.current);
        sweep = Math.random();
        for (let i = 0; i < n; i++) {
          const dx = to[i * 3] - from[i * 3];
          const dy = to[i * 3 + 1] - from[i * 3 + 1];
          const dz = to[i * 3 + 2] - from[i * 3 + 2];
          reach[i] = Math.hypot(dx, dy, dz);
          // Bow away from the centre, nudged by this dot's fixed jitter, so the
          // field breathes open mid-flight instead of sliding in straight lines.
          // Mostly radial on purpose: a random direction here just reads as noise.
          const mx = (from[i * 3] + to[i * 3]) / 2 + jitter[i * 3] * 0.24;
          const my = (from[i * 3 + 1] + to[i * 3 + 1]) / 2 + jitter[i * 3 + 1] * 0.16;
          const mz = (from[i * 3 + 2] + to[i * 3 + 2]) / 2 + jitter[i * 3 + 2] * 0.24;
          const len = Math.hypot(mx, my, mz) || 1;
          bow[i * 3] = mx / len;
          bow[i * 3 + 1] = my / len;
          bow[i * 3 + 2] = mz / len;
        }
        gsap.killTweensOf(state);
        if (reduced.matches) {
          state.p = 1;
          update();
          return;
        }
        state.p = 0;
        // Linear here on purpose: the shaping lives in the per-dot ease inside
        // `sample`, and easing both would smear the sweep.
        gsap.to(state, { p: 1, duration: span, ease: "none" });
      };

      const resize = () => {
        width = host.clientWidth;
        height = host.clientHeight;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
      };

      const readColor = () => {
        color = getComputedStyle(host).color || "#000";
        if (!frame) draw();
      };

      readColor();
      sample(1);

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        update();
      });
      intersection.observe(host);

      // next-themes flips a class on <html>, which changes what `color` resolves to.
      const theme = new MutationObserver(readColor);
      theme.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      });

      host.addEventListener("click", advance);
      reduced.addEventListener("change", update);
      document.addEventListener("visibilitychange", update);

      return () => {
        stop();
        gsap.killTweensOf(state);
        resizeObserver.disconnect();
        intersection.disconnect();
        theme.disconnect();
        host.removeEventListener("click", advance);
        reduced.removeEventListener("change", update);
        document.removeEventListener("visibilitychange", update);
      };
    },
    { dependencies: [key, count, duration], scope: hostRef },
  );

  return (
    <button
      ref={hostRef}
      type="button"
      aria-label={`Particle field showing ${LABELS[list[active]] ?? list[active]}. Activate for the next shape.`}
      className={`relative isolate block size-72 cursor-pointer text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 text-[10px] tracking-[0.22em] text-foreground/45 uppercase">
        <span className="tabular-nums">
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(list.length).padStart(2, "0")}
        </span>
        <span aria-hidden="true">·</span>
        <span>{LABELS[list[active]] ?? list[active]}</span>
      </span>
    </button>
  );
};

export default ParticleShapeMorph;
