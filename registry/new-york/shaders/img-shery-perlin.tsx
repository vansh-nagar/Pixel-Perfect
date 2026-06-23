"use client";

/**
 * A pulsing Perlin-noise displacement that breathes the image in and out. Adapted from Shery.js (style 6), MIT — Sheryians Coding School.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Adapted from Shery.js effect 6 (Perlin Noise), MIT.
      void main() {
        vec2 uv = uv01();
        float scale = 2.0, detail = 50.0, speed = 1.0, amount = 9.0;
        float x = (uv.x - 0.5) * scale * (detail / 100.0) * sin(time) * speed;
        float y = (uv.y - 0.5) * scale * (detail / 100.0) * cos(time) * speed;
        uv += snoise(vec3(x, y, 0.0)) * (amount / 100.0);
        gl_FragColor = texCover(uv);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function SheryPerlin({
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
