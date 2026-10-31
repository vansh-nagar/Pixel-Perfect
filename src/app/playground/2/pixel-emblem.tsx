"use client";

/**
 * A glowing LED pixel emblem: hold to charge it, release to fire a sonic boom that scrambles every pixel and swirls in a newly generated pattern.
 */

import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CELLS_WAVES, createCellsMaterial } from "../_shared/voronoi-cells";
import { GRID, generate, type Pattern } from "./patterns";

const CURATED: [number, string][] = [
  [4, "Gate"],
  [10, "Lattice"],
  [14, "Bloom"],
  [17, "Kiln"],
  [19, "Compass"],
  [26, "Weave"],
  [32, "Vault"],
  [34, "Spiral"],
  [37, "Labyrinth"],
  [41, "Loom"],
  [43, "Ward"],
  [9, "Frost"],
];

const THEMES = {
  light: { background: "#f2f0ec", gap: "#dbd8d2", ink: [29, 28, 26], accent: "#e8552f", blend: "multiply" as const },
  dark: { background: "#1a1a19", gap: "#0f0f0e", ink: [236, 235, 232], accent: "#f0643c", blend: "lighter" as const },
};

// Units are grid cells; times in seconds.
const PIXEL = { size: 0.86, radius: 0.22 };
const SPRING = { stiffness: 120, damping: 14 };
const MORPH = { stagger: 0.022, splitScale: 0.6, fadeIn: 9, fadeOut: 14 };
const REPEL = { radius: 3.4, push: 0.8, shrink: 0.3 };
const CHARGE = { seconds: 1.2, pull: 0.32, shrink: 0.3, tremble: 0.16, heat: 0.85, tapBelow: 0.18 };
const SONIC = { speed: 34, band: 1.4, force: 1400, swirl: 0.7, spin: 16, freeFor: 0.38, ringLife: 0.9 };
const RIPPLE = { speed: 15, band: 0.9, force: 150, heat: 0.9 };
const SPLIT = { perSpeed: 0.012, max: 0.45 };
const GLOW = { blur: 0.55, alpha: 0.55 };
const IDLE = { after: 4, every: 5 };

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

// Loop mode: a scripted cursor (grid cells from the centre) that sweeps through
// the emblem, orbits it, charges a hold in the middle and leaves where it started.
type Move = { seconds: number; to?: [number, number]; orbit?: number; ease?: (t: number) => number; press?: boolean };
const SCRIPT: Move[] = [
  { seconds: 0.6 },
  { seconds: 1.1, to: [3.5, 2.5], ease: easeInOutCubic },
  { seconds: 0.3 },
  { seconds: 0.75, to: [-6, -3.2], ease: easeInOutQuart },
  { seconds: 0.25 },
  { seconds: 2.2, orbit: Math.PI * 2, ease: easeInOutCubic },
  { seconds: 0.2 },
  { seconds: 0.7, to: [0.2, 0.3], ease: easeInOutCubic },
  { seconds: 0.8, press: true },
  { seconds: 0.7 },
  { seconds: 0.6, to: [5.5, -5.5], ease: easeInOutQuart },
  { seconds: 0.55, to: [-4.5, 6], ease: easeInOutQuart },
  { seconds: 0.25 },
  { seconds: 1.3, to: [13, 8], ease: easeInOutCubic },
  { seconds: 0.6 },
];
const SCRIPT_START: [number, number] = [13, 8];
const SCRIPT_SECONDS = SCRIPT.reduce((sum, m) => sum + m.seconds, 0);

const cursorAt = (time: number) => {
  let t = ((time % SCRIPT_SECONDS) + SCRIPT_SECONDS) % SCRIPT_SECONDS;
  let [x, y] = SCRIPT_START;
  for (const m of SCRIPT) {
    const k = t < m.seconds ? (m.ease ?? ((v: number) => v))(t / m.seconds) : 1;
    let nx = x;
    let ny = y;
    if (m.to) {
      nx = x + (m.to[0] - x) * k;
      ny = y + (m.to[1] - y) * k;
    } else if (m.orbit) {
      const a = m.orbit * k;
      nx = x * Math.cos(a) - y * Math.sin(a);
      ny = x * Math.sin(a) + y * Math.cos(a);
    }
    if (t < m.seconds) return { x: nx, y: ny, pressed: !!m.press };
    t -= m.seconds;
    [x, y] = [nx, ny];
  }
  return { x, y, pressed: false };
};

