export type ImageShader = {
  id: string;
  name: string;
  /** Short label used in the gallery card / preview. */
  title: string;
  description: string;
  /** Public path (or URL) of the image the shader samples. */
  image: string;
  /**
   * GLSL `void main()` body. On top of the shared COMMON_GLSL helpers, image
   * shaders also get: `texCover(vec2 uv)` (cover-fitted sample), `coverUV`,
   * `luma(vec3)`, plus `uTexture` / `uImageResolution`.
   */
  fragmentShader: string;
};

const DEMO = "/bend-image-reveal.gif";

export const IMAGE_SHADERS: ImageShader[] = [
  {
    id: "chromatic-aberration",
    name: "Chromatic Aberration shader",
    title: "Chromatic Aberration",
    description:
      "Red and blue channels drift apart toward the edges with a slow pulse.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec2 dir = uv - 0.5;
        float amt = (0.004 + 0.012 * length(dir)) * (0.6 + 0.4 * sin(time));
        float r = texCover(uv + dir * amt).r;
        float g = texCover(uv).g;
        float b = texCover(uv - dir * amt).b;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `,
  },
  {
    id: "pixelate",
    name: "Pixelate shader",
    title: "Pixelate",
    description:
      "Snaps the image to a square grid whose resolution breathes over time.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float cells = mix(18.0, 110.0, 0.5 + 0.5 * sin(time * 0.6));
        vec2 grid = vec2(cells * aspect, cells);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        gl_FragColor = texCover(puv);
      }
    `,
  },
  {
    id: "ripple",
    name: "Ripple shader",
    title: "Ripple",
    description:
      "Concentric water ripples radiate from your cursor and warp the image.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float ripple = sin(dist * 40.0 - time * 4.0)
                     * 0.012 * smoothstep(0.5, 0.0, dist);
        vec2 off = normalize(d + 1e-6) * ripple;
        off.x /= aspect;
        gl_FragColor = texCover(uv + off);
      }
    `,
  },
  {
    id: "glitch",
    name: "Glitch shader",
    title: "Glitch",
    description:
      "Random horizontal slices tear and shift with bursts of RGB noise.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float t = floor(time * 12.0);
        float line = floor(uv.y * 24.0);
        float n = hash21(vec2(line, t));
        float glitch = step(0.78, n);
        float shift = (hash21(vec2(line, t + 1.0)) - 0.5) * glitch * 0.12;
        uv.x = fract(uv.x + shift);
        float ca = glitch * 0.02;
        float r = texCover(uv + vec2(ca, 0.0)).r;
        float g = texCover(uv).g;
        float b = texCover(uv - vec2(ca, 0.0)).b;
        vec3 col = vec3(r, g, b) + glitch * 0.05;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "halftone",
    name: "Halftone shader",
    title: "Halftone",
    description:
      "Rebuilds the image from ink dots that grow where the picture is darker.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 90.0;
        vec2 grid = vec2(scale * aspect, scale);
        vec2 cell = fract(uv * grid) - 0.5;
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;
        vec3 col = texCover(cuv).rgb;
        float radius = (1.0 - luma(col)) * 0.7;
        float dot = smoothstep(radius, radius - 0.12, length(cell));
        gl_FragColor = vec4(mix(vec3(1.0), col, dot), 1.0);
      }
    `,
  },
  {
    id: "twirl",
    name: "Twirl shader",
    title: "Twirl",
    description:
      "Swirls the pixels into a spinning vortex centred on your cursor.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float r = length(d);
        float amt = smoothstep(0.45, 0.0, r);
        float angle = amt * 3.5 * (0.6 + 0.4 * sin(time * 0.6));
        d = rot(angle) * d;
        d.x /= aspect;
        gl_FragColor = texCover(mouse + d);
      }
    `,
  },
  {
    id: "duotone",
    name: "Duotone shader",
    title: "Duotone",
    description:
      "Maps brightness onto a two-colour gradient that shifts through the spectrum.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float l = luma(texCover(uv).rgb);
        vec3 shadow = palette(
          time * 0.05,
          vec3(0.2), vec3(0.2), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        vec3 light = palette(
          time * 0.05 + 0.5,
          vec3(0.7), vec3(0.3), vec3(1.0), vec3(0.0, 0.33, 0.67)
        );
        gl_FragColor = vec4(mix(shadow, light, smoothstep(0.0, 1.0, l)), 1.0);
      }
    `,
  },
  {
    id: "wave",
    name: "Wave shader",
    title: "Wave",
    description: "Gently ripples the whole image like a flag in a slow breeze.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        uv.x += sin(uv.y * 12.0 + time * 2.0) * 0.012;
        uv.y += sin(uv.x * 12.0 + time * 1.5) * 0.012;
        gl_FragColor = texCover(uv);
      }
    `,
  },
  {
    id: "posterize",
    name: "Posterize shader",
    title: "Posterize",
    description:
      "Flattens the image into a handful of colour bands, screen-print style.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec3 col = texCover(uv).rgb;
        float steps = mix(3.0, 7.0, 0.5 + 0.5 * sin(time * 0.5));
        col = floor(col * steps + 0.5) / steps;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "crt-scanlines",
    name: "Scanline CRT shader",
    title: "Scanline CRT",
    description:
      "Curved tube, scanlines, RGB fringe and a rolling bar — vintage television.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        // barrel distortion around the centre (the curved glass tube)
        vec2 c = uv - 0.5;
        float r2 = dot(c, c);
        uv = 0.5 + c * (1.0 + 0.18 * r2);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
        // slight per-channel offset (phosphor fringe)
        float off = 0.0016;
        vec3 col = vec3(
          texCover(uv + vec2(off, 0.0)).r,
          texCover(uv).g,
          texCover(uv - vec2(off, 0.0)).b
        );
        // scanlines + a brightness bar rolling slowly down the screen
        col *= 0.82 + 0.18 * (0.5 + 0.5 * sin(uv.y * 300.0));
        col *= 0.94 + 0.06 * sin(uv.y * 4.0 - time * 2.0);
        // vignette
        col *= smoothstep(1.0, 0.2, r2 * 2.2);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "ordered-dither",
    name: "Ordered Dither shader",
    title: "Ordered Dither",
    description:
      "Bayer-matrix ordered dithering crunched down to a few colour levels.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // Recursive Bayer ordered-dither matrix (no dynamic indexing → GLES1 safe).
      float Bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
      #define Bayer8(a) (Bayer4(0.5 * (a)) * 0.25 + Bayer2(a))

      void main() {
        vec2 uv = uv01();
        // chunky pixels so the ordered dither reads as a retro screen
        float aspect = resolution.x / resolution.y;
        vec2 grid = vec2(190.0 * aspect, 190.0);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        vec3 col = texCover(puv).rgb;
        float levels = mix(2.0, 4.0, 0.5 + 0.5 * sin(time * 0.3));
        float threshold = Bayer8(uv * grid) - 0.5; // one dither cell per pixel
        col += threshold / levels;
        col = floor(col * (levels - 1.0) + 0.5) / (levels - 1.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "led-dot-matrix",
    name: "LED Dot-Matrix shader",
    title: "LED Dot-Matrix",
    description:
      "Rebuilds the image from a grid of glowing round LEDs on a black panel.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 64.0;
        vec2 grid = vec2(scale * aspect, scale);
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;   // cell centre
        vec2 cell = fract(uv * grid) - 0.5;           // -0.5..0.5 within cell
        vec3 col = texCover(cuv).rgb;
        float d = length(cell);
        float radius = 0.30 + 0.12 * luma(col);        // brighter cells light up bigger
        float led = smoothstep(radius, radius - 0.12, d);
        float glow = 0.012 / (d * d + 0.012);          // soft bloom around each LED
        gl_FragColor = vec4(col * led + col * glow * 0.25, 1.0);
      }
    `,
  },
  {
    id: "edge-sketch",
    name: "Edge / Sketch shader",
    title: "Edge Glow",
    description:
      "Sobel edge detection lights up the outlines in their own colour on black.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec2 px = 1.5 / resolution;   // sampling spread, in screen pixels
        float tl = luma(texCover(uv + px * vec2(-1.0,  1.0)).rgb);
        float t  = luma(texCover(uv + px * vec2( 0.0,  1.0)).rgb);
        float tr = luma(texCover(uv + px * vec2( 1.0,  1.0)).rgb);
        float l  = luma(texCover(uv + px * vec2(-1.0,  0.0)).rgb);
        float r  = luma(texCover(uv + px * vec2( 1.0,  0.0)).rgb);
        float bl = luma(texCover(uv + px * vec2(-1.0, -1.0)).rgb);
        float b  = luma(texCover(uv + px * vec2( 0.0, -1.0)).rgb);
        float br = luma(texCover(uv + px * vec2( 1.0, -1.0)).rgb);
        float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
        float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
        float edge = smoothstep(0.15, 0.7, sqrt(gx * gx + gy * gy));
        vec3 col = texCover(uv).rgb * edge * 1.8;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "spotlight-reveal",
    name: "Cursor Spotlight shader",
    title: "Spotlight",
    description:
      "A flashlight of full colour follows your cursor through a darkened image.",
    image: DEMO,
    fragmentShader: /* glsl */ `
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
    `,
  },
  {
    id: "magnifier-lens",
    name: "Magnifier Lens shader",
    title: "Magnifier",
    description:
      "A fish-eye loupe follows your cursor, zooming the image right beneath it.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float radius = 0.22;
        vec2 suv = uv;
        if (dist < radius) {
          float t = dist / radius;
          float k = mix(0.5, 1.0, smoothstep(0.0, 1.0, t)); // zoom hardest at centre
          suv = mouse + (uv - mouse) * k;
        }
        vec3 col = texCover(suv).rgb;
        // glass rim: thin bright ring at the lens edge
        float rim = smoothstep(radius, radius - 0.012, dist)
                  - smoothstep(radius - 0.02, radius - 0.032, dist);
        col += rim * 0.45;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "pixel-dissolve",
    name: "Pixel Dissolve shader",
    title: "Pixel Dissolve",
    description:
      "The image materialises from chunky mosaic blocks into full resolution.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float prog = 0.68 - 0.32 * cos(time * 0.55);       // 0.36..1.0 (never blank)
        float cells = mix(12.0, 200.0, prog);
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;
        vec3 blocky = texCover(cuv).rgb;
        vec3 sharp = texCover(uv).rgb;
        float r = hash21(floor(uv * grid));                // per-block randomness
        float on = smoothstep(0.0, 0.2, prog - r * 0.4);   // blocks pop in irregularly
        vec3 col = mix(vec3(0.03), blocky, on);
        col = mix(col, sharp, smoothstep(0.75, 1.0, prog));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "ink-bleed",
    name: "Ink Bleed shader",
    title: "Ink Bleed",
    description:
      "Colour blooms outward from your cursor like ink dropped into water.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec3 col = texCover(uv).rgb;
        vec3 gray = vec3(luma(col));
        float prog = 0.5 - 0.5 * cos(time * 0.4);
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float n = fbm(uv * 6.0 + time * 0.2) * 0.18;       // organic ink front
        float front = 0.25 + prog * 0.95;                  // 0.25..1.2 (always some colour)
        float ink = smoothstep(front, front - 0.15, dist + n);
        ink = max(ink, smoothstep(0.14, 0.0, dist));        // colour core stays at the cursor
        float edge = smoothstep(0.06, 0.0, abs((dist + n) - front));
        vec3 outc = mix(gray, col, ink);
        outc *= 1.0 - edge * 0.25;                          // darker wet rim
        gl_FragColor = vec4(outc, 1.0);
      }
    `,
  },
  {
    id: "depth-parallax",
    name: "Depth Parallax shader",
    title: "Depth Parallax",
    description:
      "Fake 2.5D — brightness becomes depth, so the scene tilts as you move.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float depth = luma(texCover(uv).rgb);
        // cursor offset + a gentle idle sway so it lives at rest too
        vec2 par = (mouse - 0.5) + 0.12 * vec2(sin(time * 0.5), cos(time * 0.4));
        vec2 suv = uv + par * depth * 0.06;
        gl_FragColor = vec4(texCover(suv).rgb, 1.0);
      }
    `,
  },
  {
    id: "ascii-art",
    name: "ASCII Art shader",
    title: "ASCII Art",
    description:
      "Rebuilds the image from terminal glyphs whose density tracks brightness.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // ink coverage of a procedural glyph for brightness b, at cell pos cp (0..1)
      float asciiInk(vec2 cp, float b) {
        vec2 g = floor(cp * 5.0);
        float x = g.x, y = g.y;
        float cx = abs(x - 2.0) < 0.5 ? 1.0 : 0.0;
        float cy = abs(y - 2.0) < 0.5 ? 1.0 : 0.0;
        float checker = mod(x + y, 2.0) < 0.5 ? 1.0 : 0.0;
        float center = (cx > 0.5 && cy > 0.5) ? 1.0 : 0.0;
        float ink = 0.0;
        if (b > 0.9) ink = 1.0;                       // full block
        else if (b > 0.7) ink = checker;              // #
        else if (b > 0.5) ink = max(cx, cy);          // +
        else if (b > 0.32) ink = center + ((abs(x - 1.0) < 0.5 && abs(y - 3.0) < 0.5) ? 1.0 : 0.0);
        else if (b > 0.16) ink = center;              // .
        return clamp(ink, 0.0, 1.0);
      }
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float cells = 44.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cuv = (floor(uv * grid) + 0.5) / grid;
        vec3 src = texCover(cuv).rgb;
        float ink = asciiInk(fract(uv * grid), luma(src));
        gl_FragColor = vec4(src * 1.2 * ink, 1.0); // glyphs tinted by the image
      }
    `,
  },
  {
    id: "gameboy",
    name: "Game Boy shader",
    title: "Game Boy",
    description:
      "Four-shade DMG green palette with ordered dithering and chunky pixels.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      float Bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 grid = vec2(140.0 * aspect, 140.0);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        float l = luma(texCover(puv).rgb);
        l += (Bayer4(uv * grid) - 0.5) * 0.25;
        l = clamp(l, 0.0, 1.0);
        vec3 c0 = vec3(0.06, 0.22, 0.06);
        vec3 c1 = vec3(0.19, 0.40, 0.19);
        vec3 c2 = vec3(0.55, 0.67, 0.06);
        vec3 c3 = vec3(0.61, 0.74, 0.06);
        vec3 col = l < 0.25 ? c0 : l < 0.5 ? c1 : l < 0.75 ? c2 : c3;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "hex-mosaic",
    name: "Hexagon Mosaic shader",
    title: "Hex Mosaic",
    description: "Pixelates the image onto a honeycomb grid of hexagons.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 26.0;
        vec2 p = vec2(uv.x * aspect, uv.y) * scale;
        vec2 r = vec2(1.0, 1.7320508);
        vec2 h = r * 0.5;
        vec2 a = mod(p, r) - h;
        vec2 b = mod(p - h, r) - h;
        vec2 gv = dot(a, a) < dot(b, b) ? a : b;
        vec2 center = p - gv;
        vec2 cuv = vec2(center.x / aspect, center.y) / scale;
        gl_FragColor = vec4(texCover(cuv).rgb, 1.0);
      }
    `,
  },
  {
    id: "crystallize",
    name: "Crystallize shader",
    title: "Crystallize",
    description:
      "Shatters the image into flat Voronoi cells with dark stained-glass leading.",
    image: DEMO,
    fragmentShader: /* glsl */ `
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
    `,
  },
  {
    id: "engraving",
    name: "Engraving shader",
    title: "Engraving",
    description:
      "Renders the image as inked woodcut hatch-lines on warm paper.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float l = pow(luma(texCover(uv).rgb), 0.6);   // lift the dark scene
        float shade = (1.0 - l) * 0.7;                 // cap so darks never go solid
        float freq = 150.0;
        // each period inks a fraction = shade, rest stays paper (thin lines on light)
        float v1 = fract((uv.y + sin(uv.x * 9.0) * 0.012) * freq);
        float v2 = fract((uv.x + sin(uv.y * 9.0) * 0.012) * freq);
        float ink = step(v1, shade);
        ink = max(ink, step(v2, shade - 0.35));        // cross-hatch only the darker tones
        vec3 col = mix(vec3(0.96, 0.94, 0.87), vec3(0.07), ink);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "low-poly",
    name: "Low-Poly shader",
    title: "Low Poly",
    description:
      "Flat-shades the image across a grid split into triangles, geometric-art style.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float scale = 24.0;
        vec2 p = vec2(uv.x * aspect, uv.y) * scale;
        vec2 ip = floor(p), fp = fract(p);
        vec2 tri = (fp.x + fp.y < 1.0)
          ? vec2(1.0 / 3.0, 1.0 / 3.0)
          : vec2(2.0 / 3.0, 2.0 / 3.0);
        vec2 cp = ip + tri;
        vec2 cuv = vec2(cp.x / aspect, cp.y) / scale;
        gl_FragColor = vec4(texCover(cuv).rgb, 1.0);
      }
    `,
  },
  {
    id: "anaglyph",
    name: "Anaglyph 3D shader",
    title: "Anaglyph 3D",
    description:
      "Red/cyan stereo split driven by brightness-as-depth — grab your 3D glasses.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float depth = luma(texCover(uv).rgb) - 0.5;
        float sep = depth * 0.02 + 0.004;
        float red = texCover(uv - vec2(sep, 0.0)).r;
        vec3 cyan = texCover(uv + vec2(sep, 0.0)).rgb;
        gl_FragColor = vec4(red, cyan.g, cyan.b, 1.0);
      }
    `,
  },
  {
    id: "comic-cel",
    name: "Comic Cel shader",
    title: "Comic Cel",
    description:
      "Posterised flat colours with bold inked outlines — cel-shaded comic look.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        vec3 col = floor(texCover(uv).rgb * 4.0 + 0.5) / 4.0; // posterize
        vec2 px = 1.5 / resolution;
        float tl = luma(texCover(uv + px * vec2(-1.0,  1.0)).rgb);
        float t  = luma(texCover(uv + px * vec2( 0.0,  1.0)).rgb);
        float tr = luma(texCover(uv + px * vec2( 1.0,  1.0)).rgb);
        float l  = luma(texCover(uv + px * vec2(-1.0,  0.0)).rgb);
        float r  = luma(texCover(uv + px * vec2( 1.0,  0.0)).rgb);
        float bl = luma(texCover(uv + px * vec2(-1.0, -1.0)).rgb);
        float b  = luma(texCover(uv + px * vec2( 0.0, -1.0)).rgb);
        float br = luma(texCover(uv + px * vec2( 1.0, -1.0)).rgb);
        float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
        float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
        float e = smoothstep(0.3, 0.7, sqrt(gx * gx + gy * gy));
        col = mix(col, vec3(0.04), e); // bold ink outline
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
];

export const getImageShader = (id: string): ImageShader | undefined =>
  IMAGE_SHADERS.find((s) => s.id === id);
