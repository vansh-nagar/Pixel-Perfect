"use client";

/**
 * Swirls the pixels into a spinning vortex centred on your cursor.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float r = length(d);
        float amt = smoothstep(0.45, 0.0, r);
        float angle = amt * 3.5 * (0.6 + 0.4 * sin(time * 0.6));
        d = rot(angle) * d;
        d.x /= aspect;
        gl_FragColor = texCover(mouse + d);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Twirl({
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
