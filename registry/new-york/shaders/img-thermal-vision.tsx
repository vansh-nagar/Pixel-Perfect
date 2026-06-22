"use client";

/**
 * Maps brightness onto an infrared heat ramp — cold indigo to white-hot.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // classic infrared ramp: black → indigo → red → orange → white-hot
      vec3 thermal(float t) {
        vec3 c = mix(vec3(0.0, 0.0, 0.12), vec3(0.34, 0.0, 0.55),
                     smoothstep(0.0, 0.25, t));
        c = mix(c, vec3(0.86, 0.0, 0.30), smoothstep(0.25, 0.5, t));
        c = mix(c, vec3(1.0, 0.55, 0.0), smoothstep(0.5, 0.75, t));
        c = mix(c, vec3(1.0, 1.0, 0.75), smoothstep(0.75, 1.0, t));
        return c;
      }
      void main() {
        vec2 uv = uv01();
        float l = luma(texCover(uv).rgb);
        l += (fbm(uv * 7.0 + time * 0.5) - 0.5) * 0.06; // heat shimmer
        gl_FragColor = vec4(thermal(clamp(l, 0.0, 1.0)), 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function ThermalVision({
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
