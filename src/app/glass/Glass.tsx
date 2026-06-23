"use client";

import { CSSProperties, ReactNode } from "react";
import type { GeneratedMap } from "./lib/displacement";

export type GlassProps = {
  map: GeneratedMap | null;
  width: number;
  height: number;
  borderRadius: number;
  x: number;
  y: number;
  chroma: number;
  blur: number;
  glow: number;
  edgeHighlight: number;
  edgeHighlightAngle?: number;
  specular: number;
  specularAngle: number;
  specularBlur?: number;
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
  edgeHighlightAngle = 0,
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

  const spread = chroma * (map?.chromaAmount ?? 0) * 0.6;
  const scaleR = scale + spread;
  const scaleG = scale;
  const scaleB = scale - spread;

  const frost = Math.min(0.22, blur * 0.02);

  const rimRad = (edgeHighlightAngle * Math.PI) / 180;
  const rimX = +Math.sin(rimRad).toFixed(3);
  const rimY = +Math.cos(rimRad).toFixed(3);

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
    backgroundColor: `rgba(255,255,255,${frost})`,
    overflow: "hidden",
    boxShadow: [
      `inset ${rimX}px ${rimY}px 1px rgba(255,255,255,${0.5 * edgeHighlight})`,
      `inset 0 0 0 1px rgba(255,255,255,${0.35 * edgeHighlight})`,
      `inset ${-rimX}px ${-rimY}px 2px rgba(0,0,0,${0.12 * edgeHighlight})`,
      `0 6px 24px rgba(0,0,0,${0.28 * glow})`,
      `0 0 24px rgba(255,255,255,${0.5 * glow})`,
    ].join(", "),
    cursor: onPointerDown ? "grab" : undefined,
    touchAction: "none",
  };

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
