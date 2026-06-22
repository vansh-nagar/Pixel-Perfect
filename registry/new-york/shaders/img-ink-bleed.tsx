"use client";

/**
 * Colour blooms outward from your cursor like ink dropped into water.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec3 col = texCover(uv).rgb;
        vec3 gray = vec3(luma(col));
        float prog = 0.5 - 0.5 * cos(time * 0.4);
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float n = fbm(uv * 6.0 + time * 0.2) * 0.18;       // organic ink front
        float front = 0.25 + prog * 0.95;                  // 0.25..1.2 (always some colour)
        float ink = smoothstep(front, front - 0.15, dist + n);
        ink = max(ink, smoothstep(0.14, 0.0, dist));        // colour core stays at the cursor
        float edge = smoothstep(0.06, 0.0, abs((dist + n) - front));
        vec3 outc = mix(gray, col, ink);
        outc *= 1.0 - edge * 0.25;                          // darker wet rim
        gl_FragColor = vec4(outc, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function InkBleed({
  image = DEFAULT_IMAGE,
  className,
  controls,
}: {
  image?: string;
  className?: string;
  controls?: boolean;
}) {
  return (
    <ImageShaderCanvas
      fragmentShader={FRAGMENT_SHADER}
      image={image}
      className={className}
      controls={controls}
    />
  );
}
