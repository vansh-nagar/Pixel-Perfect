"use client";

/**
 * Maps brightness onto a two-colour gradient that shifts through the spectrum.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float l = luma(texCover(uv).rgb);
        vec3 shadow = palette(
          time * 0.05,
          vec3(0.2), vec3(0.2), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        vec3 light = palette(
          time * 0.05 + 0.5,
          vec3(0.7), vec3(0.3), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        gl_FragColor = vec4(mix(shadow, light, smoothstep(0.0, 1.0, l)), 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Duotone({
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
