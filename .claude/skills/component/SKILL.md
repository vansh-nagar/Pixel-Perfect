---
name: component
description: Build a new component in the "shelf" visual language of this repo — off-black/off-white stone neutrals, one vermilion accent, Inter Tight sentence-case labels, small 6px radii, a rounded-Voronoi cell background, edges that drain to grey, and physical drag/wheel motion with inertia. Covers the exact colour tokens for light and dark, type, shape, motion feel, the WebGL scaffolding (vanilla three.js in one effect, theme sync, off-screen pause, reduced motion, full cleanup) and the playground → registry flow. Use whenever the user runs /component, or asks for a new component, card, gallery, carousel, background or interactive piece "in the same style", "matching the shelf", "same colours", or "same visual style".
---

# Component (shelf style)

Make new components look like they belong with the shelf gallery. The
exemplar is the source of truth. **Read it before building**:

- `src/app/playground/shelf-gallery.tsx`, or, once it has been promoted,
  `registry/new-york/<category>/shelf-gallery.tsx`.

Copy its constants and helpers rather than retyping them from this file. If the
exemplar and this file disagree, the exemplar wins. Update this file to match.

## 1. Read the brief, then pick the medium

- **DOM/CSS** (buttons, panels, lists, toggles, simple cards): Tailwind and
  `motion/react`. Use the tokens below as CSS variables or arbitrary values.
- **WebGL** (galleries, image/video surfaces, fields, anything shader-driven or
  with many moving items): vanilla `three` inside one `useEffect`, the way the
  exemplar does it. Don't use R3F for these. One renderer per component.

State the choice in one line before writing code.

## 2. Colour tokens (locked)

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` (cell) | `#f2f0ec` | `#1a1a19` | surface, cell fill, edge-fade target |
| `gap` | `#dbd8d2` | `#0f0f0e` | gaps between cells, recessed areas |
| `ink` | `#1d1c1a` | `#ecebe8` | primary text, focused labels |
| `muted` | `#8a8781` | `#75736e` | secondary text, unfocused labels |
| `accent` | `#e8552f` | `#f0643c` | **only** the single focused/active thing, plus reveal edges |

Rules:
- Use one accent, and only the vermilion above. It marks exactly one state at
  a time, such as the focused card's title, the active item or a reveal line.
  Never use it as a fill or decoration.
- Warm stone neutrals only. Never use pure `#000`/`#fff`, cool greys,
  gradients, glows or purple.
- Follow the site theme. Read `document.documentElement.classList.contains("dark")`
  and watch the `class` attribute with a `MutationObserver`. In WebGL, keep
  one `THREE.Color` per token and `.set()` them on change. Uniforms that share
  those instances update for free.
- Media (photos, video) keeps its own colours. The palette is for chrome.

## 3. Type

- Inter Tight, the site font. Read it with `getComputedStyle(document.body).fontFamily`,
  and in canvas text draw only after `document.fonts.ready`.
- Labels use sentence case and weight 500, with no uppercase micro-labels, no
  mono and no letter-spacing tricks. Real names, such as "Moss falls" or
  "Artifact 03", not abbreviations.
- Label state goes muted → ink → accent as the item gains focus, eased with
  smoothstep and never snapped.

## 4. Shape and layout

- Corner radius is **6px**, square-ish and never pill or squircle. In WebGL,
  convert px to world units with the viewport's world-per-pixel and use a
  rounded-box SDF with `fwidth` anti-aliasing.
- Items share a **centre line** and grow symmetrically toward the focus.
  Captions sit just under their item, left-aligned to its edge, with a gap of
  about 0.3 of the caption height.
- Edges get calmer. Toward the viewport sides, items turn slightly to face the
  centre (about 0.42 rad max), drain to greyscale and fade into `background`.
  Labels fade with them.
- Size things in CSS px and convert once on resize. Fill the parent
  (`h-full w-full`), and let the page decide the height (`h-dvh` on the
  playground page, never `h-screen`).

