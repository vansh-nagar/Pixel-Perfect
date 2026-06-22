"use client";

/**
 * Concentric water ripples radiate from your cursor and warp the image.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float ripple = sin(dist * 40.0 - time * 4.0)
                     * 0.012 * smoothstep(0.5, 0.0, dist);
        vec2 off = normalize(d + 1e-6) * ripple;
        off.x /= aspect;
        gl_FragColor = texCover(uv + off);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Ripple({
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
