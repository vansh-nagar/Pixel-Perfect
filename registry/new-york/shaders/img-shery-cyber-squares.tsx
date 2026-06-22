"use client";

/**
 * Retro cyber squares pulse across the image and brighten around your cursor. Adapted from Shery.js (style 7), MIT — Sheryians Coding School.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Adapted from Shery.js effect 7 (Cyber Squares), single-image branch, MIT.
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float m = 0.4 + 0.6 * smoothstep(0.35, 0.0, length(uv - mouse));

        float tiles = 9.0;
        vec2 scaled = tiles * vec2(uv.x, uv.y / aspect);
        vec2 tile = fract(scaled);
        float tileDist = min(min(tile.x, 1.0 - tile.x), min(tile.y, 1.0 - tile.y));
        float squareDist = length(floor(scaled));

        float edge = sin(time - squareDist * 3.0);
        edge = mod(edge * edge, 1.0);
        float value = mix(tileDist, 1.0 - tileDist, step(0.5, edge));
        edge = pow(abs(1.0 - edge * m), 1.5 * m);
        value = smoothstep(edge - 0.5 * m, edge, value);

        vec3 col = mix(vec3(0.0), texCover(uv).rgb, value);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function SheryCyberSquares({
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