## 5. Background: rounded Voronoi cells

The signature backdrop is `CELLS_FRAGMENT` in the exemplar. Reuse it as is,
including the two-pass Voronoi, the smooth-min rounding and the px-based gap.

- Defaults: `{ size: 260, gap: 12, smooth: 0.22, drift: 0.12, parallax: 0.25 }`.
- Cells are `background`, gaps are `gap`. It's a full-screen quad with
  `depthTest: false` and `renderOrder: -1`.
- Seeds drift slowly over time. The field slides by `parallax` × the
  component's scroll offset, converted to px.
- For a DOM component that needs this backdrop, mount a small canvas that runs
  only this shader behind the content. Don't approximate it with CSS.

## 6. Motion feel

Motion should feel physical, which means momentum with friction rather than
bouncy springs.

- **Drag + wheel** use `GalleryMotion` from the exemplar: drag sampling with a
  least-squares release velocity, exponential inertia, and the wheel as a
  decaying force. Both wheel axes drive it, with `preventDefault` while over
  the component. Desktop and mobile params switch at 1024px.
- **Speed reacts**: smooth the velocity into a `-1..1` value and bend things
  with it. In the exemplar the top of each card trails the direction of
  travel and the sheet cups slightly. Animate transforms and vertices only.
- **Intro** is short, about 1.6s, with easeOutQuint. Items rise from below
  with an 80ms stagger in left-to-right order, media wipes up from the bottom
  behind a 1px accent line, then the caption fades in.
- **Ambient** motion is slow: the cell drift, plus video loops.
- Easing helpers: `smooth` (smoothstep), `easeOutQuint`, `clamp01`. There's no
  linear motion apart from scroll.

## 7. WebGL scaffolding checklist

Match the exemplar's effect structure:

- [ ] `"use client"` plus a one-line JSDoc at the very top. It becomes the
      registry description, so describe what the user sees.
- [ ] Renderer with `antialias: true` and pixel ratio `min(dpr, 2)`, appended
      to a container `div`. Resize through a `ResizeObserver` on the
      container, never the window.
- [ ] `ShaderMaterial`s end with `#include <colorspace_fragment>`. Textures use
      `SRGBColorSpace`. Shared geometry and textures are cached by `src`.
- [ ] `.mp4`/`.webm` sources become a `VideoTexture` (muted, loop,
      playsInline). Videos play only while their item is on screen, and all
      of them pause when the component stops.
- [ ] An `IntersectionObserver` starts and stops the rAF loop, and `dt` is
      clamped to `[1/240, 0.1]`.
- [ ] `prefers-reduced-motion`: skip the intro, set lean and drift to zero and
      freeze the parallax. Drag still works.
- [ ] Cleanup disposes every material, geometry, texture, video `src` and
      observer, and the renderer, and removes the canvas.
- [ ] Media goes in `public/playground/<component>/`. Convert GIFs to MP4 with
      ffmpeg, because WebGL only shows a GIF's first frame. Keep stills at
      900px wide or less.

## 8. Where it goes

1. Build it in `src/app/playground/<kebab-name>.tsx` and render it from
   `src/app/playground/page.tsx`. The playground hides the GitHub stars
   button, so the component has the full screen.
2. Check it in the running dev server. Reuse the one in `.next/dev/lock` and
   never start a second.
3. Run `bun run lint` and `npx tsc --noEmit`.
4. Promoting to the registry and grid is the user's "run the flow" step. See
   `CLAUDE.local.md`. Don't do it unasked.

## Pre-flight

- [ ] Light and dark both checked against the token table
- [ ] Exactly one accent use visible at a time
- [ ] 6px radius everywhere, sentence-case Inter Tight labels
- [ ] Voronoi cell backdrop present if the component is full-bleed
- [ ] Drag, wheel, inertia and the speed reaction all work, and reduced motion
      is honoured
- [ ] No leaks: unmount and remount in dev (React strict mode) and confirm
      there's only one canvas
