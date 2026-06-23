"use client";

/**
 * A ballpoint-pen cross-hatch rendering — strokes follow the image's form on grainy paper with a vignette. Adapted (single-pass) from flockaroo, CC BY-NC-SA.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      // Ballpoint pen drawing — single-pass adaptation of flockaroo's "ballpoint
      // line drawing" (2018), CC BY-NC-SA 3.0. The original is multi-buffer; this
      // recreates the look with procedural cross-hatching that follows image
      // structure, procedural paper grain, and the same vignette math.

      float penVal(vec2 uv) { return luma(texCover(uv).rgb); }

      // 1 near a stroke line, 0 between them; runs perpendicular to \`ang\`.
      float hatch(vec2 fc, float ang, float spacing, float wob) {
        vec2 n = vec2(-sin(ang), cos(ang));
        float coord = dot(fc, n);
        float l = abs(fract(coord / spacing + wob) - 0.5) * 2.0;
        return 1.0 - smoothstep(0.18, 0.55, l);
      }

      void main() {
        vec2 uv = uv01();
        vec2 px = 1.0 / resolution.xy;
        vec2 fc = uv * resolution.xy;

        // value + gradient of the image (gradient → stroke direction follows form)
        float e = 1.5 * px.y;
        float v = penVal(uv);
        vec2 grad = vec2(
          penVal(uv + vec2(e, 0.0)) - penVal(uv - vec2(e, 0.0)),
          penVal(uv + vec2(0.0, e)) - penVal(uv - vec2(0.0, e))
        );
        float gmag = length(grad);
        float gang = atan(grad.y, grad.x);
        // strokes run perpendicular to the gradient (along iso-luminance); in flat
        // areas fall back to a fixed 45° hatch.
        float follow = smoothstep(0.0, 0.015, gmag);
        float baseAng = mix(0.7853982, gang + 1.5707963, follow);

        // hand-drawn pen wobble, with a slow redraw flicker for life
        float wob = fbm(uv * 7.0 + floor(time * 8.0) * 0.04) * 0.6;

        // build up hatch layers as the image gets darker
        float d = 1.0 - v;
        float ink = 0.0;
        ink += hatch(fc, baseAng,        5.0, wob) * smoothstep(0.22, 0.34, d);
        ink += hatch(fc, baseAng + 0.85, 5.5, wob) * smoothstep(0.40, 0.52, d);
        ink += hatch(fc, baseAng - 0.65, 6.0, wob) * smoothstep(0.58, 0.70, d);
        ink += hatch(fc, baseAng + 0.30, 4.5, wob) * smoothstep(0.76, 0.88, d);
        ink = clamp(ink, 0.0, 1.0);

        // paper: warm white with fibrous grain
        float fiber = fbm(uv * resolution.xy * 0.16);
        vec3 paper = vec3(0.96, 0.95, 0.91) - fiber * 0.05;
        // ballpoint ink (blue-black), bleeding slightly with the paper fiber
        vec3 pen = vec3(0.06, 0.09, 0.26) + fiber * 0.04;
        vec3 col = mix(paper, pen, ink);

        // vignette + edge falloff (ported from flockaroo's Image pass)
        vec2 sc = (fc - 0.5 * resolution.xy) / resolution.x;
        float vign = 1.0 - 0.3 * dot(sc, sc);
        vign *= 1.0 - 0.7 * exp(-sin(uv.x * 3.1416) * 40.0);
        vign *= 1.0 - 0.7 * exp(-sin(uv.y * 3.1416) * 20.0);
        col *= vign;

        gl_FragColor = vec4(col, 1.0);
      }
    `;
const DEFAULT_IMAGE = "/bend-image-reveal.gif";

export default function BallpointDrawing({
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
