"use client";

/**
 * A flashlight of full colour follows your cursor through a darkened image.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec3 col = texCover(uv).rgb;
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float n = fbm(uv * 8.0 + time * 0.3) * 0.04;     // wobble the beam edge
        float light = smoothstep(0.32, 0.05, dist + n);
        vec3 dim = vec3(luma(col) * 0.12);               // near-black outside
        vec3 outc = mix(dim, col, light);
        outc += col * smoothstep(0.45, 0.0, dist) * 0.15; // soft warm falloff
        gl_FragColor = vec4(outc, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function SpotlightReveal({
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
