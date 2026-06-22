"use client";

/**
 * Hover to flip open a stack of horizontal blinds, each strip wiping to the second image.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float strips = 12.0;
        float local = fract(uv.y * strips);      // 0..1 within each blind
        float reveal = step(local, p);           // blind fills as p grows
        vec3 col = mix(texCover(uv).rgb, texCoverB(uv).rgb, reveal);
        // soft shadow line at each blind's leading edge
        float seam = (1.0 - smoothstep(0.0, 0.04, abs(local - p)))
                   * step(0.02, p) * step(p, 0.98);
        col *= 1.0 - seam * 0.3;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function BlindsTransition({
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
