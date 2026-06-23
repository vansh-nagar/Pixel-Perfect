"use client";

/**
 * Drifting ribbons of green and violet light over a deep night sky.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float t = time * 0.15;

        float n = fbm(vec2(uv.x * 2.5, uv.y * 1.5 - t));
        float curtain = fbm(vec2(uv.x * 3.0 + t, uv.y * 4.0 - t * 1.5));
        float ribbon = smoothstep(0.1, 0.7, n) * (1.0 - smoothstep(0.2, 0.95, uv.y));
        ribbon *= 0.6 + 0.4 * curtain;

        vec3 green = vec3(0.10, 0.95, 0.55);
        vec3 teal = vec3(0.10, 0.65, 0.95);
        vec3 purple = vec3(0.55, 0.20, 0.95);

        vec3 col = mix(green, teal, fbm(uv * 3.0 + t));
        col = mix(col, purple, smoothstep(0.35, 1.0, uv.y));
        col *= ribbon * 1.6;

        col += vec3(0.02, 0.03, 0.09);
        col += hash21(uv * resolution.xy) * 0.015;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function AuroraCurtain({
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
