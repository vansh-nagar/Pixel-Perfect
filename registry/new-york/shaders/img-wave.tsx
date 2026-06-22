"use client";

/**
 * Gently ripples the whole image like a flag in a slow breeze.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        uv.x += sin(uv.y * 12.0 + time * 2.0) * 0.012;
        uv.y += sin(uv.x * 12.0 + time * 1.5) * 0.012;
        gl_FragColor = texCover(uv);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Wave({
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
