"use client";

/**
 * An LED-style dot grid of the image — move your cursor to scatter the dots into a dispersing cloud.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;

        // disturbance field around the cursor (aspect-corrected distance)
        vec2 toM = uv - mouse;
        toM.x *= aspect;
        float dist = length(toM);
        float force = smoothstep(0.30, 0.0, dist);   // 1 at the cursor, 0 beyond
        vec2 dir = toM / (dist + 1e-4);

        // push the sampled image outward from the cursor so the cloud disperses
        vec2 suv = uv + dir * force * 0.13;

        // dot grid over the (pushed) image
        float cells = 110.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 g = suv * grid;
        vec2 cellId = floor(g);
        vec2 f = fract(g) - 0.5;

        // per-cell scatter jitter — only bites near the cursor
        vec2 jit = (vec2(hash21(cellId), hash21(cellId + 7.7)) - 0.5) * 1.6 * force;
        f -= jit;

        vec3 col = texCover((cellId + 0.5) / grid).rgb;
        float lum = luma(col);

        // halftone: dot radius grows with brightness, shrinks where disturbed
        float r = (0.18 + 0.30 * lum) * (1.0 - 0.45 * force);
        float dotMask = smoothstep(r, r - 0.12, length(f));

        // near the cursor ~half the dots wink in/out → floating specks + gaps
        float flick = hash21(cellId + floor(time * 4.0));
        dotMask *= mix(1.0, step(0.5, flick), force);

        gl_FragColor = vec4(col * dotMask, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function DotMatrixScatter({
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
