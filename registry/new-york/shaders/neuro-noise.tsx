"use client";

/**
 * A glowing neural web woven from fifteen rotated sine layers, after zozuar's algorithm.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Neural filament web — adapted from zozuar's algorithm
      // (x.com/zozuar/status/1625182758745128981), the one behind
      // Paper Shaders' neuro noise.
      float neuroShape(vec2 p, float t) {
        vec2 sineAcc = vec2(0.0);
        vec2 res = vec2(0.0);
        float scale = 8.0;
        for (int j = 0; j < 15; j++) {
          p = rot(1.0) * p;
          sineAcc = rot(1.0) * sineAcc;
          vec2 layer = p * scale + float(j) + sineAcc - t;
          sineAcc += sin(layer);
          res += (0.5 + 0.5 * cos(layer)) / scale;
          scale *= 1.2;
        }
        return res.x + res.y;
      }

      void main() {
        vec2 uv = uvCentered() * 0.5;
        float t = 0.5 * time;

        float n = neuroShape(uv, t);
        n = 1.4 * n * n;
        n = pow(n, 1.8);
        n = min(1.5, n);

        float blend = smoothstep(0.7, 1.4, n);
        vec3 filament = vec3(0.04, 0.45, 0.42);
        vec3 highlight = vec3(0.72, 1.0, 0.92);
        vec3 col = mix(filament, highlight, blend) * max(n, 0.0);
        col += vec3(0.010, 0.015, 0.025);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function NeuroNoise({
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
