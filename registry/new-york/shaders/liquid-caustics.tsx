"use client";

/**
 * Sunlight refracting through rippling water onto a pool floor.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01() * 4.0;
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        float t = time * 0.4;
        vec2 p = uv;
        for (int i = 0; i < 4; i++) {
          float fi = float(i) + 1.0;
          p += vec2(sin(p.y * 1.5 + t + fi), cos(p.x * 1.5 - t + fi)) * 0.35;
        }
        float v = abs(sin(p.x) * sin(p.y));
        float caustic = pow(1.0 - v, 4.0);
        vec3 col = mix(vec3(0.0, 0.22, 0.45), vec3(0.45, 0.95, 1.0), caustic);
        col += pow(caustic, 3.0) * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function LiquidCaustics({
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
