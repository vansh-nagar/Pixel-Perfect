"use client";

/**
 * Rebuilds the image from ink dots that grow where the picture is darker.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 90.0;
        vec2 grid = vec2(scale * aspect, scale);
        vec2 cell = fract(uv * grid) - 0.5;
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;
        vec3 col = texCover(cuv).rgb;
        float radius = (1.0 - luma(col)) * 0.7;
        float dot = smoothstep(radius, radius - 0.12, length(cell));
        gl_FragColor = vec4(mix(vec3(1.0), col, dot), 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Halftone({
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
