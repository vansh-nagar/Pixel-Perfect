"use client";

/**
 * The image is cracked into Voronoi glass shards — move your cursor to blow them outward, leaving dark leading between the pieces.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 11.0;
        vec2 p = vec2(uv.x * aspect, uv.y) * scale;
        vec2 ip = floor(p), fp = fract(p);

        // nearest + second-nearest Voronoi feature points (3x3 search)
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

        // each shard slides away from the cursor, scaled by its distance
        vec2 cellUv = vec2(mseed.x / aspect, mseed.y) / scale;
        vec2 toM = cellUv - mouse;
        vec2 dm = toM; dm.x *= aspect;
        float dist = length(dm);
        float force = smoothstep(0.42, 0.0, dist);
        float rr = hash21(mseed * 1.7);
        vec2 off = (toM / (dist + 1e-4)) * force * 0.12 * (0.5 + rr);

        vec3 col = texCover(uv - off).rgb;
        float border = smoothstep(0.0, 0.04, md2 - md); // dark leading between shards
        col *= 0.4 + 0.6 * border;
        col += force * (1.0 - border) * 0.15;           // refracted edge glints
        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function GlassShatter({
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
