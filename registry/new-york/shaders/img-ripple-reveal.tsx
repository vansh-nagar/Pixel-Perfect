"use client";

/**
 * Hover to send a rippling ring out from the centre, warping the first image aside as the next floods in.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float aspect = resolution.x / resolution.y;
        vec2 c = uv - 0.5;
        c.x *= aspect;
        float dist = length(c);
        float maxd = 0.5 * sqrt(1.0 + aspect * aspect);
        float front = p * (maxd + 0.1);
        float ring = 1.0 - smoothstep(0.0, 0.12, abs(dist - front));
        vec2 dir = c / (dist + 1e-4);
        vec2 warp = dir * ring * 0.03 * sin((dist - front) * 60.0);
        warp.x /= aspect;
        float reveal = step(dist, front);
        vec3 col = mix(texCover(uv + warp).rgb, texCoverB(uv + warp).rgb, reveal);
        col += ring * 0.2 * step(0.02, p) * step(p, 0.98);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function RippleReveal({
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
