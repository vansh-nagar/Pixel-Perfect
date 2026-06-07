"use client";

import {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

/* -------------------------------------------------------------------------- */
/*  Displacement-map generator                                                */
/* -------------------------------------------------------------------------- */
// The effect rests on a single SVG filter primitive, feDisplacementMap. It reads
// a small PNG built on the fly from the lens shape and, for each pixel of the
// content behind the glass, uses the map's red/green channels to decide how far
// to bend that pixel. Outside the lens the map is neutral, so only the region
// under the glass refracts.

type LensParams = {
  width: number;
  height: number;
  borderRadius: number;
  /** Overall refraction strength (how hard the glass bends content). */
  scale: number;
  /** How far in from the edge, in px, the bend ramps up. */
  depth: number;
  /** Surface curve, 0–1: 0 = flat rim bevel → 1 = strongly domed. */
  curvature: number;
  /** Spreads the displacement outward, fattening the refracted ring. */
  splay: number;
};

type GeneratedMap = {
  dataUrl: string;
  scale: number;
  chromaAmount: number;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const smoothStep = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1e-6), 0, 1);
  return x * x * (3 - 2 * x);
};

// Signed distance to a rounded rectangle centred at the origin.
const roundedRectSDF = (
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  radius: number,
) => {
  const r = Math.min(radius, Math.min(halfW, halfH));
  const qx = Math.abs(x) - (halfW - r);
  const qy = Math.abs(y) - (halfH - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r;
};

function generateLensMap(p: LensParams): GeneratedMap {
  const w = Math.max(2, Math.round(p.width));
  const h = Math.max(2, Math.round(p.height));
  const halfW = w / 2;
  const halfH = h / 2;
  const depth = Math.max(0.5, p.depth);
  const strength = p.scale * Math.min(w, h);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);

  // Only the top-left quadrant is evaluated, then mirrored — a rounded rect is
  // four-fold symmetric, so this is a quarter of the per-pixel work.
  const qw = Math.ceil(w / 2);
  const qh = Math.ceil(h / 2);
  const dxQuad = new Float32Array(qw * qh);
  const dyQuad = new Float32Array(qw * qh);
  let maxAbs = 1e-6;

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const d = roundedRectSDF(px, py, halfW, halfH, p.borderRadius);

      let dx = 0;
      let dy = 0;
      if (d < 0) {
        const e = 0.75;
        const gx =
          roundedRectSDF(px + e, py, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px - e, py, halfW, halfH, p.borderRadius);
        const gy =
          roundedRectSDF(px, py + e, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px, py - e, halfW, halfH, p.borderRadius);
        const len = Math.hypot(gx, gy) || 1;

        const edge = clamp((d + depth) / depth, 0, 1);
        const curve = clamp(p.curvature, 0, 1);
        const exponent = 5 - 4.6 * curve;
        const profile = Math.pow(smoothStep(0, 1, edge), exponent);
        const amount = profile * strength * p.splay;

        dx = (gx / len) * amount;
        dy = (gy / len) * amount;
      }

      dxQuad[y * qw + x] = dx;
      dyQuad[y * qw + x] = dy;
      maxAbs = Math.max(maxAbs, Math.abs(dx), Math.abs(dy));
    }
  }

  const data = img.data;
  const put = (x: number, y: number, dx: number, dy: number) => {
    const i = (y * w + x) * 4;
    data[i] = (0.5 + 0.5 * (dx / maxAbs)) * 255;
    data[i + 1] = (0.5 + 0.5 * (dy / maxAbs)) * 255;
    data[i + 2] = 128;
    data[i + 3] = 255;
  };

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const dx = dxQuad[y * qw + x];
      const dy = dyQuad[y * qw + x];
      const mx = w - 1 - x;
      const my = h - 1 - y;
      put(x, y, dx, dy);
      put(mx, y, -dx, dy);
      put(x, my, dx, -dy);
      put(mx, my, -dx, -dy);
    }
  }

  ctx.putImageData(img, 0, 0);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    scale: 2 * maxAbs,
    chromaAmount: maxAbs,
  };
}

/* -------------------------------------------------------------------------- */
/*  Tuning — the exact settings from the control panel                        */
/* -------------------------------------------------------------------------- */
const SETTINGS = {
  scale: 0.151,
  depth: 5,
  curvature: 0.5,
  splay: 1.0,
  chroma: 1.0,
  blur: 0.0,
  glow: 0,
  edgeHighlight: 0.33,
  specular: 0.35,
  specularAngle: 45,
  specularBlur: 4.5,
};

type RefractionGlassButtonProps = HTMLMotionProps<"button"> & {
  children?: ReactNode;
};

