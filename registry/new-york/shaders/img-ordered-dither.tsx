"use client";

/**
 * Bayer-matrix ordered dithering crunched down to a few colour levels.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Recursive Bayer ordered-dither matrix (no dynamic indexing → GLES1 safe).
      float Bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
      #define Bayer8(a) (Bayer4(0.5 * (a)) * 0.25 + Bayer2(a))

      void main() {
        vec2 uv = uv01();
        // chunky pixels so the ordered dither reads as a retro screen
        float aspect = resolution.x / resolution.y;
        vec2 grid = vec2(190.0 * aspect, 190.0);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        vec3 col = texCover(puv).rgb;
        float levels = mix(2.0, 4.0, 0.5 + 0.5 * sin(time * 0.3));
        float threshold = Bayer8(uv * grid) - 0.5; // one dither cell per pixel
        col += threshold / levels;
        col = floor(col * (levels - 1.0) + 0.5) / (levels - 1.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function OrderedDither({
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
