"use client";

/**
 * A carousel of halftone butterflies that you can scramble with a sonic wave.
 *
 *  Browse   the centred specimen is large, its neighbours shrink to the sides and the
 *           outer ring fades out. Click a neighbour, use the arrows, ← / → or a sideways
 *           swipe to move; every specimen sits on the same dot grid, so a small one is
 *           just drawn with fewer dots
 *  Idle     every specimen breathes; hovering one makes it flap and the dots under the
 *           pointer swell like a loupe
 *  Hold     the field charges: dots tremble, get pulled toward the press point and a ring
 *           of glowing colour closes in on it
 *  Release  a shockwave leaves the press point. Inside its band every dot is scrambled
 *           (random weight, pushed outward, full colour); behind it each specimen
 *           settles back, blooms in colour and flaps once as the wave passes
 *
 * Species are rasters from `buildSpecies(seed)`. Each frame a dot finds the front-most
 * specimen whose box covers it and samples that raster at (u / wingScale, v), so flapping
 * is just a horizontal squash of the lookup and the body stays put.
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

import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { buildSpecies, sample } from "./species";

const COUNT = 8;
const CHARGE_TIME = 1.1; // s to a full charge
const BAND = 160; // px, width of the scramble band
const TAU = Math.PI * 2;
const HUES = 16;
const LEVELS = 5;
// Carousel pose by distance from the centre slot: scale relative to the centre specimen
// and the fade that hides the outer ring.
const SCALE_AT = [1, 0.42, 0.24, 0.18];
const SPRING_K = 140;
const SPRING_C = 2 * Math.sqrt(SPRING_K); // critically damped
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

const scaleAt = (d: number) => {
  const i = Math.min(SCALE_AT.length - 2, Math.floor(d));
  return SCALE_AT[i] + (SCALE_AT[i + 1] - SCALE_AT[i]) * Math.min(1, d - i);
};

export default function HalftoneMoths() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const api = useRef<{ go: (step: number) => void } | null>(null);

  useGSAP(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let seed = Math.floor(Math.random() * 1000);
    const seeds = Array.from({ length: COUNT }, () => seed++);
    let current = seeds.map((s) => buildSpecies(s, { butterfly: true }));
    let next: Float32Array[] | null = null;

    // Layout: the dot grid and the carousel geometry, rebuilt on resize. Specimen poses
    // are computed per frame from the carousel position.
    let W = 0;
    let H = 0;
    let gap = 6;
    let S0 = 100; // px per specimen unit for the centred specimen
    let midX = 0;
    let midY = 0;
    let step1 = 0; // centre → first neighbour
    let step2 = 0; // first → second neighbour
    let dx = new Float32Array(0);
    let dy = new Float32Array(0);

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.clientWidth;
      H = box.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const top = 72;
      const bottom = 96;
      S0 = Math.min(W * (W < 720 ? 0.36 : 0.24), (H - top - bottom) * 0.46);
      gap = Math.min(8, Math.max(3.5, S0 / 54));
      step1 = S0 * (W < 720 ? 1.3 : 1.55);
      step2 = S0 * 0.85;
      // The centre slot snaps to the dot grid so the resting specimen samples symmetrically.
      midX = Math.round(W / 2 / gap) * gap;
      midY = Math.round((top + (H - top - bottom) / 2 + S0 * 0.08) / gap) * gap;

      // One grid over the whole screen, so the charge ring and shockwave run everywhere.
      const xs: number[] = [];
      const ys: number[] = [];
      for (let gy = 0; gy < H + gap; gy += gap) {
        for (let gx = 0; gx < W + gap; gx += gap) {
          xs.push(gx);
          ys.push(gy);
        }
      }
      dx = Float32Array.from(xs);
      dy = Float32Array.from(ys);
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

    // Carousel: `target` counts whole steps without wrapping, `pos` springs toward it and
    // each specimen's slot is its wrapped distance from `pos`.
    const nav = { target: 0, pos: 0, vel: 0 };
    const sx = new Float32Array(COUNT); // specimen centre x
    const sS = new Float32Array(COUNT); // px per unit
    const sA = new Float32Array(COUNT); // fade, 0 hidden
    const order: number[] = []; // visible specimens, front-most first
    const wrapOffset = (c: number) => {
      let o = (((c - nav.pos) % COUNT) + COUNT) % COUNT;
      if (o > COUNT / 2) o -= COUNT;
      return o;
    };
    const go = (step: number) => {
      if (!step) return;
      nav.target += step;
      if (reduce) {
        nav.pos = nav.target;
        nav.vel = 0;
      }
      const i = ((nav.target % COUNT) + COUNT) % COUNT;
      if (counterRef.current) counterRef.current.textContent = `${String(i + 1).padStart(2, "0")} / ${String(COUNT).padStart(2, "0")}`;
    };
    api.current = { go };
    const specimenAt = (x: number, y: number) => {
      for (const c of order) {
        if (Math.abs(x - sx[c]) <= sS[c] && Math.abs(y - midY) <= sS[c]) return c;
      }
      return -1;
    };

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

    const swipe = { x: 0, y: 0, touch: false };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      // A press on a neighbour brings it to the centre instead of charging.
      const c = specimenAt(p.x, p.y);
      const o = c < 0 ? 0 : Math.round(wrapOffset(c));
      if (o !== 0) {
        go(o);
        return;
      }
      box.setPointerCapture(e.pointerId);
      swipe.x = p.x;
      swipe.y = p.y;
      swipe.touch = e.pointerType === "touch";
      startHold(p.x, p.y);
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.inside = true;
      // A sideways touch drag browses and drops the charge.
      const ddx = p.x - swipe.x;
      if (swipe.touch && press.holding && Math.abs(ddx) > 40 && Math.abs(ddx) > Math.abs(p.y - swipe.y) * 1.5) {
        press.holding = false;
        press.charge = 0;
        swipe.touch = false;
        go(ddx < 0 ? 1 : -1);
      }
    };
    let wheelLock = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 24 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLock) return;
      wheelLock = now + 650;
      go(Math.sign(e.deltaX));
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        go(e.key === "ArrowLeft" ? -1 : 1);
        return;
      }
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
    box.addEventListener("wheel", onWheel, { passive: false });

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

      // Carousel spring, then each specimen's slot: position, size and fade.
      nav.vel += ((nav.target - nav.pos) * SPRING_K - nav.vel * SPRING_C) * dt;
      nav.pos += nav.vel * dt;
      if (Math.abs(nav.target - nav.pos) < 1e-3 && Math.abs(nav.vel) < 1e-3) {
        nav.pos = nav.target;
        nav.vel = 0;
      }
      order.length = 0;
      for (let c = 0; c < COUNT; c++) {
        const o = wrapOffset(c);
        const d = Math.abs(o);
        const reach = d <= 1 ? d * step1 : step1 + (d - 1) * step2;
        sx[c] = midX + Math.sign(o) * reach;
        sS[c] = S0 * scaleAt(d);
        sA[c] = 1 - smooth(1.4, 2.2, d);
        if (sA[c] > 0.01) order.push(c);
      }
      order.sort((a, b) => sS[b] - sS[a]);

      // Per-specimen wing scale: idle breath, hover flap, one flap as the wave passes.
      const hovered = pointer.inside ? specimenAt(pointer.x, pointer.y) : -1;
      for (let c = 0; c < COUNT; c++) {
        hover[c] += ((hovered === c ? 1 : 0) - hover[c]) * Math.min(1, dt * 6);
        if (wave.active && !kicked[c] && sA[c] > 0.01 && wave.r > Math.hypot(sx[c] - wave.x, midY - wave.y)) {
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
        let x = dx[k];
        let y = dy[k];
        // Front-most specimen whose box covers this dot; -1 for open plate.
        let c = -1;
        let u = 0;
        let v = 0;
        for (const s of order) {
          const su = (x - sx[s]) / sS[s];
          const sv = (y - midY) / sS[s];
          if (su >= -1 && su <= 1 && sv >= -1 && sv <= 1) {
            c = s;
            u = su / scale[s];
            v = sv;
            break;
          }
        }
        let p = c < 0 ? 0 : sample(current[c], u, v) * sA[c];
        let hot = 0;

        if (wave.active && next) {
          const ox = x - wave.x;
          const oy = y - wave.y;
          const d = Math.hypot(ox, oy) || 1;
          const front = wave.r - d;
          const pB = c < 0 ? 0 : sample(next[c], u, v) * sA[c];
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
        const own = c < 0 ? 0 : flapNow[c] * 0.8 + bloom[c] * 0.9;
        let a = (sweep * 0.5 + own) * weight + light * 0.9;
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
      box.removeEventListener("wheel", onWheel);
    };
  });

  // Keep presses on the arrows from charging a wave on the plate underneath.
  const stop = (e: ReactPointerEvent) => e.stopPropagation();
  const navStep =
    "grid size-7 place-items-center rounded-[6px] transition-colors hover:bg-foreground/5 hover:text-foreground";

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      className="relative h-dvh w-full cursor-crosshair touch-none select-none overflow-hidden bg-background outline-none"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Carousel of halftone butterflies. Hold anywhere and let go to send a wave through them; use the arrow keys to browse."
        className="absolute inset-0 size-full text-foreground"
      />
      <p
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-14 text-center text-sm text-muted-foreground"
      >
        Hold anywhere, then let go
      </p>
      <nav
        aria-label="Butterflies"
        onPointerDown={stop}
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 text-sm font-medium text-muted-foreground"
      >
        <button type="button" onClick={() => api.current?.go(-1)} aria-label="Previous butterfly" className={navStep}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.75} />
        </button>
        <span ref={counterRef} aria-live="polite" className="px-1.5 tabular-nums">
          01 / {String(COUNT).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => api.current?.go(1)} aria-label="Next butterfly" className={navStep}>
          <HugeiconsIcon icon={ArrowRight02Icon} size={16} strokeWidth={1.75} />
        </button>
      </nav>
    </div>
  );
}
