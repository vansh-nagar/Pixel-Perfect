"use client";

/**
 * Renders the image as inked woodcut hatch-lines on warm paper.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float l = pow(luma(texCover(uv).rgb), 0.6);   // lift the dark scene
        float shade = (1.0 - l) * 0.7;                 // cap so darks never go solid
        float freq = 150.0;
        // each period inks a fraction = shade, rest stays paper (thin lines on light)
        float v1 = fract((uv.y + sin(uv.x * 9.0) * 0.012) * freq);
        float v2 = fract((uv.x + sin(uv.y * 9.0) * 0.012) * freq);
        float ink = step(v1, shade);
        ink = max(ink, step(v2, shade - 0.35));        // cross-hatch only the darker tones
        vec3 col = mix(vec3(0.96, 0.94, 0.87), vec3(0.07), ink);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Engraving({
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
