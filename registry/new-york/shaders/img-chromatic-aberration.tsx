"use client";

/**
 * Red and blue channels drift apart toward the edges with a slow pulse.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec2 dir = uv - 0.5;
        float amt = (0.004 + 0.012 * length(dir)) * (0.6 + 0.4 * sin(time));
        float r = texCover(uv + dir * amt).r;
        float g = texCover(uv).g;
        float b = texCover(uv - dir * amt).b;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function ChromaticAberration({
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
