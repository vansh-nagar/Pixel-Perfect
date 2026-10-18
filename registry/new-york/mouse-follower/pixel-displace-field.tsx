/**
 * A pixelated pink-and-violet galaxy of grid-locked squares that scatter away from the cursor and spring back.
 */
"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export interface PixelDisplaceFieldProps {
  className?: string;
  /** Size of each square in CSS pixels. */
  cellSize?: number;
  /** Radius of the cursor field in CSS pixels. */
  radius?: number;
  /** Peak push distance at the centre of the field, in CSS pixels. */
  strength?: number;
}

/** Above this the grid coarsens itself so the per-frame cost stays flat. */
const MAX_CELLS = 13000;
const RAMP_STEPS = 64;
/** Hue steps across the galaxy ramps; colours are pre-built, so shifting hue per frame is free. */
const TINTS = 24;
/** Cells dimmer than this are not drawn at all, which keeps the field sparse and cheap. */
const FLOOR = 0.1;
const ARMS = 2;
const TWIST = 2.6;
/** Radians per second the arms turn; the colour wave runs at twice this. */
const SPIN = 0.32;
/** Share of cells that twinkle like stars. */
const STAR_SHARE = 0.045;

type Stop = readonly [number, readonly [number, number, number]];

/**
 * Galaxy ramps for dark surfaces, ordered by hue: hot pink, violet, indigo, cyan.
 * Each runs dim dust → saturated arm → white-hot.
 */
const DARK_RAMPS: readonly (readonly Stop[])[] = [
  [
    [0, [60, 8, 50]],
    [0.3, [160, 24, 110]],
    [0.56, [240, 72, 160]],
    [0.8, [255, 150, 210]],
    [1, [255, 240, 250]],
  ],
  [
    [0, [34, 10, 78]],
    [0.3, [95, 35, 190]],
    [0.56, [155, 90, 250]],
    [0.8, [205, 170, 255]],
    [1, [246, 240, 255]],
  ],
  [
    [0, [12, 18, 80]],
    [0.3, [40, 60, 200]],
    [0.56, [80, 120, 255]],
    [0.8, [150, 180, 255]],
    [1, [238, 244, 255]],
  ],
  [
    [0, [4, 30, 60]],
    [0.3, [10, 110, 170]],
    [0.56, [30, 190, 240]],
    [0.8, [130, 235, 255]],
    [1, [236, 254, 255]],
  ],
];

/** Light-surface ramps in the same hue order: pastel dust → jewel-tone arm → deep indigo core. */
const LIGHT_RAMPS: readonly (readonly Stop[])[] = [
  [
    [0, [249, 178, 222]],
    [0.3, [246, 120, 190]],
    [0.56, [230, 50, 150]],
    [0.8, [170, 25, 130]],
    [1, [90, 14, 110]],
  ],
  [
    [0, [210, 192, 254]],
    [0.3, [175, 140, 252]],
    [0.56, [130, 70, 240]],
    [0.8, [90, 35, 190]],
    [1, [45, 15, 110]],
  ],
  [
    [0, [188, 204, 254]],
    [0.3, [130, 155, 250]],
    [0.56, [70, 90, 235]],
    [0.8, [45, 45, 175]],
    [1, [25, 20, 100]],
  ],
  [
    [0, [170, 232, 252]],
    [0.3, [100, 215, 245]],
    [0.56, [20, 165, 225]],
    [0.8, [15, 100, 180]],
    [1, [20, 40, 110]],
  ],
];

const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const noise2 = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};

const sampleRamp = (ramp: readonly Stop[], t: number) => {
  for (let i = 1; i < ramp.length; i++) {
    const [stop, color] = ramp[i];
    if (t > stop && i < ramp.length - 1) continue;
    const [prevStop, prevColor] = ramp[i - 1];
    const k = Math.min(1, Math.max(0, (t - prevStop) / (stop - prevStop)));
    return [
      Math.round(prevColor[0] + (color[0] - prevColor[0]) * k),
      Math.round(prevColor[1] + (color[1] - prevColor[1]) * k),
      Math.round(prevColor[2] + (color[2] - prevColor[2]) * k),
    ];
  }
  return [...ramp[0][1]];
};

/** Blends the two ramps either side of `tint` (0 = first ramp, 1 = last) at intensity `t`. */
const sampleGalaxy = (ramps: readonly (readonly Stop[])[], tint: number, t: number) => {
  const pos = tint * (ramps.length - 1);
  const lo = Math.min(ramps.length - 2, Math.floor(pos));
  const k = pos - lo;
  const a = sampleRamp(ramps[lo], t);
  const b = sampleRamp(ramps[lo + 1], t);
  return a.map((c, n) => Math.round(c + (b[n] - c) * k));
};

