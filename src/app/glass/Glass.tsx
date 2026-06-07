"use client";

import { CSSProperties, ReactNode } from "react";
import type { GeneratedMap } from "./lib/displacement";

export type GlassProps = {
  map: GeneratedMap | null;
  width: number;
  height: number;
  borderRadius: number;
  /** Lens top-left offset within its positioned parent, in px. */
  x: number;
  y: number;
  /** Chromatic-aberration strength (0 = none). */
  chroma: number;
  /** Gaussian blur applied after refraction, in px. */
  blur: number;
  /** Outer glow / drop strength, 0–1. */
  glow: number;
  /** Inner rim-light intensity, 0–1. */
  edgeHighlight: number;
  /** Specular sheen intensity, 0–1. */
  specular: number;
  /** Direction the specular sheen comes from, in degrees. */
  specularAngle: number;
  /** Softens the specular sheen, in px (0 = crisp). */
  specularBlur?: number;
  /**
   * Bumped whenever the map changes. Safari caches filter output by filter ID,
   * so we mint a fresh ID on every update to force it to read the new map —
   * otherwise the glass freezes mid-motion.
   */
  version: number;
  className?: string;
  children?: ReactNode;
  onPointerDown?: (e: React.PointerEvent) => void;
};

export function Glass({
  map,
  width,
  height,
  borderRadius,
  x,
  y,
  chroma,
  blur,
  glow,
  edgeHighlight,
  specular,
  specularAngle,
  specularBlur = 0,
  version,
  className,
  children,
  onPointerDown,
}: GlassProps) {
  const filterId = `glass-filter-${version}`;
  const scale = map?.scale ?? 0;

  // Split the displacement into three slightly different scales for R / G / B,
  // then screen them back together. At chroma 0 the three scales are identical
  // and the image reconstructs exactly; above 0 the channels separate into a
  // faint colour fringe along the lens edge.
  const spread = chroma * (map?.chromaAmount ?? 0) * 0.6;
  const scaleR = scale + spread;
  const scaleG = scale;
  const scaleB = scale - spread;

  // Frosted glass: the blur diffuses the backdrop, but a blurred backdrop alone
  // still reads as clear glass. The frost comes from a milky light-scatter tint
  // laid over it, scaled by the same blur — so the Blur control *is* the frost:
  // more blur, more diffusion and a milkier, more frosted body.
  const frost = Math.min(0.22, blur * 0.02);

  const lensStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width,
    height,
    borderRadius,
    transform: `translate3d(${x}px, ${y}px, 0)`,
    backdropFilter: map ? `url(#${filterId})` : undefined,
    WebkitBackdropFilter: map ? `url(#${filterId})` : undefined,
    // Milky frost body — light scattered inside the glass.
    backgroundColor: `rgba(255,255,255,${frost})`,
    // Clip the (optionally blurred) sheen to the lens's rounded shape. Doesn't
    // touch the box-shadow rim/glow, which paint outside the box.
    overflow: "hidden",
    // Rim light + a soft outer glow that keeps the glass legible over any
    // content. These run as cheap CSS passes rather than extra filter regions.
    boxShadow: [
      `inset 0 1px 1px rgba(255,255,255,${0.5 * edgeHighlight})`,
      `inset 0 0 0 1px rgba(255,255,255,${0.35 * edgeHighlight})`,
      `inset 0 -1px 2px rgba(0,0,0,${0.12 * edgeHighlight})`,
      `0 6px 24px rgba(0,0,0,${0.28 * glow})`,
      `0 0 24px rgba(255,255,255,${0.5 * glow})`,
    ].join(", "),
    cursor: onPointerDown ? "grab" : undefined,
    touchAction: "none",
  };

  // Specular sheen: a directional sweep of highlight across the lens.
  const sheenStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius,
    pointerEvents: "none",
    background: `linear-gradient(${specularAngle}deg, rgba(255,255,255,${
      0.9 * specular
    }) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,${
      0.45 * specular
    }) 100%)`,
    filter: specularBlur > 0 ? `blur(${specularBlur}px)` : undefined,
    mixBlendMode: "screen",
  };

  return (
    <>
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
              // sRGB keeps the colour-channel split from drifting through the
              // filter's linear-light default.
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
                width={width}
                height={height}
                preserveAspectRatio="none"
                result="map"
              />

              {/* Red channel, pushed a touch harder. */}
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

              {/* Green channel, the reference bend. */}
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

              {/* Blue channel, pushed a touch less. */}
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

              <feGaussianBlur in="rgb" stdDeviation={blur} />
            </filter>
          </defs>
        </svg>
      )}

      <div
        className={className}
        style={lensStyle}
        onPointerDown={onPointerDown}
      >
        <div style={sheenStyle} />
        {children}
      </div>
    </>
  );
}
