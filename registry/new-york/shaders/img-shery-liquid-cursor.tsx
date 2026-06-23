"use client";

/**
 * A flowing liquid distortion that bends around your cursor. Adapted from Shery.js (style 5), MIT — Sheryians Coding School.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Adapted from Shery.js effect 5 (Liquid variant, cursor-reactive), MIT.
      void main() {
        vec2 uv = uv01();
        vec2 m = mouse - 0.5;
        float n = snoise(vec3(uv - m * 0.5 + 0.2 * time, 1.0));
        vec2 surface = vec2(n * 0.08, n * 0.08);
        gl_FragColor = texCover(uv + surface);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function SheryLiquidCursor({
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
