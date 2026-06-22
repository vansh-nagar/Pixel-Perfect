"use client";

/**
 * Hover and a ragged wall of pixels climbs from the bottom, dissolving the old image block by block as the new one rises into place.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float p = uProgress;

        // chunky pixel blocks
        float cells = 42.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cell = floor(uv * grid);
        vec2 puv = (cell + 0.5) / grid;                // block centre
        float r = hash21(cell);                         // per-block randomness

        // Each block flips to the new image at its own moment as the front
        // climbs from the bottom: lower (and "luckier") blocks go first, so the
        // rising edge is a thick, ragged band of pixels, not a straight line.
        float blockP = 0.05 + puv.y * 0.78 + r * 0.17;  // in (0,1]; never 0 at rest
        float reveal = step(blockP, p);                 // 1 → new image B

        // Sample blocky through the whole transition so it reads as a pixel
        // dissolve; settle to the sharp full-res image only when idle (p≈0) or
        // done (p≈1). (No reversed-edge smoothstep — that's GLSL UB.)
        float settle = max(1.0 - smoothstep(0.0, 0.06, p),
                           smoothstep(0.94, 1.0, p));
        vec2 s = mix(puv, uv, settle);

        vec3 col = mix(texCover(s).rgb, texCoverB(s).rgb, reveal);

        // blocks crossing the front right now flash as their pixels flip over
        float edge = (1.0 - smoothstep(0.0, 0.07, abs(blockP - p)))
                   * step(0.02, p) * step(p, 0.98);
        col += edge * (0.2 + 0.45 * r);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function PixelRiseReveal({
  image = DEFAULT_IMAGE,
  imageB = DEFAULT_IMAGE_B,
  className,
  controls,
}: {
  image?: string;
  imageB?: string;
  className?: string;
  controls?: boolean;
}) {
  return (
    <ImageShaderCanvas
      fragmentShader={FRAGMENT_SHADER}
      image={image}
      imageB={imageB}
      className={className}
      controls={controls}
    />
  );
}
