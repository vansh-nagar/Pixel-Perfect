---
name: image-shaders
description: Apply the project's GPU image shaders (fluid distortion, particles, flow field, reveals) to a new image; use the fluid simulation as a color/distortion mask over custom content (e.g. a live 3D render); or write transition / reveal shaders (A→B brush-stroke reveals, color transitions) on images or 3D meshes. Use whenever asked to "apply the fluid shader", "use the <X> shader on this image", "make an image flow/particle/ripple", "add a transition shader", "reveal/paint one state into another", or to drive a shader from cursor input.
---

# Image shaders

Self-contained GPU shader components live in
[src/components/pixel-perfect/shaders/](../../../src/components/pixel-perfect/shaders/).
Each mounts its **own** `THREE.WebGLRenderer` into a `<div>` (they are **not**
React Three Fiber `<Canvas>` components — don't nest them in one). They size to
their container, so the parent must have explicit width/height.

## Quick: apply a shader to a new image

Every image shader takes a `image` prop = a **public path** (`/foo.png`) or URL,
plus `className` for sizing. Drop the image in `public/` and pass its path.

```tsx
import FluidImage from "@/components/pixel-perfect/shaders/fluid-image";

<FluidImage
  image="/my-image.png"
  imageB="/my-second-image.png" // optional second image revealed where fluid flows
  className="h-full w-full"      // parent must have a real size
/>
```

### Component cheat-sheet

Common props on most: `image: string`, `className?: string`, `dpr?: number`
(lower for thumbnails, default 2), `controls?: boolean` (lil-gui panel).

| Component | File | Extra props | Effect |
|---|---|---|---|
| `FluidImage` | `fluid-image.tsx` | `imageB?` | GPU Navier–Stokes fluid; cursor distorts + (with `imageB`) reveals a transition |
| `BeforeAfter` | `before-after.tsx` | `imageB`, `interactive?` | Draggable before/after seam |
| `CursorReveal` | `cursor-reveal.tsx` | `mode?: "paint" \| "scratch"` | Reveal colour / scratch off frosted glass under cursor |
| `PaintReveal` | `paint-reveal.tsx` | — | Sketch → painted reveal |
| `FlowField` | `flow-field.tsx` | — | Particles advected along a flow field sampled from the image |
| `ImageParticles` | `image-particles.tsx` | — | Image dissolves into drifting particles |
| `InertiaParticles` | `inertia-particles.tsx` | — | Particles with spring/inertia toward image pixels |
| `MagneticSwarm` | `magnetic-swarm.tsx` | — | Particles swarm/repel around the cursor |
| `RippleTouch` | `ripple-touch.tsx` | — | Cursor ripples distort the image |
| `PixelDistortion` | `pixel-distortion.tsx` | — | akella-style grid smear: cursor pushes cells, they relax back |
| `MagneticWarp` | `magnetic-warp.tsx` | — | Spring grid gathers toward the cursor (iron filings), wobbles home |
| `CursorTrailSmear` | `cursor-trail-smear.tsx` | — | Liquid streak trails the cursor along its velocity, then heals |
| `LiquidMelt` | `liquid-melt.tsx` | — | Per-column heat → hover melts/drips columns downward, recovers |
| `VortexPull` | `vortex-pull.tsx` | — | Inertial whirlpool chases the cursor; lags + keeps spinning |
| `JellyBulge` | `jelly-bulge.tsx` | — | Spring-driven magnifier lens that overshoots/jiggles like jelly |

The bottom six are **stateful** standalone components: they keep simulation state
in JS (a float `DataTexture` grid, a trail buffer, per-column arrays, or spring
physics) and step it each frame, which is what gives them inertia/spring/relax
feel the stateless registry fragment shaders can't reproduce. Model new ones of
this kind on `pixel-distortion.tsx` / `ripple-touch.tsx` (own raw renderer,
`createAnimatedTexture`, `IntersectionObserver` pause, `ResizeObserver`,
lil-gui `controls`).

These are showcased (with full-screen previews + copy snippets) in
[src/components/mine/grids/image-shaders-grid.tsx](../../../src/components/mine/grids/image-shaders-grid.tsx).
Each WebGL shader tile creates its own GL context on mount and browsers cap live
contexts at ~16, so the grid wraps every shader tile in
[`<LazyVisible>`](../../../src/components/mine/lazy-visible.tsx) — it only mounts
a tile (and its context) while it's near the viewport and unmounts it once it
scrolls away. Reuse that wrapper for any grid that stacks many shader tiles.
Image assets currently in `public/`: `bend-image-reveal.gif`,
`fluid-transition.gif`, `card.png`, `og.png`.

## Transition / reveal shaders (A → B with a progress uniform)

The reusable pattern behind `paint-reveal.tsx`, `cursor-reveal.tsx`, and the 3D
`raycaster-shapes` component: blend between two states (sketch → painted,
colour A → colour B, texture A → B) with a brush-stroke mask driven by a
`uProgress` (0 → 1) uniform.

```glsl
float rn = fbm(coord * uNoiseScale) * 0.12;            // organic, paper-bleed edge
float maskValue = sweep + rn;                           // sweep = reveal coordinate
float threshold = mix(lo, hi, uProgress);              // moving brush front
float amt = 1.0 - smoothstep(threshold - 0.06, threshold + 0.02, maskValue);
vec3 col = mix(from, to, amt);
float wet = smoothstep(0.0, 0.06, abs(maskValue - threshold)); // darker wet edge
col *= mix(0.7, 1.0, wet);
```

Drive `uProgress` 0 → 1 with GSAP, a spring, or a manual lerp in `useFrame`.
**Commit on completion** (set `from = to`, reset `uProgress = 0`) so the next
transition starts clean.

### Use a CONTINUOUS coordinate, not per-face UV — important for 3D meshes

For a flat image plane, `(uv.x + uv.y)` works. But on a 3D mesh
(box/sphere/cone…) **every face has its own independent 0 → 1 UV square**, so a
uv-based sweep restarts on each face and reads as broken / non-uniform.

Drive the sweep from a **continuous object-space coordinate** instead, so the
brush front crosses the whole shape as one wipe:

```glsl
// vertex:   varying vec3 vLocalPos;  vLocalPos = position;
// fragment:
float s = vLocalPos.y / (2.0 * uRadius) + 0.5;                  // bottom → top
// diagonal: dot(vLocalPos, normalize(vec3(1.0))) / (2.0 * uRadius) + 0.5
```

- `uRadius` = the geometry's bounding-sphere radius
  (`geometry.computeBoundingSphere()`) — normalises the sweep to each shape's
  size so it always covers the whole object.
- Direction = which axis you project onto: `vLocalPos.y` bottom→top,
  `-vLocalPos.y` top→down, `vLocalPos.x` left→right, a normalized diagonal
  corner→corner.
- Sample the noise from a *different* axis pair (`vLocalPos.xz` for a vertical
  sweep) so the wobble doesn't slide along with the front.

Working example:
[registry/new-york/three-js/raycaster-shapes.tsx](../../../registry/new-york/three-js/raycaster-shapes.tsx)
— a raycaster picks the hovered shape; clicking paints it to a random colour
bottom-up with this exact mask.

## How the fluid sim works (so you can adapt it)

[fluid-image.tsx](../../../src/components/pixel-perfect/shaders/fluid-image.tsx)
is a ping-pong pipeline of full-screen passes over float render targets:

```
splat (cursor) → curl → vorticity → divergence → pressure (Jacobi ×18) →
gradient-subtract → advect(velocity) → advect(dye) → DISPLAY
```

- The **`dye`** render target is a signed RG field the cursor "paints" into; it
  advects and dissipates over time. It's the heart of every effect.
- The **DISPLAY** pass reads `dye` and uses it to (a) distort UVs and (b) mask
  between two source textures. `mask = clamp(length(dye.rg)*1.5, 0, 1)`.
- The fluid tint is `col += abs(vec3(dye.r, dye.g*0.6, -dye.r)) * k * mask`.

## Advanced: fluid sim as a mask over custom (non-image) content

You can feed **anything** into the DISPLAY pass instead of GIFs — e.g. two live
render-target snapshots of a 3D scene — so the fluid becomes a reveal mask.
This is exactly what the playground cube does: render the scene twice (plain vs
colourful) to two `WebGLRenderTarget`s each frame, then `mix(plain, colour,
mask)` in the display fragment shader. Pattern:

```ts
// each frame, in the render loop:
renderer.setRenderTarget(scenePlain); renderer.render(scene, cam); // uImage
mesh.material = colourMat;
renderer.setRenderTarget(sceneColour); renderer.render(scene, cam); // uImageB
// ... run the fluid step() ...
displayMat.uniforms.uImage.value  = scenePlain.texture;
displayMat.uniforms.uImageB.value = sceneColour.texture;
displayMat.uniforms.uDye.value    = dye.read.texture;
blit(displayMat, null); // composite to screen
```

### Gotchas learned the hard way

- **Distortion vs colour.** Offsetting the sampled UVs by `dye.rg` in DISPLAY
  warps the content's *shape* (looks like vertex/geometry movement). If you only
  want a **colour** reveal with the shape intact, sample at plain `vUv` and only
  use the `mask` to blend colour — do **not** offset UVs.
- **Don't touch the cube's vertex shader** for these effects — keep it a plain
  pass-through projection; do all the work in fragment shaders / the display pass.
- **`OrbitControls` zoom** eats the scroll wheel and makes a cube appear to
  resize on scroll. Set `enableZoom={false}` if scroll should only scroll.
- **Two WebGL contexts** (an R3F `<Canvas>` + a shader component) is fine, but
  prefer one raw renderer when compositing scene → fluid (avoids context juggling).
- Tune cost via `SIM_RESOLUTION` (160) and `PRESSURE_ITERATIONS` (18) in
  `fluid-image.tsx`; lower both for weaker hardware.
- Always gate the RAF on an `IntersectionObserver` so offscreen sims pause.
- **R3F + React Compiler:** set uniform values from *frame-local* objects — the
  `useFrame((state) => …)` arg, or meshes found by traversing `state.scene` —
  not from a `useMemo`'d material captured in component scope. Mutating a
  memoized value (or a value reached through a `useThree()` return / ref array)
  in an effect or frame loop trips the compiler's "cannot be modified" rule.
  Compute one-shot uniforms (e.g. `uRadius`) once inside `useFrame` guarded by a
  flag in `userData`, not in a `useEffect`.
