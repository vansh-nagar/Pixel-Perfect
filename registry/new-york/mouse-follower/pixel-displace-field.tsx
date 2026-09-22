/**
 * A pixelated spiral of grid-locked squares that scatter away from the cursor and spring back.
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
  /** Tracked markers drawn over the field; 0 hides them. */
  markers?: number;
}

/** Above this the grid coarsens itself so the per-frame cost stays flat. */
const MAX_CELLS = 13000;
const RAMP_STEPS = 64;
/** Cells dimmer than this are not drawn at all, which keeps the field sparse and cheap. */
const FLOOR = 0.1;
const ARMS = 2;
const TWIST = 2.6;

type Stop = readonly [number, readonly [number, number, number]];

/** Ember ramp for dark surfaces: dim maroon through orange to warm white. */
const DARK_RAMP: readonly Stop[] = [
  [0, [58, 13, 2]],
  [0.3, [140, 31, 4]],
  [0.56, [209, 73, 11]],
  [0.8, [245, 149, 36]],
  [1, [255, 238, 208]],
];

/** Inverted ramp for light surfaces: pale amber through orange to burnt near-black. */
const LIGHT_RAMP: readonly Stop[] = [
  [0, [247, 208, 158]],
  [0.3, [236, 139, 52]],
  [0.56, [204, 71, 11]],
  [0.8, [145, 35, 10]],
  [1, [44, 11, 2]],
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

export default function PixelDisplaceField({
  className,
  cellSize = 9,
  radius = 150,
  strength = 46,
  markers = 4,
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
    const markerCount = Math.max(0, Math.min(8, Math.round(markers) || 0));

    // --- resolved theme ------------------------------------------------
    let ramp = DARK_RAMP;
    let lut: string[] = [];
    let chrome = "rgba(255,255,255,0.55)";
    let chromeFaint = "rgba(255,255,255,0.22)";
    let backdrop = "rgba(0,0,0,0.75)";

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
      ramp = light ? LIGHT_RAMP : DARK_RAMP;

      lut = [];
      for (let i = 0; i < RAMP_STEPS; i++) {
        const t = i / (RAMP_STEPS - 1);
        const [r, g, b] = sampleRamp(ramp, t);
        const alpha = Math.min(1, Math.max(0, (t - 0.04) / 0.24));
        lut.push(`rgba(${r},${g},${b},${alpha.toFixed(3)})`);
      }

      const ink = readColor(getComputedStyle(host).color) ?? (light ? [10, 10, 10] : [250, 250, 250]);
      chrome = `rgba(${ink[0]},${ink[1]},${ink[2]},0.62)`;
      chromeFaint = `rgba(${ink[0]},${ink[1]},${ink[2]},0.24)`;
      // Chrome is outlined in the host background so it stays readable over dense cells.
      backdrop = `rgba(${background[0]},${background[1]},${background[2]},0.8)`;
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
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);

    type Marker = { cell: number; x: number; y: number; label: string; seeded: boolean };
    let anchors: number[] = [];
    let pins: Marker[] = [];

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
      ox = new Float32Array(count);
      oy = new Float32Array(count);
      vx = new Float32Array(count);
      vy = new Float32Array(count);

      const halfW = width / 2;
      const halfH = height / 2;
      // Clamped stretch: the spiral fills a wide card as an inclined disc, never a smear.
      const sx = Math.min(halfW, halfH * 1.55) * 0.82;
      const sy = Math.min(halfH, halfW * 1.55) * 0.82;

      const bright: number[] = [];
      const margin = 40 * dpr;
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
          core[i] = Math.exp(-(r * r) / 0.006) * 0.85 + Math.exp(-(r * r) / 0.05) * 0.25;
          const rest = env[i] * 0.8 + core[i];
          const px = gx * cell + cell / 2;
          const py = gy * cell + cell / 2;
          const framed =
            px > margin && py > margin && px < width - margin && py < height - margin;
          // Anchors sit on the arms: bright enough to matter, clear of the blown-out core.
          if (framed && r > 0.4 && r < 1.15 && rest > 0.42 && rest < 0.95) bright.push(i);
        }
      }

      // Marker anchors: candidates kept far apart so no two boxes crowd each other.
      anchors = [];
      const want = Math.max(markerCount, 6);
      const step = Math.max(1, (bright.length / 400) | 0);
      let sep = Math.min(width, height) * 0.36;
      while (anchors.length < want && sep > 30 * dpr) {
        for (let n = 0; n < bright.length && anchors.length < want; n += step) {
          const i = bright[(n * 7919 + 13) % bright.length];
          const px = (i % cols) * cell;
          const py = ((i / cols) | 0) * cell;
          const clear = anchors.every((j) => {
            const dx = (j % cols) * cell - px;
            const dy = ((j / cols) | 0) * cell - py;
            return dx * dx + dy * dy > sep * sep;
          });
          if (clear) anchors.push(i);
        }
        sep *= 0.7;
      }

      const at = (i: number) => [(i % cols) * cell, ((i / cols) | 0) * cell];
      const chosen: number[] = anchors.length ? [anchors[0]] : [];
      while (chosen.length < Math.min(markerCount, anchors.length)) {
        let best = -1;
        let bestGap = -1;
        for (const i of anchors) {
          if (chosen.includes(i)) continue;
          const [px, py] = at(i);
          let near = Infinity;
          for (const j of chosen) {
            const [qx, qy] = at(j);
            near = Math.min(near, (px - qx) ** 2 + (py - qy) ** 2);
          }
          if (near > bestGap) {
            bestGap = near;
            best = i;
          }
        }
        if (best < 0) break;
        chosen.push(best);
      }
      pins = chosen.map((i) => ({ cell: i, x: 0, y: 0, label: "", seeded: false }));
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
    let retargetAt = 0;

    const drawMarkers = (now: number) => {
      if (!pins.length) return;
      const box = Math.round(Math.min(26, Math.max(14, Math.min(width, height) / dpr * 0.06)) * dpr);
      const still = reduced.matches;
      if (!still && now > retargetAt && anchors.length > pins.length) {
        retargetAt = now + 4200;
        const pin = pins[(now / 4200) % pins.length | 0];
        const taken = new Set(pins.map((p) => p.cell));
        const free = anchors.filter((a) => !taken.has(a));
        if (free.length) {
          pin.cell = free[Math.floor(hash2(now, 3) * free.length) % free.length];
          pin.label = "";
        }
      }

      const hair = Math.max(1, Math.round(dpr));
      ctx.font = `${Math.round(9 * dpr)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.lineJoin = "round";

      for (const pin of pins) {
        const i = pin.cell;
        const hx = (i % cols) * cell + cell / 2 + ox[i];
        const hy = ((i / cols) | 0) * cell + cell / 2 + oy[i];
        if (!pin.seeded || still) {
          pin.x = hx;
          pin.y = hy;
          pin.seeded = true;
        } else {
          pin.x += (hx - pin.x) * 0.08;
          pin.y += (hy - pin.y) * 0.08;
        }
        if (!pin.label) pin.label = (0.08 + Math.min(0.9, env[i] * 0.55)).toFixed(4);
      }

      ctx.lineWidth = hair;
      ctx.strokeStyle = chromeFaint;
      ctx.setLineDash([Math.round(2 * dpr), Math.round(3 * dpr)]);
      ctx.beginPath();
      for (let n = 0; n < pins.length - 1; n++) {
        ctx.moveTo(pins[n].x, pins[n].y);
        ctx.lineTo(pins[n + 1].x, pins[n + 1].y);
      }
      if (pins.length > 2) {
        ctx.moveTo(pins[0].x, pins[0].y);
        ctx.lineTo(pins[pins.length - 1].x, pins[pins.length - 1].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      for (const pin of pins) {
        const x = Math.round(pin.x - box / 2) + 0.5;
        const y = Math.round(pin.y - box / 2) + 0.5;
        const tick = Math.round(box * 0.3);
        const ly = y + box + Math.round(3 * dpr);
        ctx.beginPath();
        ctx.rect(x, y, box, box);
        ctx.moveTo(x, y);
        ctx.lineTo(x + tick, y + tick);
        ctx.moveTo(x + box, y + box);
        ctx.lineTo(x + box - tick, y + box - tick);
        ctx.moveTo(x + box, y);
        ctx.lineTo(x + box - tick, y + tick);
        ctx.moveTo(x, y + box);
        ctx.lineTo(x + tick, y + box - tick);
        ctx.lineWidth = hair * 3;
        ctx.strokeStyle = backdrop;
        ctx.stroke();
        ctx.lineWidth = hair;
        ctx.strokeStyle = chrome;
        ctx.stroke();

        ctx.lineWidth = hair * 3;
        ctx.strokeStyle = backdrop;
        ctx.strokeText(pin.label, x, ly);
        ctx.fillStyle = chrome;
        ctx.fillText(pin.label, x, ly);
      }
    };

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const still = reduced.matches;

      if (!still) phase += dt * 0.085;
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
          let v = (env[i] * (arm * 1.5 + 0.13) + core[i]) * (0.35 + 1.15 * grain[i]);

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

          ctx.fillStyle = lut[(v * (RAMP_STEPS - 1)) | 0];
          // Snapping the offset to whole cells keeps every square on the lattice.
          ctx.fillRect(
            cx + Math.round(ox[i] / cell) * cell,
            cy + Math.round(oy[i] / cell) * cell,
            size,
            size,
          );
        }
      }

      drawMarkers(now);

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
  }, [cellSize, radius, strength, markers]);

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
