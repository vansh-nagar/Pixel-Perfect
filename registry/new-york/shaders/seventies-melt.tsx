"use client";

/**
 * Iterated sine domain-warping melts the plane into a wobbling 70s lava haze.
 */

import ShaderCanvas from "./shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // cosine eased into a [minimum, minimum + range] band
      float cosRange(float amt, float range, float minimum) {
        return (((1.0 + cos(radians(amt))) * 0.5) * range) + minimum;
      }

      void main() {
        const int zoom = 40;
        const float brightness = 0.975;
        float t = time * 1.25;
        vec2 p = (2.0 * gl_FragCoord.xy - resolution.xy)
               / max(resolution.x, resolution.y);
        float ct = cosRange(t * 5.0, 3.0, 1.1);
        float xBoost = cosRange(t * 0.2, 5.0, 5.0);
        float yBoost = cosRange(t * 0.1, 10.0, 5.0);
        float fScale = cosRange(t * 15.5, 1.25, 0.5);

        for (int i = 1; i < zoom; i++) {
          float _i = float(i);
          vec2 newp = p;
          newp.x += 0.25 / _i
                  * sin(_i * p.y + t * cos(ct) * 0.5 / 20.0 + 0.005 * _i)
                  * fScale + xBoost;
          newp.y += 0.25 / _i
                  * sin(_i * p.x + t * ct * 0.3 / 40.0 + 0.03 * float(i + 15))
                  * fScale + yBoost;
          p = newp;
        }

        vec3 col = vec3(
          0.5 * sin(3.0 * p.x) + 0.5,
          0.5 * sin(3.0 * p.y) + 0.5,
          sin(p.x + p.y)
        );
        gl_FragColor = vec4(col * brightness, 1.0);
      }
    `;

export default function SeventiesMelt({
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
