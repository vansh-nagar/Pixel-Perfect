export type ImageShader = {
  id: string;
  name: string;
  /** Short label used in the gallery card / preview. */
  title: string;
  description: string;
  /** Public path (or URL) of the image the shader samples. */
  image: string;
  /**
   * Optional second image. When set, the canvas becomes a hover-to-play
   * transition: `uProgress` eases 0→1 on hover. Sample it with `texCoverB(uv)`.
   */
  imageB?: string;
  /**
   * GLSL `void main()` body. On top of the shared COMMON_GLSL helpers, image
   * shaders also get: `texCover(vec2 uv)` (cover-fitted sample), `coverUV`,
   * `luma(vec3)`, plus `uTexture` / `uImageResolution`. Transition shaders also
   * get `texCoverB(vec2 uv)`, `uTextureB`, `uImageResolutionB` and `uProgress`.
   */
  fragmentShader: string;
};

const DEMO = "/bend-image-reveal.gif";
const DEMO_B = "/fluid-transition.gif";

export const IMAGE_SHADERS: ImageShader[] = [
  {
    id: "wipe-reveal",
    name: "Wipe Reveal transition",
    title: "Wipe Reveal",
    description:
      "Hover to sweep a glowing diagonal seam across the frame, wiping one image into the next.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        // position along a diagonal sweep, normalised to ~0..1
        float edge = dot(uv, normalize(vec2(1.0, 0.35))) / 1.35;
        float w = smoothstep(p - 0.04, p + 0.04, edge); // 1 = not yet wiped (A)
        vec3 col = mix(texCoverB(uv).rgb, texCover(uv).rgb, w);
        col += (1.0 - smoothstep(0.0, 0.05, abs(edge - p))) * 0.5; // glowing seam
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "pixel-melt-transition",
    name: "Pixel Melt transition",
    title: "Pixel Melt",
    description:
      "Hover to crunch both images into chunky mosaic blocks that flip over, staggered, into the second.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float p = uProgress;
        float chunk = sin(p * 3.14159265);        // blockiest mid-transition
        float cells = mix(220.0, 22.0, chunk);
        vec2 grid = vec2(cells * aspect, cells);
        vec2 puv = (floor(uv * grid) + 0.5) / grid;
        float r = hash21(floor(uv * grid));        // per-block stagger
        float reveal = smoothstep(r - 0.25, r + 0.25, p);
        vec3 col = mix(texCover(puv).rgb, texCoverB(puv).rgb, reveal);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "liquid-transition",
    name: "Liquid transition shader",
    title: "Liquid Transition",
    description:
      "Hover to ripple both frames through a flowing noise warp as one dissolves into the other.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float amt = sin(p * 3.14159265) * 0.08;    // warp peaks mid-transition
        vec2 w = vec2(
          fbm(uv * 4.0 + time * 0.3),
          fbm(uv * 4.0 + 5.0 - time * 0.2)
        ) - 0.5;
        vec3 a = texCover(uv + w * amt).rgb;
        vec3 b = texCoverB(uv + w * amt).rgb;
        gl_FragColor = vec4(mix(a, b, smoothstep(0.0, 1.0, p)), 1.0);
      }
    `,
  },
  {
    id: "pixel-rise-reveal",
    name: "Pixel Rise transition",
    title: "Pixel Rise",
    description:
      "Hover and a ragged wall of pixels climbs from the bottom, dissolving the old image block by block as the new one rises into place.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float p = uProgress;

        // chunky pixel blocks
        float cells = 42.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cell = floor(uv * grid);
        vec2 puv = (cell + 0.5) / grid;                // block centre
        float r = hash21(cell);                         // per-block randomness

        // Each block flips to the new image at its own moment as the front
        // climbs from the bottom: lower (and "luckier") blocks go first, so the
        // rising edge is a thick, ragged band of pixels, not a straight line.
        float blockP = 0.05 + puv.y * 0.78 + r * 0.17;  // in (0,1]; never 0 at rest
        float reveal = step(blockP, p);                 // 1 → new image B

        // Sample blocky through the whole transition so it reads as a pixel
        // dissolve; settle to the sharp full-res image only when idle (p≈0) or
        // done (p≈1). (No reversed-edge smoothstep — that's GLSL UB.)
        float settle = max(1.0 - smoothstep(0.0, 0.06, p),
                           smoothstep(0.94, 1.0, p));
        vec2 s = mix(puv, uv, settle);

        vec3 col = mix(texCover(s).rgb, texCoverB(s).rgb, reveal);

        // blocks crossing the front right now flash as their pixels flip over
        float edge = (1.0 - smoothstep(0.0, 0.07, abs(blockP - p)))
                   * step(0.02, p) * step(p, 0.98);
        col += edge * (0.2 + 0.45 * r);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "burn-dissolve",
    name: "Burn Dissolve transition",
    title: "Burn Dissolve",
    description:
      "Hover and the first image burns away along a glowing ember edge, revealing the next through the noise.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float n = fbm(uv * 5.0);                 // dissolve threshold map
        float edgeW = 0.1;
        float t = mix(-edgeW, 1.0 + edgeW, p);   // sweep threshold across the noise
        float reveal = 1.0 - smoothstep(t - edgeW, t + edgeW, n);
        vec3 col = mix(texCover(uv).rgb, texCoverB(uv).rgb, reveal);
        // glowing ember along the burning front
        float glow = (1.0 - smoothstep(0.0, edgeW, abs(n - t)))
                   * step(0.02, p) * step(p, 0.98);
        col += glow * vec3(1.0, 0.5, 0.15) * 0.9;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "blinds-transition",
    name: "Venetian Blinds transition",
    title: "Venetian Blinds",
    description:
      "Hover to flip open a stack of horizontal blinds, each strip wiping to the second image.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float strips = 12.0;
        float local = fract(uv.y * strips);      // 0..1 within each blind
        float reveal = step(local, p);           // blind fills as p grows
        vec3 col = mix(texCover(uv).rgb, texCoverB(uv).rgb, reveal);
        // soft shadow line at each blind's leading edge
        float seam = (1.0 - smoothstep(0.0, 0.04, abs(local - p)))
                   * step(0.02, p) * step(p, 0.98);
        col *= 1.0 - seam * 0.3;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "ripple-reveal",
    name: "Ripple Reveal transition",
    title: "Ripple Reveal",
    description:
      "Hover to send a rippling ring out from the centre, warping the first image aside as the next floods in.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float aspect = resolution.x / resolution.y;
        vec2 c = uv - 0.5;
        c.x *= aspect;
        float dist = length(c);
        float maxd = 0.5 * sqrt(1.0 + aspect * aspect);
        float front = p * (maxd + 0.1);
        float ring = 1.0 - smoothstep(0.0, 0.12, abs(dist - front));
        vec2 dir = c / (dist + 1e-4);
        vec2 warp = dir * ring * 0.03 * sin((dist - front) * 60.0);
        warp.x /= aspect;
        float reveal = step(dist, front);
        vec3 col = mix(texCover(uv + warp).rgb, texCoverB(uv + warp).rgb, reveal);
        col += ring * 0.2 * step(0.02, p) * step(p, 0.98);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "zoom-blur-transition",
    name: "Zoom Blur transition",
    title: "Zoom Blur",
    description:
      "Hover to punch through a radial zoom-blur — the first image streaks outward as the second rushes in.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = smoothstep(0.0, 1.0, uProgress);
        vec2 c = uv - 0.5;
        float blur = sin(p * 3.14159265) * 0.25;   // strongest mid-transition
        vec3 a = vec3(0.0), b = vec3(0.0);
        const int N = 8;
        for (int i = 0; i < N; i++) {
          float k = (float(i) / float(N - 1) - 0.5) * 2.0; // -1..1
          float s = 1.0 + blur * k;                        // radial scale jitter
          a += texCover(0.5 + c * s).rgb;
          b += texCoverB(0.5 + c * s).rgb;
        }
        a /= float(N);
        b /= float(N);
        gl_FragColor = vec4(mix(a, b, p), 1.0);
      }
    `,
  },
  {
    id: "checker-flip",
    name: "Checker Flip transition",
    title: "Checker Flip",
    description:
      "Hover and the image tiles into a checkerboard whose squares flip over, staggered, to the next image.",
    image: DEMO,
    imageB: DEMO_B,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float p = uProgress;
        float aspect = resolution.x / resolution.y;
        float cells = 10.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cell = floor(uv * grid);
        float checker = mod(cell.x + cell.y, 2.0);     // 0 / 1
        float r = hash21(cell);
        float cellP = 0.05 + checker * 0.45 + r * 0.45; // (0,1]: staggered order
        float reveal = step(cellP, p);
        vec3 col = mix(texCover(uv).rgb, texCoverB(uv).rgb, reveal);
        // darken each tile at the instant it flips
        float flip = (1.0 - smoothstep(0.0, 0.12, abs(cellP - p)))
                   * step(0.02, p) * step(p, 0.98);
        col *= 1.0 - flip * 0.35;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "glass-shatter",
    name: "Glass Shatter shader",
    title: "Glass Shatter",
    description:
      "The image is cracked into Voronoi glass shards — move your cursor to blow them outward, leaving dark leading between the pieces.",
    image: DEMO,
    fragmentShader: /* glsl */ `
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
    `,
  },
  {
    id: "shery-liquid",
    name: "Liquid Distortion shader",
    title: "Liquid Distortion",
    description:
      "A mesmerising simplex-noise liquid warp drifting across the image. Adapted from Shery.js (style 1), MIT — Sheryians Coding School.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // Adapted from Shery.js effect 1 (Simple Liquid Distortion), MIT.
      void main() {
        vec2 uv = uv01();
        vec3 v = vec3(uv.x + time * 0.1, uv.y, time * 0.3);
        vec2 surface = vec2(snoise(v) * 0.08, snoise(v + 4.0) * 0.02);
        gl_FragColor = texCover(uv + surface);
      }
    `,
  },
  {
    id: "shery-liquid-cursor",
    name: "Liquid Cursor shader",
    title: "Liquid Cursor",
    description:
      "A flowing liquid distortion that bends around your cursor. Adapted from Shery.js (style 5), MIT — Sheryians Coding School.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // Adapted from Shery.js effect 5 (Liquid variant, cursor-reactive), MIT.
      void main() {
        vec2 uv = uv01();
        vec2 m = mouse - 0.5;
        float n = snoise(vec3(uv - m * 0.5 + 0.2 * time, 1.0));
        vec2 surface = vec2(n * 0.08, n * 0.08);
        gl_FragColor = texCover(uv + surface);
      }
    `,
  },
  {
    id: "shery-perlin",
    name: "Perlin Distortion shader",
    title: "Perlin Distortion",
    description:
      "A pulsing Perlin-noise displacement that breathes the image in and out. Adapted from Shery.js (style 6), MIT — Sheryians Coding School.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // Adapted from Shery.js effect 6 (Perlin Noise), MIT.
      void main() {
        vec2 uv = uv01();
        float scale = 2.0, detail = 50.0, speed = 1.0, amount = 9.0;
        float x = (uv.x - 0.5) * scale * (detail / 100.0) * sin(time) * speed;
        float y = (uv.y - 0.5) * scale * (detail / 100.0) * cos(time) * speed;
        uv += snoise(vec3(x, y, 0.0)) * (amount / 100.0);
        gl_FragColor = texCover(uv);
      }
    `,
  },
  {
    id: "shery-wind",
    name: "Wind shader",
    title: "Wind",
    description:
      "A natural simplex-noise sway, like the image fluttering in a breeze. Adapted from Shery.js (style 4), MIT — Sheryians Coding School.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // Adapted from Shery.js effect 4 (3D Wind) — depth sway recast as a uv warp, MIT.
      void main() {
        vec2 uv = uv01();
        float freq = 3.0, speed = 1.0, amp = 0.05;
        float n = snoise(vec3(uv.x * freq + time * speed, uv.y * freq, 0.0));
        uv.x += n * amp * uv.y;          // sways more toward the top, like a flag
        uv.y += n * amp * 0.3;
        gl_FragColor = texCover(uv);
      }
    `,
  },
  {
    id: "shery-cyber-squares",
    name: "Cyber Squares shader",
    title: "Cyber Squares",
    description:
      "Retro cyber squares pulse across the image and brighten around your cursor. Adapted from Shery.js (style 7), MIT — Sheryians Coding School.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // Adapted from Shery.js effect 7 (Cyber Squares), single-image branch, MIT.
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        float m = 0.4 + 0.6 * smoothstep(0.35, 0.0, length(uv - mouse));

        float tiles = 9.0;
        vec2 scaled = tiles * vec2(uv.x, uv.y / aspect);
        vec2 tile = fract(scaled);
        float tileDist = min(min(tile.x, 1.0 - tile.x), min(tile.y, 1.0 - tile.y));
        float squareDist = length(floor(scaled));

        float edge = sin(time - squareDist * 3.0);
        edge = mod(edge * edge, 1.0);
        float value = mix(tileDist, 1.0 - tileDist, step(0.5, edge));
        edge = pow(abs(1.0 - edge * m), 1.5 * m);
        value = smoothstep(edge - 0.5 * m, edge, value);

        vec3 col = mix(vec3(0.0), texCover(uv).rgb, value);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "dot-matrix-scatter",
    name: "Dot Matrix shader",
    title: "Dot Matrix",
    description:
      "An LED-style dot grid of the image — move your cursor to scatter the dots into a dispersing cloud.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;

        // disturbance field around the cursor (aspect-corrected distance)
        vec2 toM = uv - mouse;
        toM.x *= aspect;
        float dist = length(toM);
        float force = smoothstep(0.30, 0.0, dist);   // 1 at the cursor, 0 beyond
        vec2 dir = toM / (dist + 1e-4);

        // push the sampled image outward from the cursor so the cloud disperses
        vec2 suv = uv + dir * force * 0.13;

        // dot grid over the (pushed) image
        float cells = 110.0;
        vec2 grid = vec2(cells * aspect, cells);
        vec2 g = suv * grid;
        vec2 cellId = floor(g);
        vec2 f = fract(g) - 0.5;

        // per-cell scatter jitter — only bites near the cursor
        vec2 jit = (vec2(hash21(cellId), hash21(cellId + 7.7)) - 0.5) * 1.6 * force;
        f -= jit;

        vec3 col = texCover((cellId + 0.5) / grid).rgb;
        float lum = luma(col);

        // halftone: dot radius grows with brightness, shrinks where disturbed
        float r = (0.18 + 0.30 * lum) * (1.0 - 0.45 * force);
        float dotMask = smoothstep(r, r - 0.12, length(f));

        // near the cursor ~half the dots wink in/out → floating specks + gaps
        float flick = hash21(cellId + floor(time * 4.0));
        dotMask *= mix(1.0, step(0.5, flick), force);

        gl_FragColor = vec4(col * dotMask, 1.0);
      }
    `,
  },
  {
    id: "ballpoint-drawing",
    name: "Ballpoint Drawing shader",
    title: "Ballpoint",
    description:
      "A ballpoint-pen cross-hatch rendering — strokes follow the image's form on grainy paper with a vignette. Adapted (single-pass) from flockaroo, CC BY-NC-SA.",
    image: DEMO,
    fragmentShader: /* glsl */ `
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
    `,
  },
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
  {
    id: "thermal-vision",
    name: "Thermal Vision shader",
    title: "Thermal Vision",
    description:
      "Maps brightness onto an infrared heat ramp — cold indigo to white-hot.",
    image: DEMO,
    fragmentShader: /* glsl */ `
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
    `,
  },
  {
    id: "oil-paint",
    name: "Oil Paint shader",
    title: "Oil Paint",
    description:
      "Kuwahara filtering smears the image into soft painterly brush strokes.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      // Mean + summed colour variance of one quadrant around uv (Kuwahara).
      vec4 region(vec2 uv, vec2 px, vec2 corner) {
        vec3 sum = vec3(0.0), sum2 = vec3(0.0);
        const int R = 3;
        for (int i = 0; i <= R; i++) {
          for (int j = 0; j <= R; j++) {
            vec2 o = vec2(float(i), float(j)) * corner * px;
            vec3 c = texCover(uv + o).rgb;
            sum += c;
            sum2 += c * c;
          }
        }
        float n = float((R + 1) * (R + 1));
        vec3 mean = sum / n;
        vec3 var = sum2 / n - mean * mean;
        return vec4(mean, var.r + var.g + var.b);
      }
      void main() {
        vec2 uv = uv01();
        vec2 px = 1.8 / resolution;             // brush size
        vec4 a = region(uv, px, vec2( 1.0,  1.0));
        vec4 b = region(uv, px, vec2(-1.0,  1.0));
        vec4 c = region(uv, px, vec2( 1.0, -1.0));
        vec4 d = region(uv, px, vec2(-1.0, -1.0));
        vec3 col = a.rgb;
        float mv = a.w;                          // pick the flattest quadrant
        if (b.w < mv) { mv = b.w; col = b.rgb; }
        if (c.w < mv) { mv = c.w; col = c.rgb; }
        if (d.w < mv) { mv = d.w; col = d.rgb; }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "vhs",
    name: "VHS shader",
    title: "VHS",
    description:
      "Tape warble, chroma bleed and a rolling tracking band — worn-out VHS.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        // tape warble: layered horizontal wobble down the screen
        uv.x += sin(uv.y * 8.0 + time * 2.0) * 0.002
              + sin(uv.y * 40.0 - time * 5.0) * 0.0015;
        // a tracking band rolling slowly up the picture
        float by = fract(uv.y + time * 0.2);
        float track = smoothstep(0.0, 0.08, by) * smoothstep(0.2, 0.1, by);
        uv.x += track
              * (hash21(vec2(floor(uv.y * 80.0), floor(time * 8.0))) - 0.5)
              * 0.05;
        // chroma bleed: split the colour channels horizontally
        float o = 0.004 + track * 0.01;
        vec3 col = vec3(
          texCover(uv + vec2(o, 0.0)).r,
          texCover(uv).g,
          texCover(uv - vec2(o, 0.0)).b
        );
        // tape noise lines + scanline darkening + slight desaturation
        col += (hash21(vec2(floor(uv.y * 240.0), floor(time * 30.0))) - 0.5) * 0.12;
        col *= 0.9 + 0.1 * sin(uv.y * 400.0);
        col = mix(col, vec3(luma(col)), 0.1);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    id: "kaleidoscope",
    name: "Kaleidoscope shader",
    title: "Kaleidoscope",
    description:
      "Folds the image into six-fold mirrored symmetry that slowly rotates.",
    image: DEMO,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 c = uv - 0.5;
        c.x *= aspect;
        float r = length(c);
        float a = atan(c.y, c.x) + time * 0.2;
        float seg = TAU / 6.0;
        a = abs(mod(a, seg) - seg * 0.5);          // mirror within each wedge
        vec2 p = vec2(cos(a), sin(a)) * r * (0.85 + 0.15 * sin(time * 0.3));
        p.x /= aspect;
        vec2 m = abs(fract((p + 0.5) * 0.5) * 2.0 - 1.0); // mirror-wrap into 0..1
        gl_FragColor = texCover(m);
      }
    `,
  },
];

export const getImageShader = (id: string): ImageShader | undefined =>
  IMAGE_SHADERS.find((s) => s.id === id);
