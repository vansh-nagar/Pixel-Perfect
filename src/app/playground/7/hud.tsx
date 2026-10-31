"use client";

/**
 * Racing-game HUD in the open-world style: tachometer dial with gear and speed (bottom
 * right), rotating minimap with the winding road ahead (bottom left), distance and timer
 * (top left).
 * Everything updates imperatively through `update()` each frame; React never re-renders.
 *
 * The tachometer is a Rive file (public/playground/car/speedometer.riv, source in
 * rive/speedometer): the page writes `rpm`, `speedText` and `gear` into its view model and
 * Rive turns the needle, fills the arc and sets the readouts.
 */

import { Fit, Layout, Rive, type ViewModelInstanceNumber, type ViewModelInstanceString } from "@rive-app/canvas";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type HudFrame = {
  speed: number; // km/h
  rpm: number;
  redline: number;
  gear: string;
  yaw: number;
  x: number;
  z: number;
  distance: number; // m
  time: number; // s
  roadWidth: number;
  route: Float32Array | null; // centreline points [x0, z0, x1, z1, ...], same frame as x, z
};
export type HudHandle = { update: (f: HudFrame) => void };

const SPEEDO = { src: "/playground/car/speedometer.riv", width: 280, height: 250 };

const MAP = { size: 150, metresPerPx: 1.1 };

const formatTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
};

function drawMap(canvas: HTMLCanvasElement, f: HudFrame) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = MAP.size * dpr;
  if (canvas.width !== size) canvas.width = canvas.height = size;
  const c = canvas.getContext("2d")!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, size, size);
  c.save();
  c.beginPath();
  c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = "rgba(14,18,22,0.62)";
  c.fillRect(0, 0, size, size);

  // Heading up: rotate the world around the car.
  const k = dpr / MAP.metresPerPx;
  c.translate(size / 2, size / 2 + size * 0.12);
  c.rotate(f.yaw + Math.PI);
  c.scale(k, k);
  c.translate(-f.x, -f.z);
  // Faint terrain grid so motion reads even on a straight road.
  c.strokeStyle = "rgba(255,255,255,0.05)";
  c.lineWidth = 1 / k;
  const g = 40;
  const reach = (size / k) * 0.9;
  for (let gx = Math.floor((f.x - reach) / g) * g; gx < f.x + reach; gx += g) {
    c.beginPath();
    c.moveTo(gx, f.z - reach);
    c.lineTo(gx, f.z + reach);
    c.stroke();
  }
  for (let gz = Math.floor((f.z - reach) / g) * g; gz < f.z + reach; gz += g) {
    c.beginPath();
    c.moveTo(f.x - reach, gz);
    c.lineTo(f.x + reach, gz);
    c.stroke();
  }
  if (f.route && f.route.length >= 4) {
    const r = f.route;
    const trace = () => {
      c.beginPath();
      c.moveTo(r[0], r[1]);
      for (let i = 2; i < r.length; i += 2) c.lineTo(r[i], r[i + 1]);
    };
    c.lineJoin = c.lineCap = "round";
    c.strokeStyle = "rgba(205,210,215,0.55)";
    c.lineWidth = f.roadWidth;
    trace();
    c.stroke();
    // Route ahead, in the GPS blue.
    c.strokeStyle = "#3fc1ff";
    c.lineWidth = 5 / k;
    trace();
    c.stroke();
  }
  c.restore();

  // Player arrow.
  const ax = size / 2;
  const ay = size / 2 + size * 0.12;
  const s = 9 * dpr;
  c.fillStyle = "#ffffff";
  c.strokeStyle = "rgba(0,0,0,0.5)";
  c.lineWidth = 1.5 * dpr;
  c.beginPath();
  c.moveTo(ax, ay - s);
  c.lineTo(ax + s * 0.7, ay + s * 0.75);
  c.lineTo(ax, ay + s * 0.35);
  c.lineTo(ax - s * 0.7, ay + s * 0.75);
  c.closePath();
  c.fill();
  c.stroke();
}

type Speedo = { rpm: ViewModelInstanceNumber | null; speed: ViewModelInstanceString | null; gear: ViewModelInstanceString | null };

export function Hud({ ref }: { ref: Ref<HudHandle> }) {
  const dialRef = useRef<HTMLCanvasElement>(null);
  const speedo = useRef<Speedo | null>(null);
  // Last values written, so the view model is only touched when something changes.
  const shown = useRef({ rpm: -1, speed: "", gear: "" });
  const mapRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = dialRef.current;
    if (!canvas) return;
    const rive = new Rive({
      src: SPEEDO.src,
      canvas,
      autoplay: true,
      autoBind: true,
      stateMachines: "Live",
      layout: new Layout({ fit: Fit.Contain }),
      onLoad: () => {
        rive.resizeDrawingSurfaceToCanvas();
        const vm = rive.viewModelInstance;
        speedo.current = vm ? { rpm: vm.number("rpm"), speed: vm.string("speedText"), gear: vm.string("gear") } : null;
        shown.current = { rpm: -1, speed: "", gear: "" };
      },
    });
    return () => {
      speedo.current = null;
      rive.cleanup();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    update(f) {
      const s = speedo.current;
      if (s) {
        const rpm = Math.round(f.rpm / 10) * 10;
        const speed = String(Math.min(999, Math.round(f.speed)));
        if (s.rpm && rpm !== shown.current.rpm) s.rpm.value = shown.current.rpm = rpm;
        if (s.speed && speed !== shown.current.speed) s.speed.value = shown.current.speed = speed;
        if (s.gear && f.gear !== shown.current.gear) s.gear.value = shown.current.gear = f.gear;
      }
      if (distRef.current) distRef.current.textContent = (f.distance / 1000).toFixed(1);
      if (timeRef.current) timeRef.current.textContent = formatTime(f.time);
      if (mapRef.current) drawMap(mapRef.current, f);
    },
  }));

  const shadow = "drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]";

  return (
    <div className="pointer-events-none absolute inset-0 font-sans text-white select-none">
      {/* Top left: progress and timer */}
      <div className={`absolute top-16 left-6 w-64 ${shadow}`}>
        <div className="flex items-baseline gap-2">
          <span ref={distRef} className="text-[40px] leading-none font-bold tabular-nums tracking-tight">
            0.0
          </span>
          <span className="text-[17px] font-semibold">km</span>
          <span className="text-[15px] font-medium text-white/85">Distance</span>
        </div>
        <div className="mt-2 flex h-6 items-center justify-between bg-black/45 px-2.5 text-[13px] font-semibold">
          <span className="text-white/85">Time</span>
          <span ref={timeRef} className="tabular-nums">
            00:00.000
          </span>
        </div>
      </div>

      {/* Bottom left: minimap */}
      <div className={`absolute bottom-7 left-7 ${shadow}`}>
        <div className="relative size-[150px] rounded-full ring-2 ring-white/25">
          <canvas ref={mapRef} className="size-full rounded-full" />
        </div>
      </div>

      {/* Bottom right: tachometer, gear, speed; sits above the playground pager. */}
      <canvas
        ref={dialRef}
        width={SPEEDO.width}
        height={SPEEDO.height}
        style={{ width: SPEEDO.width, height: SPEEDO.height }}
        className={`absolute right-4 bottom-16 ${shadow}`}
      />
    </div>
  );
}
