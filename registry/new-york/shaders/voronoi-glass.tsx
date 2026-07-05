"use client";

/**
 * Animated stained-glass voronoi cells with dark grout lines and a soft glow at every border.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // iq's edge-distance voronoi with palette-tinted cells, in the spirit
      // of Paper Shaders' voronoi.
      vec2 voroPoint(vec2 cell) {
        vec2 o = vec2(hash21(cell), hash21(cell + 19.19));
        return 0.5 + 0.38 * sin(time * 0.7 + TAU * o);
      }

      void main() {
        vec2 p = uvCentered() * 3.2;
        vec2 n = floor(p);
        vec2 f = fract(p);

        // pass 1: nearest cell point
        vec2 mg = vec2(0.0);
        vec2 mr = vec2(0.0);
        float md = 8.0;
        for (int j = -1; j <= 1; j++) {
          for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 r = g + voroPoint(n + g) - f;
            float d = dot(r, r);
            if (d < md) { md = d; mr = r; mg = g; }
          }
        }

        // pass 2: true distance to the nearest cell border
        float ed = 8.0;
        for (int j = -2; j <= 2; j++) {
          for (int i = -2; i <= 2; i++) {
            vec2 g = mg + vec2(float(i), float(j));
            vec2 r = g + voroPoint(n + g) - f;
            if (dot(mr - r, mr - r) > 1e-5) {
              ed = min(ed, dot(0.5 * (mr + r), normalize(r - mr)));
            }
          }
        }

        vec3 cellCol = palette(
          hash21(n + mg) * 0.9 + time * 0.04,
          vec3(0.5), vec3(0.45), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        // shade cells toward their borders, then grout + glow
        vec3 col = cellCol * (0.45 + 0.55 * smoothstep(0.0, 0.35, ed));
        col = mix(vec3(0.03, 0.03, 0.06), col, smoothstep(0.02, 0.08, ed));
        col += cellCol * smoothstep(0.16, 0.02, ed) * 0.18;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function VoronoiGlass({
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