export default function PixelDisplaceField({
  className,
  cellSize = 9,
  radius = 150,
  strength = 46,
}: PixelDisplaceFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const probe = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const baseCell = Math.max(3, Number.isFinite(cellSize) ? cellSize : 9);
    const baseRadius = Math.max(20, Number.isFinite(radius) ? radius : 150);
    const basePush = Math.max(0, Number.isFinite(strength) ? strength : 46);

    // --- resolved theme ------------------------------------------------
    let lut: string[] = [];

    /** Paints a CSS colour into a 1x1 canvas so any notation (oklch, hex, …) comes back as rgb. */
    const readColor = (value: string): [number, number, number] | null => {
      if (!probe || !value) return null;
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = "rgba(0,0,0,0)";
      probe.fillStyle = value.trim();
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
      return a === 0 ? null : [r, g, b];
    };

    /** The surface this sits on decides which way the ramp runs — no `dark:` overrides needed. */
    const resolveTheme = () => {
      let background: [number, number, number] | null = null;
      for (let el: HTMLElement | null = host; el && !background; el = el.parentElement) {
        background = readColor(getComputedStyle(el).backgroundColor);
      }
      background ??= readColor(
        getComputedStyle(document.documentElement).getPropertyValue("--background"),
      );
      background ??= [255, 255, 255];
      const light =
        (0.2126 * background[0] + 0.7152 * background[1] + 0.0722 * background[2]) / 255 > 0.5;
      const ramps = light ? LIGHT_RAMPS : DARK_RAMPS;

      // Flat table indexed by `tint * RAMP_STEPS + step`.
      lut = [];
      for (let s = 0; s < TINTS; s++) {
        for (let i = 0; i < RAMP_STEPS; i++) {
          const t = i / (RAMP_STEPS - 1);
          const [r, g, b] = sampleGalaxy(ramps, s / (TINTS - 1), t);
          const alpha = Math.min(1, Math.max(0, (t - 0.04) / 0.24));
          lut.push(`rgba(${r},${g},${b},${alpha.toFixed(3)})`);
        }
      }
    };

    // --- grid ----------------------------------------------------------
    let width = 0;
    let height = 0;
    let cell = 1;
    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let arg = new Float32Array(0);
    let env = new Float32Array(0);
    let core = new Float32Array(0);
    let grain = new Float32Array(0);
    let hue = new Float32Array(0);
    let spark = new Float32Array(0);
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);

    const build = () => {
      const rect = host.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;

      cell = Math.max(3, Math.round(baseCell * dpr));
      // Coarsen rather than let a wide surface balloon the cell count.
      while (Math.ceil(width / cell) * Math.ceil(height / cell) > MAX_CELLS) cell += 1;
      cols = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);

      const count = cols * rows;
      arg = new Float32Array(count);
      env = new Float32Array(count);
      core = new Float32Array(count);
      grain = new Float32Array(count);
      hue = new Float32Array(count);
      spark = new Float32Array(count);
      ox = new Float32Array(count);
      oy = new Float32Array(count);
      vx = new Float32Array(count);
      vy = new Float32Array(count);

      const halfW = width / 2;
      const halfH = height / 2;
      // Clamped stretch: the spiral fills a wide card as an inclined disc, never a smear.
      const sx = Math.min(halfW, halfH * 1.55) * 0.82;
      const sy = Math.min(halfH, halfW * 1.55) * 0.82;

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          const nx = (gx * cell + cell / 2 - halfW) / sx;
          const ny = (gy * cell + cell / 2 - halfH) / sy;
          const r = Math.sqrt(nx * nx + ny * ny);
          arg[i] = ARMS * (Math.atan2(ny, nx) + TWIST * Math.log(r + 0.1));

          // Disc that stays bright well out, then a long dusty tail.
          const disc = Math.exp(-(r * r) / 0.5) + 0.32 * Math.exp(-(r * r) / 2.2);
          // White-noise per cell: it dithers the falloff into scattered squares.
          grain[i] = hash2(gx * 1.7 + 4.3, gy * 2.3 - 1.9);
          const wisp = 0.25 + 1.05 * noise2(gx * 0.07 + 11, gy * 0.07 - 7);
          env[i] = disc * wisp;
          // Base hue: pink heart cooling to cyan at the rim, broken into nebula patches by noise.
          hue[i] = 0.08 + 0.5 * r + 1.1 * (noise2(gx * 0.05 - 3, gy * 0.05 + 9) - 0.5);
          // Only a few cells get a twinkle seed; the rest stay 0 and skip the work.
          const seed = hash2(gx * 3.1 + 7.7, gy * 5.3 - 2.9);
          spark[i] = seed < STAR_SHARE ? 1 + seed * 997 : 0;
          core[i] = Math.exp(-(r * r) / 0.006) * 0.85 + Math.exp(-(r * r) / 0.05) * 0.25;
        }
      }
    };

    // --- pointer -------------------------------------------------------
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, on: 0, want: 0, held: false };

    const engage = (event: PointerEvent) => {
      if (event.pointerType === "touch" && !pointer.held) return;
      const rect = host.getBoundingClientRect();
      const px = (event.clientX - rect.left) * dpr;
      const py = (event.clientY - rect.top) * dpr;
      const inside = px >= 0 && py >= 0 && px <= width && py <= height;
      pointer.tx = px;
      pointer.ty = py;
      pointer.want = inside ? 1 : 0;
      if (inside && pointer.on === 0) {
        pointer.x = px;
        pointer.y = py;
      }
      if (inside) wake();
    };

    const press = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      pointer.held = true;
      engage(event);
    };

    const release = () => {
      pointer.held = false;
      pointer.want = 0;
    };

    const leave = () => {
      pointer.want = 0;
    };

    // --- loop ----------------------------------------------------------
    let frame = 0;
    let last = 0;
    let phase = 0;
    let visible = true;

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const still = reduced.matches;

      if (!still) phase += dt * SPIN;
      const t = now / 1000;
      // The core breathes slowly so the galaxy never sits dead still.
      const breath = still ? 1 : 0.88 + 0.12 * Math.sin(t * 1.3);
      pointer.on = still ? pointer.want : pointer.on + (pointer.want - pointer.on) * Math.min(1, dt * 14);
      const chase = still ? 1 : Math.min(1, dt * 18);
      pointer.x += (pointer.tx - pointer.x) * chase;
      pointer.y += (pointer.ty - pointer.y) * chase;

      const R = baseRadius * dpr;
      const push = basePush * dpr * pointer.on;
      const k = 190;
      const damp = 2 * Math.sqrt(k) * 0.55;
      const inset = Math.max(1, Math.round(cell * 0.17));
      const size = cell - inset;
      let settled = true;

      ctx.clearRect(0, 0, width, height);

      for (let gy = 0; gy < rows; gy++) {
        const cy = gy * cell;
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          const cx = gx * cell;

          const band = 0.5 + 0.5 * Math.cos(arg[i] - phase);
          const arm = band * band * band;
          // Dithering by per-cell noise breaks the falloff into scattered squares.
          let v = (env[i] * (arm * 1.5 + 0.13) + core[i] * breath) * (0.35 + 1.15 * grain[i]);
          // A one-armed colour wave spirals out faster than the arms, so hues flow through them;
          // arm crests lean pink, the gaps between lean blue.
          let h = hue[i] + 0.3 * Math.cos(arg[i] / ARMS - phase * 2) - 0.28 * arm;

          if (spark[i] && !still) {
            const s = spark[i];
            const tw = Math.sin(t * (1.1 + (s % 1) * 2.6) + s);
            // Short, sharp flashes: only the top of the sine counts.
            if (tw > 0.82) {
              const flash = (tw - 0.82) / 0.18;
              v += flash * flash * (v < FLOOR ? 0.55 : 0.7);
            }
          }

          const dx = cx + cell / 2 - pointer.x;
          const dy = cy + cell / 2 - pointer.y;
          const d2 = dx * dx + dy * dy;

          let goalX = 0;
          let goalY = 0;
          if (push > 0 && d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = 1 - d / R;
            // Per-cell variation keeps the cleared edge ragged rather than a clean circle.
            const amount = (push * f * f * (0.6 + 0.85 * grain[i])) / d;
            // Radial shove plus a little swirl, so the field stirs instead of only parting.
            goalX = dx * amount - dy * amount * 0.34;
            goalY = dy * amount + dx * amount * 0.34;
            v += f * f * (0.2 + 0.4 * grain[i]);
            // The cursor cools whatever it stirs toward cyan, like a wand through dust.
            h += f * 0.8;
          }

          if (still) {
            ox[i] = goalX;
            oy[i] = goalY;
          } else {
            vx[i] += (-k * (ox[i] - goalX) - damp * vx[i]) * dt;
            vy[i] += (-k * (oy[i] - goalY) - damp * vy[i]) * dt;
            ox[i] += vx[i] * dt;
            oy[i] += vy[i] * dt;
            if (settled && (Math.abs(ox[i]) > 0.3 || Math.abs(vx[i]) > 0.3)) settled = false;
          }

          if (v > 1) v = 1;
          if (v < FLOOR) continue;

          const tint = h <= 0 ? 0 : h >= 1 ? TINTS - 1 : (h * (TINTS - 1) + 0.5) | 0;
          ctx.fillStyle = lut[tint * RAMP_STEPS + ((v * (RAMP_STEPS - 1)) | 0)];
          // Snapping the offset to whole cells keeps every square on the lattice.
          ctx.fillRect(
            cx + Math.round(ox[i] / cell) * cell,
            cy + Math.round(oy[i] / cell) * cell,
            size,
            size,
          );
        }
      }

      // With motion off and nothing displaced there is nothing left to animate.
      if (still && settled && pointer.on < 0.01) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(render);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) wake();
    };

    resolveTheme();
    build();

    const resizeObserver = new ResizeObserver(() => {
      build();
      wake();
    });
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
        else stop();
      },
      { rootMargin: "120px" },
    );
    intersectionObserver.observe(host);

    const themeObserver = new MutationObserver(() => {
      resolveTheme();
      wake();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    window.addEventListener("pointermove", engage, { passive: true });
    host.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    host.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", wake);

    wake();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", engage);
      host.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      host.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", wake);
    };
  }, [cellSize, radius, strength]);

  return (
    <div ref={hostRef} className={cn("relative h-full w-full overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
