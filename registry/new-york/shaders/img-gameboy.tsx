"use client";

/**
 * Four-shade DMG green palette with ordered dithering and chunky pixels.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      float Bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 grid = vec2(140.0 * aspect, 140.0);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        float l = luma(texCover(puv).rgb);
        l += (Bayer4(uv * grid) - 0.5) * 0.25;
        l = clamp(l, 0.0, 1.0);
        vec3 c0 = vec3(0.06, 0.22, 0.06);
        vec3 c1 = vec3(0.19, 0.40, 0.19);
        vec3 c2 = vec3(0.55, 0.67, 0.06);
        vec3 c3 = vec3(0.61, 0.74, 0.06);
        vec3 col = l < 0.25 ? c0 : l < 0.5 ? c1 : l < 0.75 ? c2 : c3;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Gameboy({
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
