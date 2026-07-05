"use client";

/**
 * Six color spots drifting on sine paths, blended by inverse-distance weights under a center swirl.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // In the style of Paper Shaders' mesh gradient (shaders.paper.design):
      // color spots on sine trajectories, inverse-distance-power blending.
      vec2 spotPos(float i, float t) {
        float a = i * 0.37;
        float b = 0.6 + fract(i / 3.0) * 0.9;
        float c = 0.8 + fract((i + 1.0) / 4.0);
        return 0.5 + 0.5 * vec2(sin(t * b + a), cos(t * c + a * 1.5));
      }

      vec3 spotColor(int i) {
        if (i == 0) return vec3(0.99, 0.42, 0.33);
        if (i == 1) return vec3(0.99, 0.80, 0.38);
        if (i == 2) return vec3(0.30, 0.72, 0.98);
        if (i == 3) return vec3(0.58, 0.36, 0.98);
        if (i == 4) return vec3(0.99, 0.55, 0.76);
        return vec3(0.28, 0.92, 0.71);
      }

      void main() {
        vec2 uv = uv01();
        float t = time * 0.4 + 20.0;

        // center-weighted organic warp
        float radius = smoothstep(0.0, 1.0, length(uv - 0.5));
        float center = 1.0 - radius;
        for (float i = 1.0; i <= 2.0; i += 1.0) {
          uv.x += 0.4 * center / i * sin(t + i * 0.4 * uv.y) * cos(0.2 * t + i * 2.4 * uv.y);
          uv.y += 0.4 * center / i * cos(t + i * 2.0 * uv.x);
        }

        // swirl that strengthens toward the rim
        vec2 p = uv - 0.5;
        p = rot(-1.4 * radius) * p;
        uv = p + 0.5;

        vec3 col = vec3(0.0);
        float totalW = 0.0;
        for (int i = 0; i < 6; i++) {
          vec2 pos = spotPos(float(i), t);
          float d = pow(length(uv - pos), 3.5);
          float w = 1.0 / (d + 1e-3);
          col += spotColor(i) * w;
          totalW += w;
        }
        col /= totalW;

        // fine grain hides banding in the soft blends
        col += (hash21(gl_FragCoord.xy) - 0.5) * 0.02;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function MeshGradient({
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
