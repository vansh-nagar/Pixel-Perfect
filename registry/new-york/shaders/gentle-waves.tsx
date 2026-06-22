"use client";

/**
 * A calm light-to-blue gradient rolling with slow, soft waves.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float t = time * 0.12;

        float w = sin(uv.x * 3.0 + t) * 0.05
                + sin(uv.x * 6.5 - t * 1.3) * 0.025
                + sin(uv.x * 1.5 + t * 0.6) * 0.06;
        float y = uv.y + w;

        vec3 top = vec3(0.95, 0.97, 1.0);
        vec3 mid = vec3(0.55, 0.72, 0.98);
        vec3 bot = vec3(0.30, 0.45, 0.92);
        vec3 col = mix(bot, mid, smoothstep(0.0, 0.6, y));
        col = mix(col, top, smoothstep(0.55, 1.05, y));

        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function GentleWaves({
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
