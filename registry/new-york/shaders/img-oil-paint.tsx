"use client";

/**
 * Kuwahara filtering smears the image into soft painterly brush strokes.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Mean + summed colour variance of one quadrant around uv (Kuwahara).
      vec4 region(vec2 uv, vec2 px, vec2 corner) {
        vec3 sum = vec3(0.0), sum2 = vec3(0.0);
        const int R = 3;
        for (int i = 0; i <= R; i++) {
          for (int j = 0; j <= R; j++) {
            vec2 o = vec2(float(i), float(j)) * corner * px;
            vec3 c = texCover(uv + o).rgb;
            sum += c;
            sum2 += c * c;
          }
        }
        float n = float((R + 1) * (R + 1));
        vec3 mean = sum / n;
        vec3 var = sum2 / n - mean * mean;
        return vec4(mean, var.r + var.g + var.b);
      }
      void main() {
        vec2 uv = uv01();
        vec2 px = 1.8 / resolution;             // brush size
        vec4 a = region(uv, px, vec2( 1.0,  1.0));
        vec4 b = region(uv, px, vec2(-1.0,  1.0));
        vec4 c = region(uv, px, vec2( 1.0, -1.0));
        vec4 d = region(uv, px, vec2(-1.0, -1.0));
        vec3 col = a.rgb;
        float mv = a.w;                          // pick the flattest quadrant
        if (b.w < mv) { mv = b.w; col = b.rgb; }
        if (c.w < mv) { mv = c.w; col = c.rgb; }
        if (d.w < mv) { mv = d.w; col = d.rgb; }
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function OilPaint({
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
