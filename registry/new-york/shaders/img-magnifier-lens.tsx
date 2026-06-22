"use client";

/**
 * A fish-eye loupe follows your cursor, zooming the image right beneath it.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float radius = 0.22;
        vec2 suv = uv;
        if (dist < radius) {
          float t = dist / radius;
          float k = mix(0.5, 1.0, smoothstep(0.0, 1.0, t)); // zoom hardest at centre
          suv = mouse + (uv - mouse) * k;
        }
        vec3 col = texCover(suv).rgb;
        // glass rim: thin bright ring at the lens edge
        float rim = smoothstep(radius, radius - 0.012, dist)
                  - smoothstep(radius - 0.02, radius - 0.032, dist);
        col += rim * 0.45;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function MagnifierLens({
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
