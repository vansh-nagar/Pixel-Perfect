"use client";

/**
 * Stacked glowing sine lines drifting at staggered speeds through a cosine palette.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // cosine palette tuned for the wave hues
      vec3 wavePalette(float t) {
        return vec3(0.5)
             + vec3(0.5) * cos(TAU * (vec3(1.0) * t + vec3(0.1, 0.4, 0.5)));
      }

      // one glowing sine line, tinted by hue
      vec3 waveLine(vec2 uv, float amp, float freq, float phase, float thick, vec3 hue) {
        float y = uv.y + amp * sin(freq * (uv.x - phase));
        float bright = smoothstep(0.0, 1.0, 1.0 - abs(y) / thick);
        return vec3(bright) * hue;
      }

      void main() {
        vec2 uv = uvCentered();
        vec3 col = vec3(0.0);
        for (float layer = 0.0; layer < 1.0; layer += 0.1) {
          float amp = 0.25 + 0.25 * sin(time + layer) * (1.0 - layer);
          float phase = time * (1.0 - layer);
          float thick = 0.01 + 0.001 * pow(abs(uv.x), 8.0);
          vec3 hue = wavePalette(0.5 * uv.x + layer - 0.5 * time);
          col += waveLine(uv, amp, 2.0, phase, thick, hue);
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function WaveLines({
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
