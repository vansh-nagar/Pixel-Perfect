"use client";

/**
 * Layered domain warping that pools into a flowing chrome surface.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01() * 3.0;
        float t = time * 0.15;
        vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2, 1.3)));
        vec2 r = vec2(
          fbm(uv + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
          fbm(uv + 4.0 * q + vec2(8.3, 2.8))
        );
        float f = fbm(uv + 4.0 * r);
        vec3 col = mix(vec3(0.08, 0.10, 0.15), vec3(0.90, 0.93, 0.99), f);
        col = mix(col, vec3(0.35, 0.45, 0.70), clamp(length(q), 0.0, 1.0));
        col = mix(col, vec3(0.97), r.x * 0.55);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function LiquidMetal({
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
