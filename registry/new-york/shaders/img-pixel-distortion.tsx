"use client";

/**
 * Move your cursor to crunch the image into chunky pixel blocks that jitter, distort and RGB-split around the pointer.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float force = 1.0 - smoothstep(0.0, 0.34, length(d)); // 1 at cursor → 0 away

        // pixel blocks: near full-res away, chunky right under the cursor
        float cells = mix(240.0, 24.0, force);
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cell = floor(uv * grid);
        vec2 puv = (cell + 0.5) / grid;

        // per-block jitter that wobbles over time → the distortion animates
        float r = hash21(cell);
        float r2 = hash21(cell + 7.3);
        vec2 jitter = (vec2(r, r2) - 0.5)
                    * force * 0.07 * (0.5 + 0.5 * sin(time * 6.0 + r * 6.2831));

        // chroma split grows with proximity for a glitchy edge
        float ca = force * 0.012;
        vec2 s = puv + jitter;
        vec3 col = vec3(
          texCover(s + vec2(ca, 0.0)).r,
          texCover(s).g,
          texCover(s - vec2(ca, 0.0)).b
        );
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function PixelDistortion({
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
