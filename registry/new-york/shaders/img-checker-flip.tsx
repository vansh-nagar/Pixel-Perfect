"use client";

/**
 * Hover and the image tiles into a checkerboard whose squares flip over, staggered, to the next image.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float aspect = resolution.x / resolution.y;
        float cells = 10.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cell = floor(uv * grid);
        float checker = mod(cell.x + cell.y, 2.0);     // 0 / 1
        float r = hash21(cell);
        float cellP = 0.05 + checker * 0.45 + r * 0.45; // (0,1]: staggered order
        float reveal = step(cellP, p);
        vec3 col = mix(texCover(uv).rgb, texCoverB(uv).rgb, reveal);
        // darken each tile at the instant it flips
        float flip = (1.0 - smoothstep(0.0, 0.12, abs(cellP - p)))
                   * step(0.02, p) * step(p, 0.98);
        col *= 1.0 - flip * 0.35;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function CheckerFlip({
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
