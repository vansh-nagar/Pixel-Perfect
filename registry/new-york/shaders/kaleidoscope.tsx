"use client";

/**
 * Eight-fold mirrored noise that slowly rotates through the spectrum.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.2;
        uv = rot(t * 0.3) * uv;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        float seg = TAU / 8.0;
        a = mod(a, seg);
        a = abs(a - seg * 0.5);
        vec2 p = vec2(cos(a), sin(a)) * r;
        float n = fbm(p * 3.0 + t);
        vec3 col = palette(
          n + r - t * 0.3,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function Kaleidoscope({
  className,
  dpr,
  controls,
}: {
  className?: string;
  dpr?: number;
  controls?: boolean;
}) {
  return (
    <ShaderCanvas
      fragmentShader={FRAGMENT_SHADER}
      className={className}
      dpr={dpr}
      controls={controls}
    />
  );
}
