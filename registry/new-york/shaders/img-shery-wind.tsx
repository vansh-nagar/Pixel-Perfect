"use client";

/**
 * A natural simplex-noise sway, like the image fluttering in a breeze. Adapted from Shery.js (style 4), MIT — Sheryians Coding School.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Adapted from Shery.js effect 4 (3D Wind) — depth sway recast as a uv warp, MIT.
      void main() {
        vec2 uv = uv01();
        float freq = 3.0, speed = 1.0, amp = 0.05;
        float n = snoise(vec3(uv.x * freq + time * speed, uv.y * freq, 0.0));
        uv.x += n * amp * uv.y;          // sways more toward the top, like a flag
        uv.y += n * amp * 0.3;
        gl_FragColor = texCover(uv);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function SheryWind({
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
