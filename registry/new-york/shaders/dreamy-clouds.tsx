"use client";

/**
 * Soft photographic cumulus clouds drifting across a periwinkle-to-pink dream sky — layered for depth, with lit tops and cool shadowed undersides.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // iq-style double domain warp → billowy, self-similar cloud structure
      float cloudShape(vec2 p) {
        vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
        vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2)),
                      fbm(p + 4.0 * q + vec2(8.3, 2.8)));
        return fbm(p + 4.0 * r);
      }

      // one drifting cloud layer → vec4(colour, density)
      vec4 cloudLayer(vec2 uv, float aspect, float scale, float spd, float cover) {
        vec2 p = vec2(uv.x * aspect, uv.y) * scale + vec2(time * spd, 0.0);
        float d = cloudShape(p);
        float density = smoothstep(cover, cover + 0.16, d);   // soft rounded masses
        // self-shadow: brighter where the cloud lifts toward the light (up),
        // cool blue-grey where it falls into the underside.
        float below = cloudShape(p + vec2(0.0, -0.14));
        float lift = clamp((d - below) * 3.5 + 0.55, 0.0, 1.0);
        vec3 shadowC = vec3(0.72, 0.74, 0.85);
        vec3 litC = vec3(1.0, 0.99, 0.99);
        return vec4(mix(shadowC, litC, lift), density);
      }

      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;

        // dreamy periwinkle → lavender → warm-pink sky
        vec3 col = mix(vec3(0.60, 0.60, 0.85), vec3(0.39, 0.45, 0.82),
                       smoothstep(0.35, 1.0, uv.y));
        col = mix(col, vec3(0.97, 0.84, 0.82), smoothstep(0.4, 0.0, uv.y));

        // soft hazy sun high in the sky
        float sd = distance(vec2(uv.x * aspect, uv.y), vec2(0.5 * aspect, 0.92));
        col += vec3(1.0, 0.96, 0.92) * smoothstep(0.9, 0.0, sd) * 0.10;

        // two layers → depth: a faint far bank behind brighter near clouds
        vec4 far = cloudLayer(uv, aspect, 1.3, 0.012, 0.55);
        col = mix(col, far.rgb, far.a * 0.55);
        vec4 near = cloudLayer(uv, aspect, 2.1, 0.025, 0.50);
        col = mix(col, near.rgb, near.a);

        // silver-lining bloom on the brightest cloud tops
        col += near.a * smoothstep(0.9, 1.0, near.r) * 0.06;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function DreamyClouds({
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
