"use client";

/**
 * A wispy torus of smoke — polar fbm streams outward and breathes the ring into drifting tendrils.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // In the spirit of Paper Shaders' smoke ring: fbm in polar space
      // displaces a ring while its coordinates stream radially over time.
      float smokeNoise(vec2 uv, float flow) {
        float a = atan(uv.y, uv.x);
        // two angle parameterizations blended across the wrap seam
        vec2 p1 = vec2(a * 1.5, flow);
        vec2 p2 = vec2(fract(a / TAU) * TAU * 1.5, flow);
        return mix(fbm(p2), fbm(p1), smoothstep(-0.25, 0.25, uv.x));
      }

      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.35;

        float r = length(uv);
        float radialOffset = 0.5 * r - inversesqrt(max(1e-4, r));
        float n = smokeNoise(uv, 2.0 * (t - radialOffset));

        // the noise breathes the ring in and out into wisps
        vec2 suv = uv * (0.72 + 1.15 * n);
        float d = length(suv);
        float ring = (1.0 - smoothstep(0.5, 0.95, d)) * smoothstep(0.22, 0.5, d);

        vec3 col = vec3(0.015, 0.02, 0.05);
        vec3 inner = vec3(0.45, 0.65, 1.0);
        vec3 outer = vec3(0.95, 0.97, 1.0);
        col = mix(col, mix(inner, outer, ring), ring);
        col += pow(ring, 3.0) * 0.3;
        col += (hash21(gl_FragCoord.xy) - 0.5) * 0.015;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function SmokeRing({
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
