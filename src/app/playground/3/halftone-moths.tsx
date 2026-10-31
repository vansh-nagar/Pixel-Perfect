"use client";

/**
 * A specimen plate of halftone moths that you can scramble with a sonic wave.
 *
 *  Idle     every specimen breathes; hovering one makes it flap and the dots under the
 *           pointer swell like a loupe
 *  Hold     the field charges: dots tremble, get pulled toward the press point and a ring
 *           of glowing colour closes in on it
 *  Release  a shockwave leaves the press point. Inside its band every dot is scrambled
 *           (random weight, pushed outward, full colour); behind it each specimen
 *           settles back, blooms in colour and flaps once as the wave passes
 *
 * Species are rasters from `buildSpecies(seed)`. Each frame a dot samples its specimen's
 * raster at (u / wingScale, v), so flapping is just a horizontal squash of the lookup and
 * the body stays put.
 *
 * Colour is iridescence, like real wing scales: the plate rests in plain ink, and a
 * purple-pink sheen only shows where something happens — a slow band of light sweeping
 * the plate, wings that flap, the pointer (a light source), the charge ring, the
 * shockwave, and each specimen after the wave, which blooms and fades back to ink. Heavy
 * dots catch more colour than light ones, so the halftone still reads.
 *
 * Dots are batched by colour: plain ink in one Path2D, tinted dots in HUES × LEVELS
 * buckets, so a frame is a few dozen fills however many dots there are. Tinted dots are
 * also drawn into a quarter-resolution canvas that is blurred on top as a glow.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { buildSpecies, sample } from "./species";

const COUNT = 8;
const CHARGE_TIME = 1.1; // s to a full charge
const BAND = 160; // px, width of the scramble band
const TAU = Math.PI * 2;
const HUES = 16;
const LEVELS = 5;
// Cyclic palette: violet → fuchsia → pink → lavender → indigo → back.
const PALETTE = [
  [124, 58, 237],
  [192, 38, 211],
  [236, 72, 153],
  [244, 114, 182],
  [167, 139, 250],
  [99, 102, 241],
];

/** Palette colour at h ∈ [0, 1), interpolated around the cycle. */
function paletteAt(h: number) {
  const f = (((h % 1) + 1) % 1) * PALETTE.length;
  const i = Math.floor(f);
  const a = PALETTE[i];
  const b = PALETTE[(i + 1) % PALETTE.length];
  const t = f - i;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const hash = (i: number, j: number) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function HalftoneMoths() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let seed = Math.floor(Math.random() * 1000);
    const seeds = Array.from({ length: COUNT }, () => seed++);
    let current = seeds.map((s) => buildSpecies(s));
    let next: Float32Array[] | null = null;

    // Layout: dot positions and specimen-space coordinates, rebuilt on resize.
    let W = 0;
    let H = 0;
    let gap = 6;
    let dx = new Float32Array(0);
    let dy = new Float32Array(0);
    let du = new Float32Array(0);
    let dv = new Float32Array(0);
    let dc = new Uint8Array(0);
    const cells: { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number }[] = [];

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.clientWidth;
      H = box.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const top = 72;
      const bottom = 48;
      const side = 16;
      const cols = W < 720 ? 2 : 4;
      const rows = COUNT / cols;
      const cw = (W - side * 2) / cols;
      const ch = (H - top - bottom) / rows;
      const S = Math.min(cw * 0.44, ch * 0.52); // px per specimen unit
      gap = Math.min(8, Math.max(3.5, S / 21));

      // Specimen centres snap to the dot grid so every specimen samples symmetrically.
      cells.length = 0;
      for (let c = 0; c < COUNT; c++) {
        const col = c % cols;
        const row = Math.floor(c / cols);
        const x0 = side + cw * col;
        const y0 = top + ch * row;
        const cx = Math.round((x0 + cw / 2) / gap) * gap;
        const cy = Math.round((y0 + ch / 2 + S * 0.08) / gap) * gap;
        cells.push({ x0, y0, x1: x0 + cw, y1: y0 + ch, cx, cy });
      }

      // One grid over the whole screen, so the charge ring and shockwave run everywhere.
      // Each dot reads from the specimen whose cell it falls in.
      const xs: number[] = [];
      const ys: number[] = [];
      const us: number[] = [];
      const vs: number[] = [];
      const cs: number[] = [];
      for (let gy = 0; gy < H + gap; gy += gap) {
        const row = Math.min(rows - 1, Math.max(0, Math.floor((gy - top) / ch)));
        for (let gx = 0; gx < W + gap; gx += gap) {
          const col = Math.min(cols - 1, Math.max(0, Math.floor((gx - side) / cw)));
          const c = row * cols + col;
          xs.push(gx);
          ys.push(gy);
          us.push((gx - cells[c].cx) / S);
          vs.push((gy - cells[c].cy) / S);
          cs.push(c);
        }
      }
      dx = Float32Array.from(xs);
      dy = Float32Array.from(ys);
      du = Float32Array.from(us);
      dv = Float32Array.from(vs);
      dc = Uint8Array.from(cs);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(box);

    // Interaction state.
    const pointer = { x: -1e4, y: -1e4, inside: false };
    const press = { x: 0, y: 0, holding: false, charge: 0 };
    const wave = { x: 0, y: 0, r: 0, strength: 0, active: false };
    const hover = new Float32Array(COUNT);
    const kick = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    const kicked = new Uint8Array(COUNT);
    const scale = new Float32Array(COUNT);

    const local = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const startHold = (x: number, y: number) => {
      // A new hold during a wave lands the wave's species immediately.
      if (wave.active && next) {
        current = next;
        next = null;
        wave.active = false;
      }
      press.x = x;
      press.y = y;
      press.holding = true;
      press.charge = 0;
    };
    const release = () => {
      if (!press.holding) return;
      press.holding = false;
      // The wave scrambles and recolours the plate but keeps the same specimens.
      next = current;
      wave.x = press.x;
      wave.y = press.y;
      wave.r = 0;
      wave.strength = reduce ? 0.25 : 0.35 + 0.65 * press.charge;
      wave.active = true;
      kicked.fill(0);
      press.charge = 0;
      gsap.to(hintRef.current, { autoAlpha: 0, duration: 0.6 });
    };

    const onDown = (e: PointerEvent) => {
      box.setPointerCapture(e.pointerId);
      const p = local(e);
      startHold(p.x, p.y);
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        startHold(W / 2, H / 2);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") release();
    };
    box.addEventListener("pointerdown", onDown);
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerup", release);
    box.addEventListener("pointercancel", release);
    box.addEventListener("pointerleave", onLeave);
    box.addEventListener("keydown", onKeyDown);
    box.addEventListener("keyup", onKeyUp);

    // Resolve the theme's ink colour (any CSS colour syntax) to RGB through a 1px canvas,
    // then build the tinted bucket colours from it. Rebuilt only when the theme changes.
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    let inkCss = "";
    let tints: string[] = [];
    const resolveTints = (css: string) => {
      if (css === inkCss) return;
      inkCss = css;
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = css;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      tints = [];
      for (let h = 0; h < HUES; h++) {
        const c = paletteAt(h / HUES);
        for (let l = 1; l <= LEVELS; l++) {
          const m = l / LEVELS;
          tints.push(`rgb(${r + (c[0] - r) * m | 0} ${g + (c[1] - g) * m | 0} ${b + (c[2] - b) * m | 0})`);
        }
      }
    };

    const glow = document.createElement("canvas");
    const gctx = glow.getContext("2d")!;
    const GLOW_SCALE = 0.25;

    let ink = new Path2D();
    let buckets: Path2D[] = [];
    const used = new Uint8Array(HUES * LEVELS);
    const bloom = new Float32Array(COUNT);
    const flapNow = new Float32Array(COUNT);
    let last = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const tick = Math.floor(t * 20); // scramble noise re-rolls 20×/s

      if (press.holding) press.charge = Math.min(1, press.charge + dt / CHARGE_TIME);
      if (wave.active) {
        wave.r += dt * (900 + 1100 * wave.strength);
        if (wave.r > Math.hypot(W, H) + BAND && next) {
          current = next;
          next = null;
          wave.active = false;
        }
      }

      // Per-specimen wing scale: idle breath, hover flap, one flap as the wave passes.
      for (let c = 0; c < COUNT; c++) {
        const cell = cells[c];
        const over =
          pointer.inside && pointer.x > cell.x0 && pointer.x < cell.x1 && pointer.y > cell.y0 && pointer.y < cell.y1;
        hover[c] += ((over ? 1 : 0) - hover[c]) * Math.min(1, dt * 6);
        if (wave.active && !kicked[c] && wave.r > Math.hypot(cell.cx - wave.x, cell.cy - wave.y)) {
          kicked[c] = 1;
          kick[c] = 1;
          phase[c] = 0;
          bloom[c] = 1;
        }
        kick[c] = Math.max(0, kick[c] - dt * 1.4);
        bloom[c] = Math.max(0, bloom[c] - dt / 2.8);
        const amt = Math.max(hover[c], kick[c]);
        phase[c] += dt * TAU * (amt > 0.01 ? 2.6 : 0);
        const flap = reduce ? 0 : amt * (0.5 - 0.5 * Math.cos(phase[c]));
        const breath = reduce ? 0 : 0.035 * (0.5 + 0.5 * Math.sin(t * 1.3 + c * 1.7));
        scale[c] = 1 - 0.6 * flap - breath;
        flapNow[c] = flap;
      }

      ink = new Path2D();
      buckets = Array.from({ length: HUES * LEVELS }, () => new Path2D());
      used.fill(0);
      const maxR = gap * 0.62;
      const charge = press.charge;
      const ring = 360 - 340 * charge * charge;
      const lensOn = pointer.inside && !press.holding;

      for (let k = 0; k < dx.length; k++) {
        const c = dc[k];
        const u = du[k] / scale[c];
        const v = dv[k];
        let x = dx[k];
        let y = dy[k];
        let p = sample(current[c], u, v);
        let hot = 0;

        if (wave.active && next) {
          const ox = x - wave.x;
          const oy = y - wave.y;
          const d = Math.hypot(ox, oy) || 1;
          const front = wave.r - d;
          const pB = sample(next[c], u, v);
          p += (pB - p) * smooth(-BAND * 0.15, BAND * 0.35, front);
          const s = Math.exp(-((front / (BAND * 0.5)) ** 2)) * wave.strength;
          if (s > 0.01) {
            const n = hash(k, tick);
            p = p * (1 - s) + n * n * s;
            const push = s * 26 * (0.55 + 0.45 * Math.sin(d * 0.08 - t * 30));
            x += (ox / d) * push + (hash(k, tick + 7) - 0.5) * s * 10;
            y += (oy / d) * push + (hash(k, tick + 13) - 0.5) * s * 10;
            hot = s;
          }
        }

        if (press.holding) {
          const ox = press.x - x;
          const oy = press.y - y;
          const d = Math.hypot(ox, oy);
          const pull = reduce ? 0 : charge * 0.14 * Math.exp(-((d / 420) ** 2));
          x += ox * pull + (reduce ? 0 : (hash(k, tick) - 0.5) * charge * 3);
          y += oy * pull + (reduce ? 0 : (hash(k, tick + 3) - 0.5) * charge * 3);
          const rs = Math.exp(-(((d - ring) / 14) ** 2)) * Math.min(1, charge * 3);
          if (rs > 0.05) {
            p = Math.max(p, rs * 0.6);
            hot = Math.max(hot, rs);
          }
        }

        let light = 0;
        if (lensOn && p > 0) {
          light = Math.exp(-((Math.hypot(x - pointer.x, y - pointer.y) / 90) ** 2));
          p += (1 - p) * 0.45 * light;
        }

        if (p < 0.02) continue;
        const rad = Math.sqrt(p) * maxR;

        // How much colour this dot shows: the sweeping sheen and the specimen's own
        // activity, weighted toward heavy dots; the pointer light and hot dots override.
        const weight = smooth(0.12, 0.6, p);
        const sweep = smooth(0.72, 1, 0.5 + 0.5 * Math.sin(x * 0.0045 + y * 0.0025 - t * 0.7));
        let a = (sweep * 0.5 + flapNow[c] * 0.8 + bloom[c] * 0.9) * weight + light * 0.9;
        a = Math.min(1, Math.max(a, hot));

        if (a < 0.08) {
          ink.moveTo(x + rad, y);
          ink.arc(x, y, rad, 0, TAU);
          continue;
        }
        const h = hot > 0.3
          ? Math.atan2(y - (press.holding ? press.y : wave.y), x - (press.holding ? press.x : wave.x)) / TAU + t * 0.25
          : 0.5 + 0.5 * Math.sin(x * 0.005 - t * 0.5 + Math.sin(y * 0.004 + t * 0.3) * 1.6) + p * 0.3;
        const hi = Math.floor((((h % 1) + 1) % 1) * HUES) % HUES;
        const li = Math.min(LEVELS, Math.ceil(a * LEVELS));
        const b = hi * LEVELS + li - 1;
        buckets[b].moveTo(x + rad, y);
        buckets[b].arc(x, y, rad, 0, TAU);
        used[b] = 1;
      }

      const css = getComputedStyle(canvas);
      resolveTints(css.color);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = css.color;
      ctx.fill(ink);

      // Tinted dots go on the plate and, from level 2 up, into the glow layer.
      const gw = Math.max(1, Math.round(W * GLOW_SCALE));
      const gh = Math.max(1, Math.round(H * GLOW_SCALE));
      if (glow.width !== gw || glow.height !== gh) {
        glow.width = gw;
        glow.height = gh;
      }
      gctx.setTransform(GLOW_SCALE, 0, 0, GLOW_SCALE, 0, 0);
      gctx.clearRect(0, 0, W, H);
      let glowing = false;
      for (let b = 0; b < buckets.length; b++) {
        if (!used[b]) continue;
        ctx.fillStyle = tints[b];
        ctx.fill(buckets[b]);
        if (b % LEVELS >= 1) {
          gctx.fillStyle = tints[b];
          gctx.fill(buckets[b]);
          glowing = true;
        }
      }
      if (glowing) {
        const dark = document.documentElement.classList.contains("dark");
        ctx.save();
        ctx.filter = "blur(6px)";
        ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
        ctx.globalAlpha = dark ? 0.9 : 0.45;
        ctx.drawImage(glow, 0, 0, W, H);
        ctx.restore();
      }
    };

    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
      ro.disconnect();
      box.removeEventListener("pointerdown", onDown);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", release);
      box.removeEventListener("pointercancel", release);
      box.removeEventListener("pointerleave", onLeave);
      box.removeEventListener("keydown", onKeyDown);
      box.removeEventListener("keyup", onKeyUp);
    };
  });

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      className="relative h-dvh w-full cursor-crosshair touch-none select-none overflow-hidden bg-background outline-none"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Plate of halftone moths. Hold anywhere and let go to send a wave through them."
        className="absolute inset-0 size-full text-foreground"
      />
      <p
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm text-muted-foreground"
      >
        Hold anywhere, then let go
      </p>
    </div>
  );
}
