"use client";

/**
 * Random horizontal slices tear and shift with bursts of RGB noise.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float t = floor(time * 12.0);
        float line = floor(uv.y * 24.0);
        float n = hash21(vec2(line, t));
        float glitch = step(0.78, n);
        float shift = (hash21(vec2(line, t + 1.0)) - 0.5) * glitch * 0.12;
        uv.x = fract(uv.x + shift);
        float ca = glitch * 0.02;
        float r = texCover(uv + vec2(ca, 0.0)).r;
        float g = texCover(uv).g;
        float b = texCover(uv - vec2(ca, 0.0)).b;
        vec3 col = vec3(r, g, b) + glitch * 0.05;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Glitch({
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
