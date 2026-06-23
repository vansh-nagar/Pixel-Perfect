"use client";

/**
 * A mesmerising simplex-noise liquid warp drifting across the image. Adapted from Shery.js (style 1), MIT — Sheryians Coding School.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Adapted from Shery.js effect 1 (Simple Liquid Distortion), MIT.
      void main() {
        vec2 uv = uv01();
        vec3 v = vec3(uv.x + time * 0.1, uv.y, time * 0.3);
        vec2 surface = vec2(snoise(v) * 0.08, snoise(v + 4.0) * 0.02);
        gl_FragColor = texCover(uv + surface);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function SheryLiquid({
  image = DEFAULT_IMAGE,
  className,
  controls,
}: {
  image?: string;
  className?: string;
  controls?: boolean;
}) {
  return (
    <ImageShaderCanvas
      fragmentShader={FRAGMENT_SHADER}
      image={image}
      className={className}
      controls={controls}
    />
  );
}
