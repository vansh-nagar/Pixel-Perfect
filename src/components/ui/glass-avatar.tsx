"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";

/**
 * Round glass avatar.
 *
 * The refraction follows Aave's "Building Glass for the Web" technique: an
 * SVG filter on the content itself (not `backdrop-filter`, which only
 * Chromium supports with SVG), where `feDisplacementMap` bends the image's
 * own pixels using a lens map generated on the fly. The map's red/green
 * channels say how far each pixel moves horizontally/vertically; outside
 * the lens it's neutral grey (128), so nothing moves there. Three passes
 * at slightly different strengths, one per colour channel, give the faint
 * prism fringe at the rim. No rim, border or highlight on top: the glass
 * shows only through how it bends the photo.
 */

const MAP_SIZE = 128;
let cachedMap: string | null = null;

/**
 * A dome lens: near the centre pixels barely move; toward the rim each
 * pixel shows content from further *in*, so the edge magnifies like the
 * curved rim of a glass bead (and never samples past the image's edge).
 * Encoded as R = x displacement, G = y displacement.
 */
function lensMap(): string {
  if (cachedMap) return cachedMap;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = MAP_SIZE;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(MAP_SIZE, MAP_SIZE);
  const half = MAP_SIZE / 2;
  // Only one quadrant is computed (the lens is symmetric), mirrored into
  // all four with the displacement sign flipped across each axis.
  for (let y = 0; y < half; y++) {
    for (let x = 0; x < half; x++) {
      const nx = (x + 0.5 - half) / half; // -1…0
      const ny = (y + 0.5 - half) / half;
      const r = Math.hypot(nx, ny);
      let dx = 0;
      let dy = 0;
      if (r < 1 && r > 0) {
        // Bend grows steeply toward the rim (a convex surface's slope).
        const bend = Math.pow(r, 3.2);
        dx = (nx / r) * bend;
        dy = (ny / r) * bend;
      }
      for (const [sx, sy] of [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        const px = sx === 1 ? x : MAP_SIZE - 1 - x;
        const py = sy === 1 ? y : MAP_SIZE - 1 - y;
        const i = (py * MAP_SIZE + px) * 4;
        // Negative = sample toward the centre.
        img.data[i] = Math.round(128 - 127 * dx * sx);
        img.data[i + 1] = Math.round(128 - 127 * dy * sy);
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  cachedMap = canvas.toDataURL("image/png");
  return cachedMap;
}

const noopSubscribe = () => () => {};

export function GlassAvatar({
  src,
  size = 48,
  title,
}: {
  src: string;
  size?: number;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const filterId = `glass-lens-${id}`;
  // The lens map needs a <canvas>, so only build it on the client.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const map = useMemo(() => (hydrated ? lensMap() : null), [hydrated]);
  // Twitter avatar URLs die when someone changes their picture; show a
  // neutral disc instead of a broken image.
  const [failed, setFailed] = useState(false);
  // Displacement in fractions of the avatar (objectBoundingBox units).
  const scale = 0.3;
  const chroma = 0.12; // ± share of scale for the red/blue passes

  return (
    <span
      className="relative z-20 shrink-0 overflow-hidden rounded-full bg-muted"
      style={{ width: size, height: size }}
    >
      {map && (
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter
            id={filterId}
            filterUnits="objectBoundingBox"
            primitiveUnits="objectBoundingBox"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="1"
            height="1"
          >
            <feImage
              href={map}
              x="0"
              y="0"
              width="1"
              height="1"
              preserveAspectRatio="none"
              result="map"
            />
            {/* One pass per colour channel, each bent a little differently:
                that spread is the colour fringe at the rim. */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale * (1 + chroma)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dr"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dg"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale * (1 - chroma)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="db"
            />
            <feColorMatrix
              in="dr"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="r"
            />
            <feColorMatrix
              in="dg"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="g"
            />
            <feColorMatrix
              in="db"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="b"
            />
            <feComposite
              in="r"
              in2="g"
              operator="arithmetic"
              k2="1"
              k3="1"
              result="rg"
            />
            <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
          </filter>
        </svg>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        title={title}
        alt=""
        height={size}
        width={size}
        loading="lazy"
        decoding="async"
        // Twitter's "_normal" avatar is 48px; ask for the 200px one so the
        // lens isn't magnifying a blurry image on retina screens.
        src={src.replace("_normal.", "_200x200.")}
        onError={() => setFailed(true)}
        className="block rounded-full object-cover"
        style={{
          width: size,
          height: size,
          filter: map ? `url(#${filterId})` : undefined,
          visibility: failed ? "hidden" : undefined,
        }}
      />
    </span>
  );
}
