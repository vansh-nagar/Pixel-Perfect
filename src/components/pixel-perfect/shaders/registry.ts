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
    id: "organic-radial",
    name: "Organic Radial Gradients shader",
    title: "Organic Radial",
    description:
      "A warm gold core melting into burnt orange through soft, domain-warped concentric rings.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 p = uv;
        p.x *= aspect;

        float t = time * 0.06;
        vec2 center = vec2(0.40 * aspect, 0.50);

        vec2 warp = vec2(
          fbm(p * 1.1 + t),
          fbm(p * 1.1 + vec2(4.7, 2.3) - t * 0.8)
        );
        vec2 wp = (p - center) + (warp - 0.5) * 0.38;
        wp.y *= 1.18;

        float d = length(wp);
        float bands = sin(d * 4.6 - t * 1.4) * 0.5 + 0.5;
        bands = smoothstep(0.1, 0.95, bands);

        vec3 orange = vec3(0.78, 0.33, 0.0);
        vec3 gold = vec3(0.80, 0.66, 0.02);
        vec3 col = mix(orange, gold, bands);

        float core = smoothstep(0.55, 0.0, d);
        col = mix(col, vec3(0.86, 0.75, 0.10), core * 0.55);

        float edge = smoothstep(0.2, 1.3, d);
        col = mix(col, orange * 0.92, edge * 0.35);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "aurora",
    name: "Aurora shader",
    title: "Aurora",
    description:
      "Soft brand-color light flowing like an aurora — calm enough to sit behind hero text.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 p = uv;
        p.x *= aspect;
        float t = time * 0.06;

        float n1 = fbm(p * 1.3 + vec2(t, t * 0.5));
        float n2 = fbm(p * 1.8 - vec2(t * 0.6, t * 0.3) + n1);

        vec3 c1 = vec3(0.20, 0.32, 0.85);
        vec3 c2 = vec3(0.45, 0.30, 0.88);
        vec3 c3 = vec3(0.25, 0.70, 0.80);
        vec3 c4 = vec3(0.93, 0.55, 0.70);

        vec3 col = mix(c1, c2, smoothstep(0.2, 0.8, n1));
        col = mix(col, c3, smoothstep(0.35, 0.95, n2));
        col = mix(col, c4, smoothstep(0.55, 1.0, n1 * n2) * 0.7);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "gradient-mesh",
    name: "Gradient Mesh shader",
    title: "Gradient Mesh",
    description:
      "Slowly drifting blobs of color blooming on a dark base — a modern SaaS hero background.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        float t = time * 0.2;

        vec2 p1 = vec2(0.30 * aspect, 0.35) + 0.16 * vec2(sin(t), cos(t * 0.8));
        vec2 p2 = vec2(0.75 * aspect, 0.40) + 0.16 * vec2(cos(t * 0.7), sin(t * 1.1));
        vec2 p3 = vec2(0.50 * aspect, 0.78) + 0.14 * vec2(sin(t * 0.6), cos(t));

        float w1 = exp(-dot(uv - p1, uv - p1) * 4.5);
        float w2 = exp(-dot(uv - p2, uv - p2) * 4.5);
        float w3 = exp(-dot(uv - p3, uv - p3) * 4.5);

        vec3 col = vec3(0.05, 0.06, 0.12);
        col += vec3(0.38, 0.28, 0.95) * w1;
        col += vec3(0.95, 0.40, 0.62) * w2;
        col += vec3(0.25, 0.72, 0.95) * w3;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "silk",
    name: "Silk shader",
    title: "Silk",
    description:
      "Elegant flowing folds of deep blue and violet, like light moving over silk.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 p = uv - 0.5;
        p.x *= aspect;
        float t = time * 0.15;

        float flow = sin(p.x * 2.2 + sin(p.y * 1.8 + t) + t)
                   + 0.5 * sin(p.y * 3.0 - t * 0.8);
        float shade = 0.5 + 0.5 * sin(flow * 1.6 + t);
        shade = smoothstep(0.0, 1.0, shade);

        vec3 a = vec3(0.06, 0.07, 0.18);
        vec3 b = vec3(0.35, 0.45, 0.92);
        vec3 c = vec3(0.55, 0.35, 0.80);
        vec3 col = mix(a, b, shade);
        col = mix(col, c, smoothstep(0.4, 1.0, shade) * 0.5);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "mist",
    name: "Mist shader",
    title: "Mist",
    description:
      "A barely-there drift of soft blue fog over white — clean and very text-friendly.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 p = uv;
        p.x *= aspect;
        float t = time * 0.04;

        float f = fbm(p * 2.0 + vec2(t, t * 0.3));
        f = mix(f, fbm(p * 4.0 - vec2(t * 0.5, 0.0)), 0.4);

        vec3 base = vec3(0.90, 0.93, 0.98);
        vec3 tint = vec3(0.62, 0.70, 0.92);
        vec3 col = mix(base, tint, f * 0.7);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "dot-grid",
    name: "Dot Grid shader",
    title: "Dot Grid",
    description:
      "A minimal dark dot matrix with a soft pulse rippling outward — great for tech landing pages.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 p = uv;
        p.x *= aspect;
        float t = time * 0.3;

        vec2 cell = fract(p * 26.0) - 0.5;
        float dot = smoothstep(0.22, 0.12, length(cell));
        float wave = 0.5 + 0.5 * sin(length(p - vec2(0.5 * aspect, 0.5)) * 9.0 - t * 2.0);

        vec3 bg = vec3(0.04, 0.05, 0.09);
        vec3 dotCol = mix(vec3(0.14, 0.17, 0.26), vec3(0.40, 0.52, 0.95), wave);
        vec3 col = mix(bg, dotCol, dot);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "grain-gradient",
    name: "Grain Gradient shader",
    title: "Grain Gradient",
    description:
      "A warm dusk gradient with subtle film grain — the trendy grainy-gradient hero look.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 p = uv;
        p.x *= aspect;
        float t = time * 0.04;

        float g = fbm(p * 1.1 + t);
        vec3 c1 = vec3(0.99, 0.58, 0.38);
        vec3 c2 = vec3(0.88, 0.32, 0.46);
        vec3 c3 = vec3(0.36, 0.24, 0.54);
        vec3 col = mix(c1, c2, smoothstep(0.15, 0.75, uv.y + g * 0.25));
        col = mix(col, c3, smoothstep(0.6, 1.05, uv.y + g * 0.1));

        float grain = hash21(uv * resolution.xy + floor(time * 24.0)) - 0.5;
        col += grain * 0.05;

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
    id: "warp-tunnel",
    name: "Warp Tunnel shader",
    title: "Warp Tunnel",
    description:
      "An endless polar tunnel of noise rushing toward a glowing core.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.3;
        float a = atan(uv.y, uv.x);
        float r = length(uv);
        vec2 polar = vec2(a / TAU + 0.5, 0.25 / r + t);
        float n = fbm(polar * 6.0);
        vec3 col = palette(
          n + t * 0.1,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.1, 0.2, 0.35)
        );
        col *= smoothstep(0.0, 0.45, r);
        col += vec3(0.9, 0.85, 0.7) * smoothstep(0.25, 0.0, r);
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
    id: "julia-dream",
    name: "Julia Dream shader",
    title: "Julia Dream",
    description:
      "A living Julia-set fractal whose seed orbits the complex plane forever.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uvCentered() * 1.4;
        float t = time * 0.15;
        vec2 c = 0.7885 * vec2(cos(t), sin(t * 1.1));
        vec2 z = uv;
        const int STEPS = 100;
        float iter = 0.0;
        for (int i = 0; i < STEPS; i++) {
          z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
          if (dot(z, z) > 4.0) break;
          iter += 1.0;
        }
        float m = iter / float(STEPS);
        vec3 col = palette(
          m * 2.0 + t * 0.2,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        col *= 1.0 - step(0.999, m);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "voronoi-cells",
    name: "Voronoi Cells shader",
    title: "Voronoi Cells",
    description:
      "Breathing cellular network with glowing cores and inky borders.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        uv *= 4.0;
        float t = time * 0.6;
        vec2 g = floor(uv);
        vec2 f = fract(uv);
        float minDist = 8.0;
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 lat = vec2(float(x), float(y));
            vec2 rnd = vec2(
              hash21(g + lat),
              hash21(g + lat + vec2(31.0, 17.0))
            );
            vec2 pt = 0.5 + 0.5 * sin(t + TAU * rnd);
            vec2 r = lat + pt - f;
            minDist = min(minDist, dot(r, r));
          }
        }
        float d = sqrt(minDist);
        vec3 col = palette(
          0.5 * d + t * 0.05,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.12, 0.25)
        );
        col *= smoothstep(0.0, 0.55, d);
        col += smoothstep(0.12, 0.0, d) * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "synthwave-grid",
    name: "Synthwave Grid shader",
    title: "Synthwave Grid",
    description:
      "Retro neon grid racing toward a banded sun under a magenta sky.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 p = uv - 0.5;
        p.x *= aspect;
        float t = time * 0.5;

        vec3 col = mix(vec3(0.10, 0.02, 0.20), vec3(0.85, 0.18, 0.45), pow(uv.y, 1.5));

        float sun = length((p - vec2(0.0, 0.18)) * vec2(1.0, 1.1));
        vec3 sunCol = mix(vec3(1.0, 0.85, 0.2), vec3(1.0, 0.25, 0.55), smoothstep(0.0, 0.3, sun));
        float sunBody = smoothstep(0.31, 0.29, sun);
        float bands = smoothstep(0.0, 0.5, sin((uv.y - 0.18) * 80.0));
        float cut = mix(1.0, bands, smoothstep(0.5, 0.35, uv.y));
        col = mix(col, sunCol, sunBody * cut);

        float horizon = 0.42;
        float below = smoothstep(horizon + 0.005, horizon - 0.005, uv.y);
        float depth = horizon - uv.y;
        float persp = 1.0 / max(depth, 0.001);
        float gx = abs(fract(p.x * persp * 0.35) - 0.5);
        float gy = abs(fract(persp * 0.15 + t) - 0.5);
        float line = max(smoothstep(0.06, 0.0, gx), smoothstep(0.06, 0.0, gy));
        col = mix(col, vec3(0.02, 0.0, 0.06), below);
        col += vec3(0.1, 1.0, 0.95) * line * below;

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
    id: "infernal-flame",
    name: "Infernal Flame shader",
    title: "Infernal Flame",
    description: "A turbulent column of fire licking upward through the dark.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float t = time * 0.6;
        vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
        float n = fbm(vec2(p.x * 3.0, p.y * 3.0 - t * 2.5));
        float flame = n + (1.0 - uv.y) * 1.1;
        flame *= smoothstep(0.55, 0.0, abs(p.x) * 1.6);
        vec3 col = vec3(0.02, 0.0, 0.02);
        col = mix(col, vec3(0.7, 0.06, 0.0), smoothstep(0.35, 0.7, flame));
        col = mix(col, vec3(1.0, 0.55, 0.0), smoothstep(0.7, 1.05, flame));
        col = mix(col, vec3(1.0, 0.95, 0.6), smoothstep(1.05, 1.5, flame));
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
    id: "oil-slick",
    name: "Oil Slick shader",
    title: "Oil Slick",
    description:
      "Iridescent thin-film sheen drifting across a dark fluid surface.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        float t = time * 0.12;
        float n = fbm(uv * 3.0 + t);
        float n2 = fbm(uv * 3.0 + n + vec2(2.3, 1.1) - t);
        vec3 col = palette(
          n2 * 3.0 + n,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        col *= 0.55 + 0.55 * n;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "vortex-swirl",
    name: "Vortex Swirl shader",
    title: "Vortex Swirl",
    description:
      "A noise field dragged into a tightening spiral around a glowing eye.",
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uvCentered();
        float t = time * 0.3;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        a += 2.2 / (r + 0.25) - t * 2.0;
        vec2 p = vec2(cos(a), sin(a)) * r;
        float n = fbm(p * 3.0 + t);
        vec3 col = palette(
          n + r * 0.6 - t * 0.2,
          vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.1, 0.3, 0.6)
        );
        col *= smoothstep(1.4, 0.1, r) + 0.15;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
];

export const getShader = (id: string): Shader | undefined =>
  SHADERS.find((s) => s.id === id);
