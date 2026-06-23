"use client";

/**
 * Tape warble, chroma bleed and a rolling tracking band — worn-out VHS.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        // tape warble: layered horizontal wobble down the screen
        uv.x += sin(uv.y * 8.0 + time * 2.0) * 0.002
              + sin(uv.y * 40.0 - time * 5.0) * 0.0015;
        // a tracking band rolling slowly up the picture
        float by = fract(uv.y + time * 0.2);
        float track = smoothstep(0.0, 0.08, by) * smoothstep(0.2, 0.1, by);
        uv.x += track
              * (hash21(vec2(floor(uv.y * 80.0), floor(time * 8.0))) - 0.5)
              * 0.05;
        // chroma bleed: split the colour channels horizontally
        float o = 0.004 + track * 0.01;
        vec3 col = vec3(
          texCover(uv + vec2(o, 0.0)).r,
          texCover(uv).g,
          texCover(uv - vec2(o, 0.0)).b
        );
        // tape noise lines + scanline darkening + slight desaturation
        col += (hash21(vec2(floor(uv.y * 240.0), floor(time * 30.0))) - 0.5) * 0.12;
        col *= 0.9 + 0.1 * sin(uv.y * 400.0);
        col = mix(col, vec3(luma(col)), 0.1);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Vhs({
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
