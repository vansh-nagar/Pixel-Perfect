"use client";

/**
 * Posterised flat colours with bold inked outlines — cel-shaded comic look.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec3 col = floor(texCover(uv).rgb * 4.0 + 0.5) / 4.0; // posterize
        vec2 px = 1.5 / resolution;
        float tl = luma(texCover(uv + px * vec2(-1.0,  1.0)).rgb);
        float t  = luma(texCover(uv + px * vec2( 0.0,  1.0)).rgb);
        float tr = luma(texCover(uv + px * vec2( 1.0,  1.0)).rgb);
        float l  = luma(texCover(uv + px * vec2(-1.0,  0.0)).rgb);
        float r  = luma(texCover(uv + px * vec2( 1.0,  0.0)).rgb);
        float bl = luma(texCover(uv + px * vec2(-1.0, -1.0)).rgb);
        float b  = luma(texCover(uv + px * vec2( 0.0, -1.0)).rgb);
        float br = luma(texCover(uv + px * vec2( 1.0, -1.0)).rgb);
        float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
        float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
        float e = smoothstep(0.3, 0.7, sqrt(gx * gx + gy * gy));
        col = mix(col, vec3(0.04), e); // bold ink outline
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function ComicCel({
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
