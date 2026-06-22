"use client";

/**
 * Fake 2.5D — brightness becomes depth, so the scene tilts as you move.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float depth = luma(texCover(uv).rgb);
        // cursor offset + a gentle idle sway so it lives at rest too
        vec2 par = (mouse - 0.5) + 0.12 * vec2(sin(time * 0.5), cos(time * 0.4));
        vec2 suv = uv + par * depth * 0.06;
        gl_FragColor = vec4(texCover(suv).rgb, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function DepthParallax({
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
