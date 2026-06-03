"use client";

/**
 * Dial knob — a tactile rotary knob built from layered discs with soft
 * neumorphic bevels. Click + drag around the knob to rotate; scroll
 * over it to step the value. An arc of amber dots inside the face
 * lights up to visualize the current value (0–100).
 */

import { useEffect, useRef, useState } from "react";

const DOT_COUNT = 30;
const OUTER_TICKS = 60;
const INNER_TICKS = 60;
const DOT_RADIUS = 88;

// Colors resolve from CSS variables declared on the root (see className),
// so the knob retints itself for light/dark without a theme hook.
const ACTIVE = "var(--knob-dot-active)";
const IDLE = "var(--knob-dot-idle)";
const TICK_OUTER = "var(--knob-tick-outer)";
const TICK_INNER = "var(--knob-tick-inner)";
const MARKER = "var(--knob-marker)";

const DialKnobMotion = () => {
  const [value, setValue] = useState(62);
  const knobRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastAngle = useRef(0);

  const getAngle = (clientX: number, clientY: number) => {
    const node = knobRef.current;
    if (!node) return 0;
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastAngle.current = getAngle(e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const angle = getAngle(e.clientX, e.clientY);
    let delta = angle - lastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    setValue((v) => Math.max(0, Math.min(100, v + delta / 3.6)));
    lastAngle.current = angle;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const node = knobRef.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setValue((v) => Math.max(0, Math.min(100, v - e.deltaY / 40)));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const filledDots = Math.round((value / 100) * DOT_COUNT);

  return (
    <div
      className="relative grid w-[320px] place-items-center select-none [--knob-disc-from:#FAFAFA] [--knob-disc-to:#E4E4E7] [--knob-face-from:#FFFFFF] [--knob-face-to:#F4F4F5] [--knob-hl:rgba(255,255,255,0.95)] [--knob-tick-outer:rgba(160,160,170,0.55)] [--knob-tick-inner:rgba(160,160,170,0.30)] [--knob-marker:#71717A] [--knob-dot-idle:#D4D4D8] [--knob-dot-active:#2A2A2A] dark:[--knob-disc-from:#26262A] dark:[--knob-disc-to:#161618] dark:[--knob-face-from:#2A2A2E] dark:[--knob-face-to:#1D1D20] dark:[--knob-hl:rgba(255,255,255,0.06)] dark:[--knob-tick-outer:rgba(200,200,215,0.30)] dark:[--knob-tick-inner:rgba(200,200,215,0.16)] dark:[--knob-marker:#A1A1AA] dark:[--knob-dot-idle:#3F3F46] dark:[--knob-dot-active:#F4F4F5]"
      style={{
        height: 300,
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      {/* Knob wrapper — handles pointer events, no visible style */}
      <div
        ref={knobRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative cursor-grab active:cursor-grabbing"
        style={{
          width: 240,
          height: 240,
          touchAction: "none",
        }}
      >
        {/* Outer disc shell — STATIC. Holds the gradient + shadows so the
            drop shadow doesn't spin when the knob rotates. */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, var(--knob-disc-from) 0%, var(--knob-disc-to) 100%)",
            boxShadow:
              "0 1px 0 var(--knob-hl) inset, 0 -2px 4px rgba(0,0,0,0.18) inset, 0 14px 28px -10px rgba(0,0,0,0.35), 0 4px 8px rgba(0,0,0,0.12)",
          }}
        />

        {/* Outer tick ring — ROTATES with value. Only the ticks turn, so
            the gradient lighting and drop shadow stay anchored. */}
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="-120 -120 240 240"
          style={{
            transform: `rotate(${(value / 100) * 360}deg)`,
            transition: dragging.current
              ? "none"
              : "transform 180ms ease-out",
          }}
        >
          {Array.from({ length: OUTER_TICKS }).map((_, i) => {
            const angle = (i / OUTER_TICKS) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const r1 = 114;
            const r2 = 108;
            // Emphasize a "12 o'clock" reference tick so rotation is
            // visually obvious.
            const isMarker = i === 0;
            return (
              <line
                key={`o-${i}`}
                x1={Math.cos(rad) * r1}
                y1={Math.sin(rad) * r1}
                x2={Math.cos(rad) * (isMarker ? 102 : r2)}
                y2={Math.sin(rad) * (isMarker ? 102 : r2)}
                strokeWidth={isMarker ? 1.6 : 1}
                strokeLinecap="round"
                style={{ stroke: isMarker ? MARKER : TICK_OUTER }}
              />
            );
          })}
        </svg>

        {/* Inner raised face — stays fixed so the dot arc reads as
            an absolute value indicator */}
        <div
          className="absolute"
          style={{
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, var(--knob-face-from) 0%, var(--knob-face-to) 100%)",
            boxShadow:
              "0 1px 0 var(--knob-hl) inset, 0 -1px 0 rgba(0,0,0,0.12) inset, 0 0 0 1px rgba(0,0,0,0.12), 0 8px 18px -6px rgba(0,0,0,0.30), 0 2px 4px rgba(0,0,0,0.12)",
          }}
        >
          {/* Inner tick ring (very faint, all the way around) */}
          <svg
            className="pointer-events-none absolute inset-0"
            viewBox="-100 -100 200 200"
          >
            {Array.from({ length: INNER_TICKS }).map((_, i) => {
              const angle = (i / INNER_TICKS) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const r1 = 96;
              const r2 = 93;
              return (
                <line
                  key={`i-${i}`}
                  x1={Math.cos(rad) * r1}
                  y1={Math.sin(rad) * r1}
                  x2={Math.cos(rad) * r2}
                  y2={Math.sin(rad) * r2}
                  strokeWidth={0.7}
                  strokeLinecap="round"
                  style={{ stroke: TICK_INNER }}
                />
              );
            })}

            {/* Idle dot trail — barely visible, blends with disc */}
            {Array.from({ length: DOT_COUNT }).map((_, i) => {
              const angle = (i / DOT_COUNT) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              return (
                <circle
                  key={`idle-${i}`}
                  cx={Math.cos(rad) * DOT_RADIUS}
                  cy={Math.sin(rad) * DOT_RADIUS}
                  r={1.6}
                  style={{ fill: IDLE }}
                />
              );
            })}

            {/* Faint connecting arc behind the active dots */}
            {filledDots > 1 &&
              (() => {
                const startRad = (-90 * Math.PI) / 180;
                const endA = ((filledDots - 1) / DOT_COUNT) * 360 - 90;
                const endRad = (endA * Math.PI) / 180;
                const large = endA - -90 > 180 ? 1 : 0;
                const sx = Math.cos(startRad) * DOT_RADIUS;
                const sy = Math.sin(startRad) * DOT_RADIUS;
                const ex = Math.cos(endRad) * DOT_RADIUS;
                const ey = Math.sin(endRad) * DOT_RADIUS;
                return (
                  <path
                    d={`M ${sx} ${sy} A ${DOT_RADIUS} ${DOT_RADIUS} 0 ${large} 1 ${ex} ${ey}`}
                    strokeWidth={0.6}
                    strokeOpacity={0.18}
                    fill="none"
                    strokeLinecap="round"
                    style={{ stroke: ACTIVE }}
                  />
                );
              })()}

            {/* Active dots */}
            {Array.from({ length: filledDots }).map((_, i) => {
              const angle = (i / DOT_COUNT) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const isLead = i === filledDots - 1;
              return (
                <circle
                  key={`active-${i}`}
                  cx={Math.cos(rad) * DOT_RADIUS}
                  cy={Math.sin(rad) * DOT_RADIUS}
                  r={isLead ? 3.2 : 2.4}
                  style={{
                    fill: ACTIVE,
                    transition: "r 180ms ease",
                  }}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DialKnobMotion;
