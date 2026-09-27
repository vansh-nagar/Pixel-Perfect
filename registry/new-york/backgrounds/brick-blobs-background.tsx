/**
 * Toy-brick cats on a studded baseplate, outlined in purple and red-orange bricks, snapping a stud at a time as they wander; on hover the nearest cat walks to the pointer, watches it and perks up when touched.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface BrickBlobsBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Baseplate colour. */
  backgroundColor?: string;
  /** Body colour of the cats. */
  bodyColor?: string;
  /** Edge bricks on left-facing sides. */
  coolColors?: string[];
  /** Edge bricks on right-facing sides. */
  warmColors?: string[];
  eyeColor?: string;
  /** Size of one stud in px. */
  studSize?: number;
  speed?: number;
  paused?: boolean;
}

// The cats move in steps, like bricks being re-placed, not smoothly.
const STEP = 1 / 8;
const DROP = 0.16;
// Longest brick, in studs. Runs of one colour split into 1–4 stud bricks.
const MAX_BRICK = 4;

const hash = (x: number, y: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

interface Cat {
  /** Home position, 0–1 of the canvas. */
  x: number;
  y: number;
  r: number;
  phase: number;
  sx: number;
  sy: number;
  /** Walk offset toward the pointer, in studs; eased every frame. */
  ox: number;
  oy: number;
  /** Walk cycle, advanced faster while the cat is moving. */
  stride: number;
}

export default function BrickBlobsBackground({
  children,
  className = "",
  style,
  backgroundColor = "#1f1f21",
  bodyColor = "#0d0d0e",
  coolColors = ["#8a6cff", "#5b3de8", "#4128d4"],
  warmColors = ["#d2123d", "#ef7a10"],
  eyeColor = "#d8d8d8",
  studSize = 18,
  speed = 1,
  paused = false,
}: BrickBlobsBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorKey = [
    backgroundColor,
    bodyColor,
    eyeColor,
    coolColors.join("|"),
    warmColors.join("|"),
  ].join(",");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = Number.isFinite(studSize)
      ? Math.max(8, Math.round(studSize))
      : 18;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const [plate, body, eye, cool, warm] = colorKey.split(",");
    // Index 0 = baseplate, 1 = body, 2 = eye, then cool, then warm.
    const palette = [plate, body, eye, ...cool.split("|"), ...warm.split("|")];
    const coolStart = 3;
    const warmStart = 3 + cool.split("|").length;
    const coolCount = warmStart - coolStart;
    const warmCount = palette.length - warmStart;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let columns = 0;
    let rows = 0;
    let grid = new Uint8Array(0);
    /** Per cell: bit 1 = joined to the left brick cell, bit 2 = to the right. */
    let joins = new Uint8Array(0);
    let droppedAt = new Float32Array(0);
    /** sprites[kind][joins] — four variants per colour, one per seam layout. */
    let sprites: HTMLCanvasElement[][] = [];
    let plateSprite: HTMLCanvasElement | null = null;
    let glowSprite: HTMLCanvasElement | null = null;
    let cats: Cat[] = [];
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let lastStep = -Infinity;
    let visible = false;
    // Pointer in stud units; strength eases in/out on enter and leave.
    const pointer = { x: 0, y: 0, strength: 0, target: 0 };

    const drawStud = (
      s: CanvasRenderingContext2D,
      size: number,
      color: string,
    ) => {
      const c = size / 2;
      const r = size * 0.3;
      s.fillStyle = "rgba(0,0,0,0.4)";
      s.beginPath();
      s.arc(c + size * 0.05, c + size * 0.07, r, 0, Math.PI * 2);
      s.fill();
      s.fillStyle = color;
      s.beginPath();
      s.arc(c, c, r, 0, Math.PI * 2);
      s.fill();
      const shine = s.createLinearGradient(c - r, c - r, c + r, c + r);
      shine.addColorStop(0, "rgba(255,255,255,0.28)");
      shine.addColorStop(0.45, "rgba(255,255,255,0)");
      shine.addColorStop(1, "rgba(0,0,0,0.25)");
      s.fillStyle = shine;
      s.beginPath();
      s.arc(c, c, r, 0, Math.PI * 2);
      s.fill();
    };

    // A brick cell: lit top edge, shaded bottom edge, and side edges only
    // where the brick ends — joined cells read as one long brick.
    const makeBrick = (
      color: string,
      joinLeft: boolean,
      joinRight: boolean,
    ) => {
      const size = Math.round(cell * dpr);
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = size;
      const s = sprite.getContext("2d")!;
      const edge = Math.max(1, Math.round(size * 0.07));
      s.fillStyle = color;
      s.fillRect(0, 0, size, size);
      s.fillStyle = "rgba(255,255,255,0.12)";
      s.fillRect(0, 0, size, edge);
      if (!joinLeft) s.fillRect(0, 0, edge, size);
      s.fillStyle = "rgba(0,0,0,0.32)";
      s.fillRect(0, size - edge, size, edge);
      if (!joinRight) s.fillRect(size - edge, 0, edge, size);
      drawStud(s, size, color);
      return sprite;
    };

    // The baseplate is one continuous plate: studs, no seams.
    const makePlate = (color: string) => {
      const size = Math.round(cell * dpr);
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = size;
      const s = sprite.getContext("2d")!;
      s.fillStyle = color;
      s.fillRect(0, 0, size, size);
      drawStud(s, size, color);
      return sprite;
    };

    const spawn = () => {
      // One cat per slot of a jittered grid, so they start apart and only
      // merge when their drift brings them together.
      const across = Math.max(1, Math.round(width / 420));
      const down = Math.max(1, Math.round(height / 420));
      cats = Array.from({ length: across * down }, (_, i) => ({
        x: ((i % across) + 0.5 + (Math.random() - 0.5) * 0.3) / across,
        y: (Math.floor(i / across) + 0.5 + (Math.random() - 0.5) * 0.3) / down,
        r: 0.75 + Math.random() * 0.3,
        phase: i * 1.7 + Math.random() * 6,
        sx: 0.35 + Math.random() * 0.4,
        sy: 0.3 + Math.random() * 0.4,
        ox: 0,
        oy: 0,
        stride: 0,
      }));
    };

    const catBase = () => {
      // Size cats from their grid slot, so a small preview tile still shows
      // one proper cat instead of a speck.
      const across = Math.max(1, Math.round(width / 420));
      const down = Math.max(1, Math.round(height / 420));
      return (Math.min(width / across, height / down) / cell) * 0.29;
    };

    const homeOf = (cat: Cat, t: number) => ({
      x: (cat.x + 0.1 * Math.sin(t * 0.13 * cat.sx + cat.phase)) * columns,
      y: (cat.y + 0.08 * Math.cos(t * 0.11 * cat.sy + cat.phase * 1.3)) * rows,
    });

    // Per frame: ease each cat's walk offset toward the pointer. The nearest
    // cat walks most of the way over; the rest only lean toward it.
    const steer = (dt: number) => {
      const base = catBase();
      let nearest = -1;
      let best = Infinity;
      cats.forEach((cat, n) => {
        const home = homeOf(cat, elapsed);
        const d = Math.hypot(pointer.x - home.x, pointer.y - home.y);
        if (d < best) {
          best = d;
          nearest = n;
        }
      });
      cats.forEach((cat, n) => {
        const home = homeOf(cat, elapsed);
        const pull = pointer.strength * (n === nearest ? 0.85 : 0.12);
        let tx = (pointer.x - home.x) * pull;
        // Aim the body just below the pointer so the cat looks up at it.
        let ty = (pointer.y + cat.r * base * 0.4 - home.y) * pull;
        const reach = cat.r * base * 1.6;
        const length = Math.hypot(tx, ty);
        if (length > reach) {
          tx *= reach / length;
          ty *= reach / length;
        }
        const before = Math.hypot(cat.ox, cat.oy);
        cat.ox += (tx - cat.ox) * Math.min(1, dt * 2.2);
        cat.oy += (ty - cat.oy) * Math.min(1, dt * 2.2);
        const moved = Math.abs(Math.hypot(cat.ox, cat.oy) - before);
        cat.stride += dt * 0.9 + moved * 2.2;
      });
    };

    // Rebuild the brick layout from the cats' current positions.
    const layout = () => {
      const t = elapsed;
      const base = catBase();
      const centers = cats.map((cat) => {
        const home = homeOf(cat, t);
        return { x: home.x + cat.ox, y: home.y + cat.oy, r: cat.r * base };
      });
      const touched = centers.map(
        (c) =>
          pointer.strength > 0.5 &&
          Math.hypot(pointer.x - c.x, (pointer.y - c.y) * 1.1) < c.r * 1.1,
      );
      // Each body gets two ears and two feet. Feet shuffle with the walk
      // cycle; ears perk up while the pointer is on the cat.
      const parts = centers.flatMap((c, n) => {
        const ear = touched[n] ? 1.25 : 1.05;
        const wiggle = Math.sin(cats[n].stride * 2.4) * 0.12;
        return [
          c,
          {
            x: c.x - c.r * 0.55,
            y: c.y - c.r * (ear + wiggle * 0.3),
            r: c.r * 0.45,
          },
          {
            x: c.x + c.r * 0.55,
            y: c.y - c.r * (ear - wiggle * 0.3),
            r: c.r * 0.45,
          },
          { x: c.x - c.r * 0.5, y: c.y + c.r * (0.95 + wiggle), r: c.r * 0.3 },
          { x: c.x + c.r * 0.5, y: c.y + c.r * (0.95 - wiggle), r: c.r * 0.3 },
        ];
      });
      const field = new Float32Array(columns * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          let f = 0;
          for (const c of parts) {
            const dx = x + 0.5 - c.x;
            const dy = (y + 0.5 - c.y) * 1.1;
            // Squared falloff: short tails, so ears and feet stay distinct
            // instead of inflating the whole body.
            const k = (c.r * c.r) / (dx * dx + dy * dy + 1);
            f += k * k;
          }
          field[y * columns + x] = f;
        }
      }
      const inside = (x: number, y: number) =>
        x >= 0 &&
        y >= 0 &&
        x < columns &&
        y < rows &&
        field[y * columns + x] > 1;

      const next = new Uint8Array(columns * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const i = y * columns + x;
          const here = inside(x, y);
          const edge =
            here &&
            (!inside(x - 1, y) ||
              !inside(x + 1, y) ||
              !inside(x, y - 1) ||
              !inside(x, y + 1));
          // Outer rim: one brick outside the body, only on some cells, so the
          // outline doubles up in places like a hand-built model.
          const rim =
            !here &&
            (inside(x - 1, y) ||
              inside(x + 1, y) ||
              inside(x, y - 1) ||
              inside(x, y + 1)) &&
            hash(x, y) < 0.45;
          if (!edge && !rim) {
            next[i] = here ? 1 : 0;
            continue;
          }
          // Which way the edge faces decides cool (left) or warm (right);
          // flat tops and bottoms pick either at random.
          const gx =
            (x + 1 < columns ? field[i + 1] : 0) - (x > 0 ? field[i - 1] : 0);
          const facesLeft = Math.abs(gx) > 0.05 ? gx > 0 : hash(y, x) < 0.5;
          const h = hash(x * 3.1, y * 1.7);
          next[i] = facesLeft
            ? coolStart + (Math.floor(h * coolCount) % coolCount)
            : warmStart +
              (rim ? warmCount - 1 : Math.floor(h * warmCount) % warmCount);
        }
      }

      // Eyes. They follow the pointer, blink now and then, and turn into
      // happy horizontal squints while the cat is being touched.
      centers.forEach((c, n) => {
        const blink = Math.sin(t * 0.7 + cats[n].phase * 3) > 0.985;
        if (blink) return;
        const looking = pointer.strength > 0.5;
        const lookX = looking
          ? Math.max(
              -1,
              Math.min(1, Math.round((pointer.x - c.x) / (c.r * 0.6))),
            )
          : 0;
        const lookY =
          looking && Math.abs(pointer.y - c.y) > c.r * 0.6
            ? Math.sign(pointer.y - c.y)
            : 0;
        const ey = Math.round(c.y - c.r * 0.25) + lookY;
        for (const side of [-1, 1]) {
          const ex = Math.round(c.x + side * c.r * 0.3) + lookX;
          const cells = touched[n]
            ? [
                [ex - 1, ey + 1],
                [ex, ey + 1],
              ]
            : [
                [ex, ey],
                [ex, ey + 1],
              ];
          for (const [x, y] of cells) {
            const i = y * columns + x;
            if (x >= 0 && x < columns && y >= 0 && y < rows && next[i] === 1) {
              next[i] = 2;
            }
          }
        }
      });

      for (let i = 0; i < next.length; i++) {
        if (next[i] !== grid[i]) {
          // Only bricks being added get the drop; removals just vanish.
          if (next[i] !== 0) droppedAt[i] = t;
          grid[i] = next[i];
        }
      }

      // Group each row's same-colour runs into bricks of 1–MAX_BRICK studs.
      // Break points come from a fixed hash, so bricks stay put while the
      // cat moves instead of re-cutting every step.
      joins.fill(0);
      for (let y = 0; y < rows; y++) {
        let run = 0;
        for (let x = 0; x < columns; x++) {
          const i = y * columns + x;
          const kind = grid[i];
          const continues =
            x > 0 &&
            kind !== 0 &&
            grid[i - 1] === kind &&
            run < MAX_BRICK &&
            hash(x * 7.3, y * 2.9) > 0.3;
          if (continues) {
            joins[i] |= 1;
            joins[i - 1] |= 2;
            run++;
          } else {
            run = 1;
          }
        }
      }
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const size = cell * dpr;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          ctx.drawImage(
            plateSprite!,
            Math.round(x * size),
            Math.round(y * size),
          );
        }
      }
      // Hover: the plate brightens softly under the pointer.
      if (pointer.strength > 0.01 && glowSprite) {
        const radius = 3.2;
        const x0 = Math.max(0, Math.floor(pointer.x - radius));
        const x1 = Math.min(columns - 1, Math.ceil(pointer.x + radius));
        const y0 = Math.max(0, Math.floor(pointer.y - radius));
        const y1 = Math.min(rows - 1, Math.ceil(pointer.y + radius));
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const d = Math.hypot(x + 0.5 - pointer.x, y + 0.5 - pointer.y);
            if (d > radius) continue;
            ctx.globalAlpha = pointer.strength * (1 - d / radius) * 0.55;
            ctx.drawImage(
              glowSprite,
              Math.round(x * size),
              Math.round(y * size),
            );
          }
        }
        ctx.globalAlpha = 1;
      }
      // Shadows first, so every placed brick sits visibly above the plate.
      const shadow = Math.max(1, Math.round(size * 0.14));
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 0) continue;
        const x = i % columns;
        const y = (i - x) / columns;
        ctx.fillRect(
          Math.round(x * size) + shadow,
          Math.round(y * size) + shadow,
          Math.ceil(size),
          Math.ceil(size),
        );
      }
      // Placed bricks, with any recent ones dropping in from slightly above.
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const i = y * columns + x;
          const kind = grid[i];
          if (kind === 0) continue;
          const sprite = sprites[kind][joins[i]];
          const p = Math.min(1, (elapsed - droppedAt[i]) / DROP);
          const px = Math.round(x * size);
          const py = Math.round(y * size);
          if (p >= 1) {
            ctx.drawImage(sprite, px, py);
            continue;
          }
          const lift = (1 - p) * (1 - p);
          const scale = 1 + 0.25 * lift;
          const drawn = size * scale;
          ctx.globalAlpha = 0.35 + 0.65 * p;
          ctx.drawImage(
            sprite,
            px - (drawn - size) / 2,
            py - (drawn - size) / 2 - lift * size * 0.3,
            drawn,
            drawn,
          );
          ctx.globalAlpha = 1;
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.1) * rate;
      elapsed += dt;
      previous = now;
      pointer.strength += (pointer.target - pointer.strength) * 0.12;
      steer(dt);
      if (elapsed - lastStep >= STEP) {
        lastStep = elapsed;
        layout();
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      draw();
      if (
        !paused &&
        rate > 0 &&
        visible &&
        !document.hidden &&
        !reducedMotion.matches
      ) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      columns = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);
      grid = new Uint8Array(columns * rows);
      joins = new Uint8Array(columns * rows);
      droppedAt = new Float32Array(columns * rows).fill(-Infinity);
      sprites = palette.map((color) =>
        [0, 1, 2, 3].map((j) => makeBrick(color, (j & 1) > 0, (j & 2) > 0)),
      );
      plateSprite = makePlate(plate);
      glowSprite = makePlate("#4a4a52");
      spawn();
      layout();
      // No drop on first paint: the model is simply there.
      droppedAt.fill(-Infinity);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    intersection.observe(host);
    const move = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / cell;
      pointer.y = (event.clientY - rect.top) / cell;
      pointer.target = 1;
    };
    const leave = () => {
      pointer.target = 0;
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [colorKey, studSize, speed, paused]);

  return (
    <div
      ref={hostRef}
      className={`relative isolate h-full w-full overflow-hidden ${className}`}
      style={{ backgroundColor, ...style }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {children && (
        <div className="relative z-10 h-full w-full">{children}</div>
      )}
    </div>
  );
}
