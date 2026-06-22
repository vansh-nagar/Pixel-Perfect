"use client";

/**
 * Hover to ripple both frames through a flowing noise warp as one dissolves into the other.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float amt = sin(p * 3.14159265) * 0.08;    // warp peaks mid-transition
        vec2 w = vec2(
          fbm(uv * 4.0 + time * 0.3),
          fbm(uv * 4.0 + 5.0 - time * 0.2)
        ) - 0.5;
        vec3 a = texCover(uv + w * amt).rgb;
        vec3 b = texCoverB(uv + w * amt).rgb;
        gl_FragColor = vec4(mix(a, b, smoothstep(0.0, 1.0, p)), 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function LiquidTransition({
  image = DEFAULT_IMAGE,
  imageB = DEFAULT_IMAGE_B,
  className,
  controls,
}: {
  image?: string;
  imageB?: string;
  className?: string;
  controls?: boolean;
}) {
  return (
    <ImageShaderCanvas
      fragmentShader={FRAGMENT_SHADER}
      image={image}
      imageB={imageB}
      className={className}
      controls={controls}
    />
  );
}