/**
 * A button that *is* a piece of glass: it refracts whatever sits behind it with
 * an feDisplacementMap lens. Tuned to a softly-domed pill — the refraction only
 * shows over real content, so place it over texture (a gradient, image, or busy
 * layout), not a flat fill. Press bends the glass a touch harder.
 *
 * Drag it around to slide the lens across the content behind it.
 */
const RefractionGlassButton = ({
  children = "Glass",
  className,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  style,
  ...props
}: RefractionGlassButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pressed, setPressed] = useState(false);

  // Measure the rendered button so the lens matches it exactly.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({
        w: Math.round(el.offsetWidth),
        h: Math.round(el.offsetHeight),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fully rounded pill — the lens radius tracks half the height so the glass
  // edge always matches the button's rounded-full outline.
  const radius = size.h / 2;

  const map = useMemo(() => {
    if (typeof window === "undefined" || size.w < 4 || size.h < 4) return null;
    return generateLensMap({
      width: size.w,
      height: size.h,
      borderRadius: radius,
      scale: pressed ? SETTINGS.scale * 1.6 : SETTINGS.scale,
      depth: SETTINGS.depth,
      curvature: SETTINGS.curvature,
      splay: SETTINGS.splay,
    });
  }, [size.w, size.h, radius, pressed]);

  // Safari caches filter output by ID, so the token must change with the map.
  const version = size.w * 100000 + size.h * 10 + (pressed ? 1 : 0);
  const filterId = `refraction-glass-${version}`;
  const lensScale = map?.scale ?? 0;

  // Split the displacement into three scales for R / G / B and screen them back
  // together — at chroma 0 they coincide; above 0 a faint colour fringe appears.
  const spread = SETTINGS.chroma * (map?.chromaAmount ?? 0) * 0.6;
  const scaleR = lensScale + spread;
  const scaleG = lensScale;
  const scaleB = lensScale - spread;

  const frost = Math.min(0.22, SETTINGS.blur * 0.02);

  const lensStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: radius,
    backdropFilter: map ? `url(#${filterId})` : undefined,
    WebkitBackdropFilter: map ? `url(#${filterId})` : undefined,
    backgroundColor: `rgba(255,255,255,${frost})`,
    overflow: "hidden",
    boxShadow: [
      `inset 0 1px 1px rgba(255,255,255,${0.5 * SETTINGS.edgeHighlight})`,
      `inset 0 0 0 1px rgba(255,255,255,${0.35 * SETTINGS.edgeHighlight})`,
      `inset 0 -1px 2px rgba(0,0,0,${0.12 * SETTINGS.edgeHighlight})`,
      `0 6px 24px rgba(0,0,0,${0.28 * SETTINGS.glow})`,
      `0 0 24px rgba(255,255,255,${0.5 * SETTINGS.glow})`,
    ].join(", "),
    pointerEvents: "none",
  };

  const sheenStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: radius,
    pointerEvents: "none",
    background: `linear-gradient(${SETTINGS.specularAngle}deg, rgba(255,255,255,${
      0.9 * SETTINGS.specular
    }) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,${
      0.45 * SETTINGS.specular
    }) 100%)`,
    filter:
      SETTINGS.specularBlur > 0 ? `blur(${SETTINGS.specularBlur}px)` : undefined,
    mixBlendMode: "screen",
  };

  return (
    <motion.button
      ref={ref}
      drag
      dragMomentum={false}
      className={
        "relative isolate inline-flex cursor-grab select-none items-center justify-center rounded-full px-8 py-3 text-base font-medium text-white active:cursor-grabbing" +
        (className ? ` ${className}` : "")
      }
      style={{ touchAction: "none", ...style }}
      onPointerDown={(e) => {
        setPressed(true);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        onPointerLeave?.(e);
      }}
      {...props}
    >
      {map && (
        <svg
          aria-hidden
          width="0"
          height="0"
          style={{ position: "absolute", pointerEvents: "none" }}
        >
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
              x="0"
              y="0"
              width="100%"
              height="100%"
            >
              <feImage
                href={map.dataUrl}
                x="0"
                y="0"
                width={size.w}
                height={size.h}
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scaleR}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispR"
              />
              <feColorMatrix
                in="dispR"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="red"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scaleG}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispG"
              />
              <feColorMatrix
                in="dispG"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="green"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scaleB}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispB"
              />
              <feColorMatrix
                in="dispB"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="blue"
              />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="rgb" />
              <feGaussianBlur in="rgb" stdDeviation={SETTINGS.blur} />
            </filter>
          </defs>
        </svg>
      )}
      <span style={lensStyle} />
      <span style={sheenStyle} />
      <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {children}
      </span>
    </motion.button>
  );
};

export default RefractionGlassButton;
