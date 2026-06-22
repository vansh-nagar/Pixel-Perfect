"use client";

/**
 * Hover to sweep a glowing diagonal seam across the frame, wiping one image into the next.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        // position along a diagonal sweep, normalised to ~0..1
        float edge = dot(uv, normalize(vec2(1.0, 0.35))) / 1.35;
        float w = smoothstep(p - 0.04, p + 0.04, edge); // 1 = not yet wiped (A)
        vec3 col = mix(texCoverB(uv).rgb, texCover(uv).rgb, w);
        col += (1.0 - smoothstep(0.0, 0.05, abs(edge - p))) * 0.5; // glowing seam
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function WipeReveal({
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
