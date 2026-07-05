"use client";

/**
 * Gooey blobs orbiting the center and merging through a classic inverse-square field.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // In the spirit of Paper Shaders' metaballs: an inverse-square field
      // summed over moving centers, thresholded into a gooey surface.
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.6;

        float field = 0.0;
        for (int i = 0; i < 6; i++) {
          float fi = float(i);
          vec2 c = 0.55 * vec2(
            sin(t * (0.5 + 0.13 * fi) + fi * 1.7),
            cos(t * (0.4 + 0.11 * fi) + fi * 2.3)
          );
          float rad = 0.15 + 0.05 * sin(fi * 2.1 + t);
          vec2 d = uv - c;
          field += rad * rad / (dot(d, d) + 1e-4);
        }

        float body = smoothstep(0.95, 1.05, field);
        vec3 bg = vec3(0.04, 0.03, 0.08);
        // hotter color where the field is denser (cores and merges)
        vec3 col = palette(
          clamp(field * 0.35, 0.0, 1.2) - 0.15,
          vec3(0.55, 0.25, 0.35), vec3(0.45), vec3(1.0), vec3(0.0, 0.15, 0.25)
        );
        col = mix(bg, col, body);
        // bright rim right at the gooey surface
        float rim = smoothstep(0.95, 1.0, field) * (1.0 - smoothstep(1.05, 1.6, field));
        col += rim * vec3(0.9, 0.6, 0.8) * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function Metaballs({
  className,
  dpr,
  controls,
}: {
  className?: string;
  dpr?: number;
  controls?: boolean;
}) {
  return (
    <ShaderCanvas
      fragmentShader={FRAGMENT_SHADER}
      className={className}
      dpr={dpr}
      controls={controls}
    />
  );
}
