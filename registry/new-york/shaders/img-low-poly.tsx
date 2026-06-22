"use client";

/**
 * Flat-shades the image across a grid split into triangles, geometric-art style.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 24.0;
        vec2 p = vec2(uv.x * aspect, uv.y) * scale;
        vec2 ip = floor(p), fp = fract(p);
        vec2 tri = (fp.x + fp.y < 1.0)
          ? vec2(1.0 / 3.0, 1.0 / 3.0)
          : vec2(2.0 / 3.0, 2.0 / 3.0);
        vec2 cp = ip + tri;
        vec2 cuv = vec2(cp.x / aspect, cp.y) / scale;
        gl_FragColor = vec4(texCover(cuv).rgb, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function LowPoly({
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
