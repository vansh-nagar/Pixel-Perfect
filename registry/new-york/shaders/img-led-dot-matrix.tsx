"use client";

/**
 * Rebuilds the image from a grid of glowing round LEDs on a black panel.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 64.0;
        vec2 grid = vec2(scale * aspect, scale);
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;   // cell centre
        vec2 cell = fract(uv * grid) - 0.5;           // -0.5..0.5 within cell
        vec3 col = texCover(cuv).rgb;
        float d = length(cell);
        float radius = 0.30 + 0.12 * luma(col);        // brighter cells light up bigger
        float led = smoothstep(radius, radius - 0.12, d);
        float glow = 0.012 / (d * d + 0.012);          // soft bloom around each LED
        gl_FragColor = vec4(col * led + col * glow * 0.25, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function LedDotMatrix({
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
