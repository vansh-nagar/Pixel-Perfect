"use client";

/**
 * Hover to crunch both images into chunky mosaic blocks that flip over, staggered, into the second.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float p = uProgress;
        float chunk = sin(p * 3.14159265);        // blockiest mid-transition
        float cells = mix(220.0, 22.0, chunk);
        vec2 grid = vec2(cells * aspect, cells);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        float r = hash21(floor(uv * grid));        // per-block stagger
        float reveal = smoothstep(r - 0.25, r + 0.25, p);
        vec3 col = mix(texCover(puv).rgb, texCoverB(puv).rgb, reveal);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";
const DEFAULT_IMAGE_B = "/fluid-transition.gif";

export default function PixelMeltTransition({
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
