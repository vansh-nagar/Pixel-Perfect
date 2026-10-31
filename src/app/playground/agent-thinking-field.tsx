"use client";

/**
 * Agent thinking, made visual: a dot-matrix field that moves through what an agent is doing.
 *
 *  Reading   a scan band sweeps the field, flickering 0/1 glyphs, leaving lines of "text" behind
 *  Thinking  twisted rays turn around a hollow centre while pulses run outward
 *  Tool call the field collapses into nodes; a packet travels each edge
 *  Done      an anti-aliased checkmark draws on
 *
 * Every stage is a field function f(x, y, t) -> 0..1. A GSAP timeline only tweens the
 * phase between stages; each dot crossfades the two neighbouring fields on a delay set by
 * its distance from the centre, so every change ripples outward instead of cutting. The
 * canvas redraws on gsap.ticker; dots are quantised into 16 brightness buckets so each
 * frame is ~17 fills, not one per dot. Colours come from the theme (foreground, --color-1),
 * read every frame, so the field follows the light/dark toggle.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const GAP = 8; // CSS px between dot centres
const LEVELS = 16;

const STAGES = ["Ready", "Reading context", "Thinking", "Calling search_docs", "Done"];

const hash = (i: number, j: number) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Tool-call graph: one hub, three services.
const NODES = [
  [-0.58, -0.46],
  [0.6, -0.4],
  [0.46, 0.56],
];
// Checkmark polyline (y points down), drawn on by arc length.
const CHECK = [
  [-0.34, 0.02],
  [-0.1, 0.26],
  [0.36, -0.22],
];
const SEG_A = Math.hypot(CHECK[1][0] - CHECK[0][0], CHECK[1][1] - CHECK[0][1]);
const SEG_B = Math.hypot(CHECK[2][0] - CHECK[1][0], CHECK[2][1] - CHECK[1][1]);
const STROKE = 0.045; // half-width of the tick, in field units

/** Distance from p to segment a-b, plus how far along it (0..1) the nearest point sits. */
function toSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const s = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
  return { d: Math.hypot(px - (ax + s * dx), py - (ay + s * dy)), s };
}

const Corner = ({ className }: { className: string }) => (
  <span className={`pointer-events-none absolute size-2.5 text-muted-foreground ${className}`}>
    <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
    <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current" />
  </span>
);

