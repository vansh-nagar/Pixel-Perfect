"use client";

/**
 * Rebuilds the image from terminal glyphs whose density tracks brightness.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // ink coverage of a procedural glyph for brightness b, at cell pos cp (0..1)
      float asciiInk(vec2 cp, float b) {
        vec2 g = floor(cp * 5.0);
        float x = g.x, y = g.y;
        float cx = abs(x - 2.0) < 0.5 ? 1.0 : 0.0;
        float cy = abs(y - 2.0) < 0.5 ? 1.0 : 0.0;
        float checker = mod(x + y, 2.0) < 0.5 ? 1.0 : 0.0;
        float center = (cx > 0.5 && cy > 0.5) ? 1.0 : 0.0;
        float ink = 0.0;
        if (b > 0.9) ink = 1.0;                       // full block
        else if (b > 0.7) ink = checker;              // #
        else if (b > 0.5) ink = max(cx, cy);          // +
        else if (b > 0.32) ink = center + ((abs(x - 1.0) < 0.5 && abs(y - 3.0) < 0.5) ? 1.0 : 0.0);
        else if (b > 0.16) ink = center;              // .
        return clamp(ink, 0.0, 1.0);
      }
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float cells = 44.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;
        vec3 src = texCover(cuv).rgb;
        float ink = asciiInk(fract(uv * grid), luma(src));
        gl_FragColor = vec4(src * 1.2 * ink, 1.0); // glyphs tinted by the image
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function AsciiArt({
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
