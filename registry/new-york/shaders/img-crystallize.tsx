"use client";

/**
 * Shatters the image into flat Voronoi cells with dark stained-glass leading.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 18.0;
        vec2 p = vec2(uv.x * aspect, uv.y) * scale;
        vec2 ip = floor(p), fp = fract(p);
        float md = 8.0, md2 = 8.0;
        vec2 mseed = ip;
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 g = vec2(float(x), float(y));
            vec2 o = vec2(hash21(ip + g), hash21(ip + g + 3.7));
            float d = length(g + o - fp);
            if (d < md) { md2 = md; md = d; mseed = ip + g + o; }
            else if (d < md2) { md2 = d; }
          }
        }
        vec2 cuv = vec2(mseed.x / aspect, mseed.y) / scale;
        vec3 col = texCover(cuv).rgb;
        col *= 0.35 + 0.65 * smoothstep(0.0, 0.06, md2 - md); // dark cell borders
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function Crystallize({
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
