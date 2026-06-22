"use client";

/**
 * Hover and the first image burns away along a glowing ember edge, revealing the next through the noise.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float n = fbm(uv * 5.0);                 // dissolve threshold map
        float edgeW = 0.1;
        float t = mix(-edgeW, 1.0 + edgeW, p);   // sweep threshold across the noise
        float reveal = 1.0 - smoothstep(t - edgeW, t + edgeW, n);
        vec3 col = mix(texCover(uv).rgb, texCoverB(uv).rgb, reveal);
        // glowing ember along the burning front
        float glow = (1.0 - smoothstep(0.0, edgeW, abs(n - t)))
                   * step(0.02, p) * step(p, 0.98);
        col += glow * vec3(1.0, 0.5, 0.15) * 0.9;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function BurnDissolve({
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
