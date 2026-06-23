"use client";

/**
 * Folds the image into six-fold mirrored symmetry that slowly rotates.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 c = uv - 0.5;
        c.x *= aspect;
        float r = length(c);
        float a = atan(c.y, c.x) + time * 0.2;
        float seg = TAU / 6.0;
        a = abs(mod(a, seg) - seg * 0.5);          // mirror within each wedge
        vec2 p = vec2(cos(a), sin(a)) * r * (0.85 + 0.15 * sin(time * 0.3));
        p.x /= aspect;
        vec2 m = abs(fract((p + 0.5) * 0.5) * 2.0 - 1.0); // mirror-wrap into 0..1
        gl_FragColor = texCover(m);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Kaleidoscope({
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
