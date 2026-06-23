"use client";

/**
 * Red/cyan stereo split driven by brightness-as-depth — grab your 3D glasses.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float depth = luma(texCover(uv).rgb) - 0.5;
        float sep = depth * 0.02 + 0.004;
        float red = texCover(uv - vec2(sep, 0.0)).r;
        vec3 cyan = texCover(uv + vec2(sep, 0.0)).rgb;
        gl_FragColor = vec4(red, cyan.g, cyan.b, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Anaglyph({
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
