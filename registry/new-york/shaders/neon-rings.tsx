"use client";

/**
 * Pulsing, wobbling concentric rings glowing through a cosine spectrum.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.5;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        float wob = 0.05 * sin(a * 6.0 + t * 2.0);
        float rings = abs(fract((r + wob) * 4.0 - t) * 2.0 - 1.0);
        float glow = 0.025 / (rings + 0.025);
        vec3 col = palette(
          r - t * 0.2,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        ) * glow;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function NeonRings({
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
