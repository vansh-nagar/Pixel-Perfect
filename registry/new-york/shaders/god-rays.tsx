"use client";

/**
 * Warm volumetric rays streaming from a glowing core, carved from angular value noise.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // In the spirit of Paper Shaders' god rays: rays are value noise
      // sampled along the angle, sharpened with pow and layered in tints.
      float rayShape(vec2 uv, float rr, float freq, float sharp) {
        float a = atan(uv.y, uv.x);
        vec2 left = vec2(a * freq, rr);
        vec2 right = vec2(fract(a / TAU) * TAU * freq, rr);
        float nl = pow(vnoise(left), sharp);
        float nr = pow(vnoise(right), sharp);
        return mix(nr, nl, smoothstep(-0.15, 0.15, uv.x));
      }

      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.2;
        float r = length(uv);

        vec3 col = vec3(0.02, 0.025, 0.06);

        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          vec2 ruv = rot(fi + 1.0) * uv;
          float r1 = r * (1.0 + 0.4 * fi) - 3.0 * t;
          float r2 = 0.5 * r - 2.0 * t;
          float ray = rayShape(ruv, r1, 5.0 + fi, 3.0);
          ray *= rayShape(ruv, r2, 4.0, 3.0);
          ray *= 0.35 + 0.65 * exp(-r * 1.3);
          vec3 tint = (i == 0) ? vec3(1.0, 0.85, 0.55)
                    : (i == 1) ? vec3(1.0, 0.65, 0.35)
                               : vec3(0.95, 0.90, 0.75);
          col += tint * ray * 0.85;
        }

        col += vec3(1.0, 0.92, 0.72) * exp(-r * 4.0);
        col += (hash21(gl_FragCoord.xy) - 0.5) * 0.015;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function GodRays({
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
