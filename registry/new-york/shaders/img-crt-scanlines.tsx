"use client";

/**
 * Curved tube, scanlines, RGB fringe and a rolling bar — vintage television.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        // barrel distortion around the centre (the curved glass tube)
        vec2 c = uv - 0.5;
        float r2 = dot(c, c);
        uv = 0.5 + c * (1.0 + 0.18 * r2);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
        // slight per-channel offset (phosphor fringe)
        float off = 0.0016;
        vec3 col = vec3(
          texCover(uv + vec2(off, 0.0)).r,
          texCover(uv).g,
          texCover(uv - vec2(off, 0.0)).b
        );
        // scanlines + a brightness bar rolling slowly down the screen
        col *= 0.82 + 0.18 * (0.5 + 0.5 * sin(uv.y * 300.0));
        col *= 0.94 + 0.06 * sin(uv.y * 4.0 - time * 2.0);
        // vignette
        col *= smoothstep(1.0, 0.2, r2 * 2.2);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function CrtScanlines({
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