type Wave = { x: number; y: number; t0: number; sonic: boolean; strength: number };
type Sprite = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  vs: number;
  rot: number;
  vrot: number;
  opacity: number;
  heat: number;
  tx: number;
  ty: number;
  ts: number;
  to: number;
  free: boolean;
  hit: Set<Wave>;
  pending: { x: number; y: number; s: number; o: number; at: number } | null;
};
type Engine = { morph: (p: Pattern) => void; idleFor: () => number };

const centre = (v: number) => v + 0.5 - GRID / 2;
const polarKey = (x: number, y: number) => ((Math.atan2(centre(y), centre(x)) + Math.PI * 2) % (Math.PI * 2)) * 100 + Math.hypot(centre(x), centre(y));

/**
 * `loop` turns on a seamless recording mode: a drawn cursor follows SCRIPT and
 * the controls, auto-advance and real input are off.
 */
export default function PixelEmblem({ loop }: { loop?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [selection, setSelection] = useState<{ index: number } | { seed: number }>({ index: 0 });

  const pattern = useMemo(() => {
    if ("index" in selection) {
      const [seed, name] = CURATED[selection.index];
      return generate(seed, name);
    }
    return generate(selection.seed);
  }, [selection]);

  const step = useCallback((dir: 1 | -1) => {
    setSelection((s) => ({ index: (("index" in s ? s.index : 0) + dir + CURATED.length) % CURATED.length }));
  }, []);
  const shuffle = useCallback(() => setSelection({ seed: 100 + Math.floor(Math.random() * 99900) }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cellsCanvas = cellsRef.current;
    if (!canvas || !cellsCanvas) return;

    // Voronoi cells behind the emblem; waves bend them and the hold pinches them.
    const cellColor = new THREE.Color();
    const gapColor = new THREE.Color();
    const accentColor = new THREE.Color();
    const cellsRenderer = new THREE.WebGLRenderer({ canvas: cellsCanvas, antialias: false });
    const cellsMaterial = createCellsMaterial({ cell: cellColor, gap: gapColor, accent: accentColor });
    if (loop) cellsMaterial.uniforms.uDrift.value = (Math.PI * 2) / SCRIPT_SECONDS;
    const cellsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cellsMaterial);
    cellsQuad.frustumCulled = false;
    const cellsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const ctx = canvas.getContext("2d")!;
    const glowCanvas = document.createElement("canvas");
    const glow = glowCanvas.getContext("2d")!;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let theme: (typeof THEMES)[keyof typeof THEMES] = THEMES.light;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let unit = 1;

    let sprites: Sprite[] = [];
    const waves: Wave[] = [];
    const pointer = { x: 0, y: 0, active: false };
    const hold = { active: false, charge: 0, x: 0, y: 0 };
    let nextMorph: { x: number; y: number; at: number } | null = null;
    const start = performance.now();
    let clock = 0;
    let lastInput = -Infinity;
    let raf = 0;
    let last = 0;
    let sleeping = true;
    let loopClock = 0;

    const toPx = (gx: number, gy: number) => [width / 2 + gx * unit, height / 2 + gy * unit] as const;

    const setColors = () => {
      cellColor.set(theme.background);
      gapColor.set(theme.gap);
      accentColor.set(theme.accent);
    };
    const applyTheme = () => {
      theme = document.documentElement.classList.contains("dark") ? THEMES.dark : THEMES.light;
      setColors();
      wake();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = loop ? window.devicePixelRatio || 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = glowCanvas.width = Math.round(width * dpr);
      canvas.height = glowCanvas.height = Math.round(height * dpr);
      unit = Math.min(Math.min(width, height) * 0.64, 540) / GRID;
      cellsRenderer.setPixelRatio(dpr);
      cellsRenderer.setSize(width, height, false);
      cellsMaterial.uniforms.uPixelRatio.value = dpr;
      cellsMaterial.uniforms.uViewport.value.set(width, height);
      wake();
    };

    const spawn = (x: number, y: number, s: number): Sprite => ({
      x, y, vx: 0, vy: 0, s, vs: 0, rot: 0, vrot: 0, opacity: 0, heat: 0,
      tx: x, ty: y, ts: s, to: 0, free: false, hit: new Set(), pending: null,
    });

    // Cells pair up by angle so the emblem swirls into the next one; extras
    // split off or merge away. Delays radiate from `origin`.
    const morph = (next: Pattern) => {
      const origin = nextMorph ?? { x: 0, y: 0, at: clock };
      nextMorph = null;
      const live = (p: Sprite) => (p.pending ? p.pending.o : p.to) > 0;
      const sources = sprites.filter(live).sort((a, b) => polarKey(a.x, a.y) - polarKey(b.x, b.y));
      const targets = [...next.cells].sort((a, b) => polarKey(a.x, a.y) - polarKey(b.x, b.y));
      sprites.filter((p) => !live(p)).forEach((p) => (p.to = 0));

      const assign = (p: Sprite, x: number, y: number, o: number) => {
        const d = Math.hypot(centre(x) - origin.x, centre(y) - origin.y);
        p.pending = { x, y, s: o > 0 ? 1 : MORPH.splitScale, o, at: reducedMotion ? clock : origin.at + d * MORPH.stagger };
      };

      if (sources.length === 0) {
        for (const t of targets) {
          const p = spawn((GRID - 1) / 2, (GRID - 1) / 2, MORPH.splitScale);
          assign(p, t.x, t.y, 1);
          sprites.push(p);
        }
      } else if (targets.length >= sources.length) {
        const used = new Set<Sprite>();
        targets.forEach((t, j) => {
          const src = sources[Math.floor((j * sources.length) / targets.length)];
          if (!used.has(src)) {
            used.add(src);
            assign(src, t.x, t.y, 1);
          } else {
            const p = spawn(src.x, src.y, MORPH.splitScale);
            Object.assign(p, { vx: src.vx, vy: src.vy, rot: src.rot, vrot: src.vrot, free: src.free });
            assign(p, t.x, t.y, 1);
            sprites.push(p);
          }
        });
      } else {
        const kept = new Set<number>();
        sources.forEach((src, i) => {
          const j = Math.floor((i * targets.length) / sources.length);
          assign(src, targets[j].x, targets[j].y, kept.has(j) ? 0 : 1);
          kept.add(j);
        });
      }

      if (reducedMotion) {
        for (const p of sprites) {
          if (!p.pending) continue;
          Object.assign(p, { x: p.pending.x, y: p.pending.y, s: p.pending.s, opacity: p.pending.o, to: p.pending.o, free: false, pending: null });
        }
        sprites = sprites.filter((p) => p.to > 0);
      }
      wake();
    };

    // Drives the same pointer / hold / release paths that real input uses.
    const followScript = (dt: number) => {
      loopClock += dt;
      const c = cursorAt(loopClock);
      Object.assign(pointer, { x: c.x, y: c.y, active: true });
      if (c.pressed && !hold.active) Object.assign(hold, { x: c.x, y: c.y, active: true, charge: 0 });
      if (!c.pressed && hold.active) {
        hold.active = false;
        waves.push({ x: hold.x, y: hold.y, t0: clock, sonic: false, strength: 1 });
      }
      const cursor = cursorRef.current;
      if (cursor) {
        const [px, py] = toPx(c.x, c.y);
        cursor.style.transform = `translate(${px}px, ${py}px) scale(${c.pressed ? 0.86 : 1})`;
      }
    };

    const update = (dt: number) => {
      if (loop) followScript(dt);
      // Charge builds while held and drains quickly after.
      hold.charge = hold.active
        ? Math.min(1, hold.charge + dt / CHARGE.seconds)
        : Math.max(0, hold.charge - dt * 6);
      const charge = hold.active ? 1 - (1 - hold.charge) ** 2 : 0;

      for (let w = waves.length - 1; w >= 0; w--) {
        const life = waves[w].sonic ? 1.8 : 1.6;
        if (clock - waves[w].t0 > life) waves.splice(w, 1);
      }

      let moving = waves.length > 0 || hold.active || hold.charge > 0 || nextMorph !== null;
      let energy = 0;

      for (const p of sprites) {
        if (p.pending && clock >= p.pending.at) {
          Object.assign(p, { tx: p.pending.x, ty: p.pending.y, ts: p.pending.s, to: p.pending.o, free: false });
          p.pending = null;
        }
        if (p.pending) moving = true;

        const cx = centre(p.x);
        const cy = centre(p.y);
        let ox = 0;
        let oy = 0;
        let os = 1;

        if (charge > 0) {
          ox += (hold.x - centre(p.tx)) * CHARGE.pull * charge;
          oy += (hold.y - centre(p.ty)) * CHARGE.pull * charge;
          os -= CHARGE.shrink * charge;
          p.heat = Math.max(p.heat, CHARGE.heat * charge);
        } else if (pointer.active) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < REPEL.radius) {
            const f = (1 - d / REPEL.radius) ** 2;
            ox += (dx / (d || 1)) * REPEL.push * f;
            oy += (dy / (d || 1)) * REPEL.push * f;
            os -= REPEL.shrink * f;
          }
        }

        for (const w of waves) {
          const dx = cx - w.x;
          const dy = cy - w.y;
          const d = Math.hypot(dx, dy) || 1;
          if (w.sonic) {
            // One violent kick as the front passes: outward, sideways, spinning.
            if (!p.hit.has(w) && d <= (clock - w.t0) * SONIC.speed) {
              p.hit.add(w);
              const kick = SONIC.force * w.strength * (0.6 + Math.random() * 0.8) * 0.016;
              const side = (Math.random() - 0.5) * 2 * SONIC.swirl;
              p.vx += (dx / d) * kick - (dy / d) * kick * side;
              p.vy += (dy / d) * kick + (dx / d) * kick * side;
              p.vrot += (Math.random() - 0.5) * 2 * SONIC.spin * w.strength;
              p.heat = 1;
              p.free = true;
            }
          } else {
            const front = Math.exp(-(((d - (clock - w.t0) * RIPPLE.speed) / RIPPLE.band) ** 2));
            const falloff = 1 - Math.min(1, d / 20);
            p.vx += (dx / d) * RIPPLE.force * front * falloff * dt;
            p.vy += (dy / d) * RIPPLE.force * front * falloff * dt;
            p.heat = Math.max(p.heat, front * RIPPLE.heat * falloff);
          }
        }
        p.heat = Math.max(0, p.heat - 2.4 * dt);

        const { stiffness: k, damping: b } = SPRING;
        if (p.free) {
          // Scrambled pixels drift with drag until their new target claims them.
          const drag = Math.exp(-3.2 * dt);
          p.vx *= drag;
          p.vy *= drag;
        } else {
          p.vx += (k * (p.tx + ox - p.x) - b * p.vx) * dt;
          p.vy += (k * (p.ty + oy - p.y) - b * p.vy) * dt;
        }
        p.vs += (k * (p.ts * os - p.s) - b * p.vs) * dt;
        p.vrot += (-k * 0.6 * p.rot - b * 0.8 * p.vrot) * dt * (p.free ? 0.15 : 1);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.s += p.vs * dt;
        p.rot += p.vrot * dt;

        const rate = p.to > p.opacity ? MORPH.fadeIn : MORPH.fadeOut;
        p.opacity += (p.to - p.opacity) * (1 - Math.exp(-rate * dt));

        const speed = Math.hypot(p.vx, p.vy);
        energy = Math.max(energy, speed);
        if (
          p.free ||
          p.heat > 0.002 ||
          Math.abs(p.to - p.opacity) > 0.002 ||
          speed + Math.abs(p.vs) + Math.abs(p.vrot) > 0.004 ||
          Math.abs(p.tx + ox - p.x) + Math.abs(p.ty + oy - p.y) + Math.abs(p.ts * os - p.s) + Math.abs(p.rot) > 0.003
        )
          moving = true;
      }

      if (nextMorph && clock >= nextMorph.at) {
        // The React side picks the new pattern; morph() picks up this origin.
        window.dispatchEvent(new CustomEvent("pixel-emblem:sonic"));
        nextMorph = { ...nextMorph, at: clock };
      }

      sprites = sprites.filter((p) => !(p.to === 0 && !p.pending && p.opacity < 0.01));
      return { moving, energy, charge };
    };

    const draw = (energy: number, charge: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Trails: fast motion leaves streaks by only partly erasing the frame.
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1 - Math.min(0.72, energy / 40);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      const size = PIXEL.size * unit;
      const radius = PIXEL.radius * unit;
      const tremble = charge ** 2 * CHARGE.tremble * unit;
      const shapes = sprites.map((p) => {
        const [px, py] = toPx(centre(p.x), centre(p.y));
        const speed = Math.hypot(p.vx, p.vy);
        const split = Math.min(SPLIT.max, speed * SPLIT.perSpeed + charge * 0.12) * unit;
        return {
          p,
          x: px + (tremble ? (Math.random() - 0.5) * tremble : 0),
          y: py + (tremble ? (Math.random() - 0.5) * tremble : 0),
          dx: speed > 1e-3 ? (p.vx / speed) * split : split,
          dy: speed > 1e-3 ? (p.vy / speed) * split : 0,
        };
      });
      const pixel = (c: CanvasRenderingContext2D, x: number, y: number, p: Sprite) => {
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.translate(x, y);
        c.rotate(p.rot);
        c.scale(p.s, p.s);
        c.beginPath();
        c.roundRect(-size / 2, -size / 2, size, size, radius);
        c.fill();
      };

      // Bloom: a blurred copy of the lit pixels under the sharp ones.
      glow.setTransform(1, 0, 0, 1, 0, 0);
      glow.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
      glow.fillStyle = `rgb(${theme.ink.join(",")})`;
      for (const s of shapes) {
        glow.globalAlpha = s.p.opacity;
        pixel(glow, s.x, s.y, s.p);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = theme.blend === "lighter" ? "lighter" : "multiply";
      ctx.globalAlpha = GLOW.alpha * (theme.blend === "lighter" ? 1 : 0.5);
      ctx.filter = `blur(${GLOW.blur * unit * dpr}px)`;
      ctx.drawImage(glowCanvas, 0, 0);
      ctx.filter = "none";

      // Three channel passes; they sum (dark) or multiply (light) back to ink at
      // rest and fringe apart along each pixel's velocity in motion.
      const [r, g, b] = theme.ink;
      const channels =
        theme.blend === "lighter"
          ? [`rgb(${r},0,0)`, `rgb(0,${g},0)`, `rgb(0,0,${b})`]
          : [`rgb(${r},255,255)`, `rgb(255,${g},255)`, `rgb(255,255,${b})`];
      ctx.globalCompositeOperation = theme.blend;
      channels.forEach((color, i) => {
        ctx.fillStyle = color;
        const k = i - 1; // -1, 0, +1
        for (const s of shapes) {
          ctx.globalAlpha = s.p.opacity;
          pixel(ctx, s.x + s.dx * k, s.y + s.dy * k, s.p);
        }
      });

      // Heat glazes pixels with the accent.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = theme.accent;
      for (const s of shapes) {
        if (s.p.heat < 0.01) continue;
        ctx.globalAlpha = s.p.heat * s.p.opacity;
        pixel(ctx, s.x, s.y, s.p);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = theme.accent;
      // Charge ring closing in on the finger.
      if (hold.active && charge > 0.02) {
        const [hx, hy] = toPx(hold.x, hold.y);
        ctx.globalAlpha = Math.min(1, charge * 1.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hx, hy, unit * (0.8 + 3.2 * (1 - charge)), 0, Math.PI * 2 * charge);
        ctx.stroke();
      }
      // Sonic rings.
      for (const w of waves) {
        if (!w.sonic) continue;
        const age = (clock - w.t0) / SONIC.ringLife;
        if (age > 1) continue;
        const [wx, wy] = toPx(w.x, w.y);
        for (let i = 0; i < 3; i++) {
          const a = age - i * 0.08;
          if (a <= 0) continue;
          ctx.globalAlpha = (1 - a) ** 2 * w.strength * (1 - i * 0.3);
          ctx.lineWidth = (1 - a) * 3 + 0.5;
          ctx.beginPath();
          ctx.arc(wx, wy, a * SONIC.ringLife * SONIC.speed * unit, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawCells = (charge: number) => {
      const u = cellsMaterial.uniforms;
      u.uTime.value = clock;
      const slots = u.uWaves.value as THREE.Vector4[];
      slots.forEach((v) => v.set(0, 0, 0, 0));
      waves.slice(-CELLS_WAVES).forEach((w, i) => {
        const age = clock - w.t0;
        const [x, y] = toPx(w.x, w.y);
        const radius = age * (w.sonic ? SONIC.speed : RIPPLE.speed) * unit;
        const strength = w.sonic ? w.strength * Math.exp(-age * 1.4) : 0.35 * Math.exp(-age * 2);
        slots[i].set(x, y, radius, strength);
      });
      const [hx, hy] = toPx(hold.x, hold.y);
      (u.uHold.value as THREE.Vector3).set(hx, hy, charge);
      cellsRenderer.render(cellsQuad, cellsCamera);
    };

    // The loop sleeps once everything settles; input or a morph wakes it.
    const frame = (now: number) => {
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      clock = (now - start) / 1000;
      const { moving, energy, charge } = update(dt);
      drawCells(charge);
      draw(energy, charge);
      if (moving || loop) raf = requestAnimationFrame(frame);
      else sleeping = true;
    };
    function wake() {
      if (!sleeping) return;
      sleeping = false;
      last = performance.now();
      clock = (last - start) / 1000;
      raf = requestAnimationFrame(frame);
    }

    const toGrid = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left - width / 2) / unit, y: (e.clientY - r.top - height / 2) / unit };
    };
    const onMove = (e: PointerEvent) => {
      if (loop) return;
      const p = toGrid(e);
      Object.assign(pointer, p, { active: true });
      if (hold.active) Object.assign(hold, p);
      lastInput = clock;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || reducedMotion || loop) return;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      Object.assign(hold, toGrid(e), { active: true, charge: 0 });
      lastInput = clock;
      wake();
    };
    const onUp = () => {
      if (!hold.active || loop) return;
      hold.active = false;
      lastInput = clock;
      const strength = 1 - (1 - hold.charge) ** 2;
      if (hold.charge < CHARGE.tapBelow) {
        waves.push({ x: hold.x, y: hold.y, t0: clock, sonic: false, strength: 1 });
      } else {
        waves.push({ x: hold.x, y: hold.y, t0: clock, sonic: true, strength });
        nextMorph = { x: hold.x, y: hold.y, at: clock + SONIC.freeFor };
      }
      wake();
    };
    const onLeave = () => {
      if (loop) return;
      pointer.active = false;
      wake();
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    theme = document.documentElement.classList.contains("dark") ? THEMES.dark : THEMES.light;
    setColors();
    resize();
    if (loop) wake();

    engineRef.current = { morph, idleFor: () => (performance.now() - start) / 1000 - lastInput };

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      engineRef.current = null;
      cellsQuad.geometry.dispose();
      cellsMaterial.dispose();
      cellsRenderer.dispose();
    };
  }, [loop]);

  useEffect(() => {
    engineRef.current?.morph(pattern);
  }, [pattern]);

  // A released charge asks for a brand-new pattern.
  useEffect(() => {
    window.addEventListener("pixel-emblem:sonic", shuffle);
    return () => window.removeEventListener("pixel-emblem:sonic", shuffle);
  }, [shuffle]);

  // Auto-advance through the curated set while nobody is interacting.
  useEffect(() => {
    if (loop || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if ((engineRef.current?.idleFor() ?? 0) > IDLE.after) step(1);
    }, IDLE.every * 1000);
    return () => window.clearInterval(id);
  }, [step, loop]);

  const button =
    "grid size-9 place-items-center rounded-[6px] text-[#8a8781] transition-[scale,color] duration-150 ease-out hover:text-[#1d1c1a] active:scale-[0.96] dark:text-[#75736e] dark:hover:text-[#ecebe8]";

  return (
    <div className="relative h-full w-full touch-none select-none bg-[#f2f0ec] dark:bg-[#1a1a19]">
      <canvas ref={cellsRef} className="absolute inset-0 size-full" aria-hidden />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full cursor-crosshair"
        role="img"
        aria-label={`${pattern.name} pixel emblem. Hold and release to scramble it into a new pattern.`}
      />
      {loop && (
        <div ref={cursorRef} className="pointer-events-none absolute top-0 left-0 origin-top-left" aria-hidden>
          <svg width="40" height="40" viewBox="0 0 24 24" className="-mt-[4px] -ml-[8px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
            <path
              d="M5 2.5v17.2l4.3-4.1 2.8 6.4 3-1.3-2.8-6.3h6.1L5 2.5Z"
              fill="#fff"
              stroke="#111"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div className={`pointer-events-none absolute inset-x-0 bottom-8 ${loop ? "hidden" : "flex"} flex-col items-center gap-3`}>
        <p className="text-sm text-[#8a8781] dark:text-[#75736e]">Hold, then let go</p>
        <div className="pointer-events-auto flex items-center gap-1 text-sm">
          <button type="button" className={button} onClick={() => step(-1)} aria-label="Previous pattern">
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>
          <span className="w-28 text-center font-medium tabular-nums text-[#1d1c1a] dark:text-[#ecebe8]">{pattern.name}</span>
          <button type="button" className={button} onClick={() => step(1)} aria-label="Next pattern">
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
          <button type="button" className={button} onClick={shuffle} aria-label="Random pattern">
            <Shuffle className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
