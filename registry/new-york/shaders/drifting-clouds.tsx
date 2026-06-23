"use client";

/**
 * Soft warped fbm clouds rolling across a clear blue sky.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        float t = time * 0.05;
        float f = fbm(uv * 3.0 + vec2(t, t * 0.5));
        f = fbm(uv * 3.0 + f + vec2(t * 0.5, 0.0));
        vec3 sky = vec3(0.25, 0.45, 0.85);
        vec3 cloud = vec3(1.0);
        vec3 col = mix(sky, cloud, smoothstep(0.25, 0.85, f));
        col = mix(col, vec3(0.55, 0.70, 0.95), (1.0 - uv.y) * 0.25);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function DriftingClouds({
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
