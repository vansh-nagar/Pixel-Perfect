"use client";

/**
 * Snaps the image to a square grid whose resolution breathes over time.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float cells = mix(18.0, 110.0, 0.5 + 0.5 * sin(time * 0.6));
        vec2 grid = vec2(cells * aspect, cells);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        gl_FragColor = texCover(puv);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Pixelate({
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
