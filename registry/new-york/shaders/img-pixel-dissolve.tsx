"use client";

/**
 * The image materialises from chunky mosaic blocks into full resolution.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float prog = 0.68 - 0.32 * cos(time * 0.55);       // 0.36..1.0 (never blank)
        float cells = mix(12.0, 200.0, prog);
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;
        vec3 blocky = texCover(cuv).rgb;
        vec3 sharp = texCover(uv).rgb;
        float r = hash21(floor(uv * grid));                // per-block randomness
        float on = smoothstep(0.0, 0.2, prog - r * 0.4);   // blocks pop in irregularly
        vec3 col = mix(vec3(0.03), blocky, on);
        col = mix(col, sharp, smoothstep(0.75, 1.0, prog));
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function PixelDissolve({
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
