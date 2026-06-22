"use client";

/**
 * A noise-wobbled glow that tracks your cursor across the dark — hover to move it.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;

        // distance to the cursor, aspect-corrected so the glow is round
        vec2 diff = uv - mouse;
        diff.x *= aspect;
        float d = length(diff);

        // wobble the spotlight edge with animated noise (fbm is ~0..1, recenter)
        float n = fbm(uv * 6.0 + time * 0.4);
        d += (n - 0.5) * 0.1;

        float glow = smoothstep(0.2, 0.0, d);
        vec3 col = mix(vec3(0.0), vec3(1.0), glow);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function CursorSpotlight({
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
