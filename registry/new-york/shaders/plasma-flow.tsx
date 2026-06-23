"use client";

/**
 * Classic interfering sine fields cycling through a vivid cosine palette.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.4;
        float v = 0.0;
        v += sin(uv.x * 3.0 + t);
        v += sin((uv.y * 3.0 + t) * 0.7);
        v += sin((uv.x * 2.0 + uv.y * 2.0 + t) * 0.8);
        vec2 c = uv + 0.6 * vec2(sin(t * 0.3), cos(t * 0.4));
        v += sin(length(c) * 5.0 - t * 1.5);
        v *= 0.25;
        vec3 col = palette(
          v,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function PlasmaFlow({
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
