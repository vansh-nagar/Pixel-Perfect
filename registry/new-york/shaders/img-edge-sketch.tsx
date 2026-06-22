"use client";

/**
 * Sobel edge detection lights up the outlines in their own colour on black.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec2 px = 1.5 / resolution;   // sampling spread, in screen pixels
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
        float edge = smoothstep(0.15, 0.7, sqrt(gx * gx + gy * gy));
        vec3 col = texCover(uv).rgb * edge * 1.8;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function EdgeSketch({
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
