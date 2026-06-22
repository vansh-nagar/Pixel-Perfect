"use client";

/**
 * Hover to punch through a radial zoom-blur — the first image streaks outward as the second rushes in.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = smoothstep(0.0, 1.0, uProgress);
        vec2 c = uv - 0.5;
        float blur = sin(p * 3.14159265) * 0.25;   // strongest mid-transition
        vec3 a = vec3(0.0), b = vec3(0.0);
        const int N = 8;
        for (int i = 0; i < N; i++) {
          float k = (float(i) / float(N - 1) - 0.5) * 2.0; // -1..1
          float s = 1.0 + blur * k;                        // radial scale jitter
          a += texCover(0.5 + c * s).rgb;
          b += texCoverB(0.5 + c * s).rgb;
        }
        a /= float(N);
        b /= float(N);
        gl_FragColor = vec4(mix(a, b, p), 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function ZoomBlurTransition({
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
