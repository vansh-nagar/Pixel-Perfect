export type Shader = {
  id: string;
  name: string;
  /** Short label used in the gallery card / sidebar. */
  title: string;
  description: string;
  /** GLSL `void main()` body. Helpers from COMMON_GLSL are available. */
  fragmentShader: string;
};

export const SHADERS: Shader[] = [
  {
    id: "cursor-spotlight",
    name: "Cursor Spotlight shader",
    title: "Spotlight",
    description:
      "A noise-wobbled glow that tracks your cursor across the dark — hover to move it.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;

        // distance to the cursor, aspect-corrected so the glow is round
        vec2 diff = uv - mouse;
        diff.x *= aspect;
        float d = length(diff);

        // wobble the spotlight edge with animated noise (fbm is ~0..1, recenter)
        float n = fbm(uv * 6.0 + time * 0.4);
        d += (n - 0.5) * 0.1;

        float glow = smoothstep(0.2, 0.0, d);
        vec3 col = mix(vec3(0.0), vec3(1.0), glow);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "gentle-waves",
    name: "Gentle Waves shader",
    title: "Gentle Waves",
    description:
      "A calm light-to-blue gradient rolling with slow, soft waves.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float t = time * 0.12;

        float w = sin(uv.x * 3.0 + t) * 0.05
                + sin(uv.x * 6.5 - t * 1.3) * 0.025
                + sin(uv.x * 1.5 + t * 0.6) * 0.06;
        float y = uv.y + w;

        vec3 top = vec3(0.95, 0.97, 1.0);
        vec3 mid = vec3(0.55, 0.72, 0.98);
        vec3 bot = vec3(0.30, 0.45, 0.92);
        vec3 col = mix(bot, mid, smoothstep(0.0, 0.6, y));
        col = mix(col, top, smoothstep(0.55, 1.05, y));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "plasma-flow",
    name: "Plasma Flow shader",
    title: "Plasma Flow",
    description:
      "Classic interfering sine fields cycling through a vivid cosine palette.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.4;
        float v = 0.0;
        v += sin(uv.x * 3.0 + t);
        v += sin((uv.y * 3.0 + t) * 0.7);
        v += sin((uv.x * 2.0 + uv.y * 2.0 + t) * 0.8);
        vec2 c = uv + 0.6 * vec2(sin(t * 0.3), cos(t * 0.4));
        v += sin(length(c) * 5.0 - t * 1.5);
        v *= 0.25;
        vec3 col = palette(
          v,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "aurora-curtain",
    name: "Aurora Curtain shader",
    title: "Aurora Curtain",
    description:
      "Drifting ribbons of green and violet light over a deep night sky.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float t = time * 0.15;

        float n = fbm(vec2(uv.x * 2.5, uv.y * 1.5 - t));
        float curtain = fbm(vec2(uv.x * 3.0 + t, uv.y * 4.0 - t * 1.5));
        float ribbon = smoothstep(0.1, 0.7, n) * (1.0 - smoothstep(0.2, 0.95, uv.y));
        ribbon *= 0.6 + 0.4 * curtain;

        vec3 green = vec3(0.10, 0.95, 0.55);
        vec3 teal = vec3(0.10, 0.65, 0.95);
        vec3 purple = vec3(0.55, 0.20, 0.95);

        vec3 col = mix(green, teal, fbm(uv * 3.0 + t));
        col = mix(col, purple, smoothstep(0.35, 1.0, uv.y));
        col *= ribbon * 1.6;

        col += vec3(0.02, 0.03, 0.09);
        col += hash21(uv * resolution.xy) * 0.015;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "liquid-metal",
    name: "Liquid Metal shader",
    title: "Liquid Metal",
    description:
      "Layered domain warping that pools into a flowing chrome surface.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01() * 3.0;
        float t = time * 0.15;
        vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2, 1.3)));
        vec2 r = vec2(
          fbm(uv + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
          fbm(uv + 4.0 * q + vec2(8.3, 2.8))
        );
        float f = fbm(uv + 4.0 * r);
        vec3 col = mix(vec3(0.08, 0.10, 0.15), vec3(0.90, 0.93, 0.99), f);
        col = mix(col, vec3(0.35, 0.45, 0.70), clamp(length(q), 0.0, 1.0));
        col = mix(col, vec3(0.97), r.x * 0.55);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "drifting-clouds",
    name: "Drifting Clouds shader",
    title: "Drifting Clouds",
    description: "Soft warped fbm clouds rolling across a clear blue sky.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        float t = time * 0.05;
        float f = fbm(uv * 3.0 + vec2(t, t * 0.5));
        f = fbm(uv * 3.0 + f + vec2(t * 0.5, 0.0));
        vec3 sky = vec3(0.25, 0.45, 0.85);
        vec3 cloud = vec3(1.0);
        vec3 col = mix(sky, cloud, smoothstep(0.25, 0.85, f));
        col = mix(col, vec3(0.55, 0.70, 0.95), (1.0 - uv.y) * 0.25);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "neon-rings",
    name: "Neon Rings shader",
    title: "Neon Rings",
    description:
      "Pulsing, wobbling concentric rings glowing through a cosine spectrum.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.5;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        float wob = 0.05 * sin(a * 6.0 + t * 2.0);
        float rings = abs(fract((r + wob) * 4.0 - t) * 2.0 - 1.0);
        float glow = 0.025 / (rings + 0.025);
        vec3 col = palette(
          r - t * 0.2,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        ) * glow;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "kaleidoscope",
    name: "Kaleidoscope shader",
    title: "Kaleidoscope",
    description:
      "Eight-fold mirrored noise that slowly rotates through the spectrum.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.2;
        uv = rot(t * 0.3) * uv;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        float seg = TAU / 8.0;
        a = mod(a, seg);
        a = abs(a - seg * 0.5);
        vec2 p = vec2(cos(a), sin(a)) * r;
        float n = fbm(p * 3.0 + t);
        vec3 col = palette(
          n + r - t * 0.3,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "liquid-caustics",
    name: "Liquid Caustics shader",
    title: "Liquid Caustics",
    description: "Sunlight refracting through rippling water onto a pool floor.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01() * 4.0;
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        float t = time * 0.4;
        vec2 p = uv;
        for (int i = 0; i < 4; i++) {
          float fi = float(i) + 1.0;
          p += vec2(sin(p.y * 1.5 + t + fi), cos(p.x * 1.5 - t + fi)) * 0.35;
        }
        float v = abs(sin(p.x) * sin(p.y));
        float caustic = pow(1.0 - v, 4.0);
        vec3 col = mix(vec3(0.0, 0.22, 0.45), vec3(0.45, 0.95, 1.0), caustic);
        col += pow(caustic, 3.0) * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "wave-lines",
    name: "Wave Lines shader",
    title: "Wave Lines",
    description:
      "Stacked glowing sine lines drifting at staggered speeds through a cosine palette.",
    fragmentShader: /* glsl */ `
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
    `,
  },
];

export const getShader = (id: string): Shader | undefined =>
  SHADERS.find((s) => s.id === id);