export default function AgentThinkingField() {
  const frame = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const stepRef = useRef<HTMLSpanElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let size = 0;
      let cols = 0;
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const box = canvas.parentElement!;
        const pad = getComputedStyle(box);
        size = box.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
        cols = Math.floor(size / GAP);
        canvas.style.width = canvas.style.height = `${size}px`;
        canvas.width = canvas.height = Math.round(size * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas.parentElement!);

      // phase walks 0 → 5 through idle, read, think, tool, answer and back to idle (5 ≡ 0).
      // Between two integers the draw loop crossfades those two stages per dot, so the
      // timeline never touches individual stages; draw and scan drive motion inside one.
      const W = { phase: 0, draw: 0, scan: -1.2 };

      const setStage = (n: number) => {
        labelRef.current!.textContent = STAGES[n];
        stepRef.current!.textContent = `0${n} / 04`;
        gsap.fromTo(labelRef.current, { opacity: 0, y: 3 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
        Array.from(barsRef.current!.children).forEach((el, k) => {
          gsap.to(el, { opacity: k + 1 === n ? 1 : k + 1 < n ? 0.35 : 0.1, duration: 0.4 });
        });
      };

      const X = 1.2; // transition: a ripple from the centre out, ~0.5s per dot
      const tl = gsap.timeline({ repeat: reduced ? 0 : -1, defaults: { ease: "none" } });
      tl.set(W, { phase: 0, draw: 0, scan: -1.2 })
        .call(setStage, [0], 0)
        .to(W, { phase: 1, duration: X }, 1)
        .call(setStage, [1], 1)
        .to(W, { scan: 1.2, duration: 2.8, ease: "sine.inOut" }, 1.2)
        .to(W, { phase: 2, duration: X }, 4)
        .call(setStage, [2], 4)
        .to(W, { phase: 3, duration: X }, 7.2)
        .call(setStage, [3], 7.2)
        .to(W, { phase: 4, duration: X }, 10.2)
        .call(setStage, [4], 10.2)
        .to(W, { draw: 1, duration: 0.9, ease: "power3.inOut" }, 10.8)
        .to(W, { phase: 5, duration: X }, 13.4)
        .call(setStage, [0], 13.4)
        .set(W, { draw: 0 }, 14.6)
        .to({}, { duration: 0.2 }, 14.6);
      if (reduced) tl.pause(5.5);

      const paths = Array.from({ length: LEVELS }, () => new Path2D());
      let fpsAcc = 0;
      let fpsFrames = 0;

      const draw = (time: number, deltaTime: number) => {
        const t = reduced ? 5.5 : time;
        const rows = cols;
        const pitch = size / cols;
        const r0 = pitch * 0.1;
        const rStep = (pitch * 0.24) / (LEVELS - 1);

        for (let l = 0; l < LEVELS; l++) paths[l] = new Path2D();
        const accent = new Path2D();
        const glyphs: [number, number, string, number][] = [];

        const scan = W.scan;
        const L = W.draw * (SEG_A + SEG_B);
        const pulses = NODES.map((_, k) => (t * 0.7 + k / 3) % 1);
        const from = Math.min(Math.floor(W.phase), 4);
        const frac = W.phase - from;
        const to = (from + 1) % 5;

        for (let j = 0; j < rows; j++) {
          const y = (j / (rows - 1)) * 2 - 1;
          for (let i = 0; i < cols; i++) {
            const x = (i / (cols - 1)) * 2 - 1;
            const r = Math.hypot(x, y);
            let I = 0;
            let hot = 0;
            let glyph = false;
            // Centre dots switch first, corners last: delay grows with distance.
            const e = smooth(0, 1, (frac - 0.4 * Math.min(r / Math.SQRT2, 1)) / 0.6);
            const w = (stage: number) => (stage === from % 5 ? 1 - e : 0) + (stage === to ? e : 0);
            const wIdle = w(0);
            const wRead = w(1);
            const wThink = w(2);
            const wTool = w(3);
            const wAnswer = w(4);

            if (wIdle > 0.001) {
              I += wIdle * (0.05 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.6 - r * 5)) * (1 - smooth(0.5, 1, r)));
            }

            if (wRead > 0.001) {
              const band = Math.exp(-(((x - scan) / 0.06) ** 2));
              // Behind the band: lines of text (every third row, word-sized runs, ragged right edge).
              const isText =
                j % 3 === 0 &&
                i > 3 &&
                i < cols * (0.55 + 0.38 * hash(j, 99)) &&
                hash(j, Math.floor(i / 5)) > 0.22;
              const residue = x < scan && isText ? 0.42 : 0.03;
              I += wRead * Math.max(band, residue);
              if (wRead > 0.3 && band > 0.5 && j % 2 === 0) {
                glyph = true;
                glyphs.push([i, j, hash(i * 7 + j, Math.floor(t * 14)) > 0.5 ? "1" : "0", band * wRead]);
              }
            }

            if (wThink > 0.001) {
              const a = Math.atan2(y, x);
              const ray = (0.5 + 0.5 * Math.cos(a * 20 + t * 0.9 + 3 * Math.sin(r * 5 - t * 1.3))) ** 6;
              const pulse = 0.5 + 0.5 * Math.sin(r * 16 - t * 5);
              const env = smooth(0.12, 0.2, r) * (1 - smooth(0.7, 0.92, r));
              I += wThink * env * (0.1 + 0.9 * ray * (0.5 + 0.5 * pulse));
            }

            if (wTool > 0.001) {
              let f = 0.03;
              if (Math.max(Math.abs(x), Math.abs(y)) < 0.09) f = 0.95;
              NODES.forEach(([nx, ny], k) => {
                const p = pulses[k];
                if (Math.max(Math.abs(x - nx), Math.abs(y - ny)) < 0.065) {
                  f = Math.max(f, 0.4 + 0.6 * (p < 0.18 ? 1 - p / 0.18 : 0));
                  return;
                }
                const { d, s } = toSegment(x, y, 0, 0, nx, ny);
                if (d < 0.022) {
                  const bump = Math.exp(-(((s - p) / 0.04) ** 2));
                  f = Math.max(f, 0.3 + 0.65 * bump);
                  if (bump > 0.5 && s > 0.2) hot = Math.max(hot, wTool);
                }
              });
              I += wTool * f;
            }

            if (wAnswer > 0.001) {
              let f = 0.04;
              // Anti-aliased stroke: brightness falls off with distance from the drawn part of the
              // polyline, so edge dots come out smaller and the tick reads as one smooth line.
              const a = toSegment(x, y, CHECK[0][0], CHECK[0][1], CHECK[1][0], CHECK[1][1]);
              const b = toSegment(x, y, CHECK[1][0], CHECK[1][1], CHECK[2][0], CHECK[2][1]);
              const reachA = Math.min(SEG_A, L) / SEG_A;
              const reachB = clamp01((L - SEG_A) / SEG_B);
              const dA = L > 0 ? toSegment(x, y, CHECK[0][0], CHECK[0][1], CHECK[0][0] + (CHECK[1][0] - CHECK[0][0]) * reachA, CHECK[0][1] + (CHECK[1][1] - CHECK[0][1]) * reachA).d : 9;
              const dB = L > SEG_A ? toSegment(x, y, CHECK[1][0], CHECK[1][1], CHECK[1][0] + (CHECK[2][0] - CHECK[1][0]) * reachB, CHECK[1][1] + (CHECK[2][1] - CHECK[1][1]) * reachB).d : 9;
              const d = Math.min(dA, dB);
              f = Math.max(f, 1 - smooth(STROKE - 0.025, STROKE + 0.015, d));
              // Leading edge of the stroke glows in the accent while it draws.
              const pos = a.d < b.d ? a.s * SEG_A : SEG_A + b.s * SEG_B;
              if (d < STROKE && W.draw < 0.98 && Math.abs(pos - L) < 0.05) hot = Math.max(hot, wAnswer);
              I += wAnswer * f;
            }

            if (glyph) continue;
            const cx = (i + 0.5) * pitch;
            const cy = (j + 0.5) * pitch;
            if (hot > 0.5) {
              const rad = r0 + rStep * (LEVELS - 3);
              accent.moveTo(cx + rad, cy);
              accent.arc(cx, cy, rad, 0, Math.PI * 2);
              continue;
            }
            const l = Math.min(LEVELS - 1, Math.floor(clamp01(I) * LEVELS));
            const rad = r0 + rStep * l;
            paths[l].moveTo(cx + rad, cy);
            paths[l].arc(cx, cy, rad, 0, Math.PI * 2);
          }
        }

        const css = getComputedStyle(canvas);
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = css.color;
        for (let l = 0; l < LEVELS; l++) {
          ctx.globalAlpha = 0.12 + 0.88 * (l / (LEVELS - 1));
          ctx.fill(paths[l]);
        }
        ctx.font = `500 ${Math.round(pitch * 1.1)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const [i, j, ch, band] of glyphs) {
          ctx.globalAlpha = 0.2 + 0.8 * clamp01(band);
          ctx.fillText(ch, (i + 0.5) * pitch, (j + 0.5) * pitch + 0.5);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = css.getPropertyValue("--color-1") || css.color;
        ctx.fill(accent);

        const tt = tl.time();
        const elapsed = Math.min(Math.max(tt - 1, 0), 9.2);
        timeRef.current!.textContent =
          tt < 1 ? "0.0s" : tt < 10.2 ? `${elapsed.toFixed(1)}s` : `thought for ${elapsed.toFixed(1)}s`;

        fpsAcc += deltaTime;
        fpsFrames++;
        if (fpsAcc > 500) {
          fpsRef.current!.textContent = `fps: ${Math.round((fpsFrames * 1000) / fpsAcc)} | dots: ${cols * rows}`;
          fpsAcc = 0;
          fpsFrames = 0;
        }
      };

      gsap.ticker.add(draw);
      return () => {
        gsap.ticker.remove(draw);
        ro.disconnect();
      };
    },
    { scope: frame },
  );

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 pt-20 pb-10 text-foreground">
      <div className="flex w-full max-w-140 flex-col gap-4">
        <div ref={frame} className="relative border border-border">
          <Corner className="-top-[5.5px] -left-[5.5px]" />
          <Corner className="-top-[5.5px] -right-[5.5px]" />
          <Corner className="-bottom-[5.5px] -left-[5.5px]" />
          <Corner className="-right-[5.5px] -bottom-[5.5px]" />

          <div className="flex items-center justify-between px-4 pt-3.5 font-mono text-xs">
            <span ref={labelRef} />
            <span ref={timeRef} className="text-muted-foreground tabular-nums" />
          </div>
          <div className="px-4 py-3">
            <canvas
              ref={canvasRef}
              className="block text-foreground"
              role="img"
              aria-label="Animated dot field showing an AI agent reading, thinking, calling a tool and answering"
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-3.5 font-mono text-xs text-muted-foreground tabular-nums">
            <span ref={stepRef} />
            <span ref={fpsRef}>fps: 60</span>
          </div>
        </div>

        <div ref={barsRef} className="grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((k) => (
            <span key={k} className="h-0.5 bg-foreground opacity-10" />
          ))}
        </div>
      </div>
    </div>
  );
}
