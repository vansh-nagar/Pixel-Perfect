---
name: cool-buttons
description: Design and build a new premium button for the button grid — novelty check against ButtonsArr, technique recipes by tier (CSS shadow-stack materials, framer-motion swaps/springs, GSAP magnetic/morph, SVG-filter glass/gooey), repo conventions, and grid + registry wiring. Only use when the user explicitly runs /cool-buttons; do not auto-trigger.
---

# Cool Buttons

How to design and build a button for the pixel-perfect button grid that is genuinely
cool — not a rectangle with a hover color. The bar: **one strong idea per button**,
executed with material depth AND physical feedback. If the effect can't be described
in one sentence ("a lens that refracts what's behind it", "a label that swaps with a
blur"), the idea isn't sharp enough yet. If removing the hover state leaves a flat
default button, it isn't done.

All paths below are relative to the repo root. Exemplar files are the source of
truth — **read the exemplar before building in its style**; don't reconstruct the
technique from memory.

## Step 0 — Novelty check (always do this first)

1. Read `ButtonsArr` in `src/components/mine/grids/button-grid.tsx` (names +
   descriptions are enough) and skim the filenames in `registry/new-york/buttons/`.
2. Confirm the new idea is not a re-skin of an existing button. Occupied territory:

   | Category | Already built |
   |---|---|
   | Materials | neumorphic (`premium`, `orange-premium`), metal/chrome (`metal`, `blue-chrome`, `silver`), glass (`glass`, `glassy`, `soft-pill`, `liquid-glass`, `prism-glass`), matte (`matte-dark`, `matte-shadow`), bevel/inset (`bevel`, `stripe`) |
   | Motion | label/icon swap (`visit`, `learn-more-buttion`), toggles (`toggle-buttion`, `blur-toggle`, `pearl-toggle`), magnetic/cursor (`magnetic`, `mouse-follower`), morph (`morph`, `morph-image`), shine sweep (`shiny`, `liquid`) |
   | Borders/glow | gradient border (`border-gradient`), rainbow glow (`rainbow-glowing`) |
   | Filters | gooey (`goe`), refraction lens (`refraction-glass`) |
   | 3D / press | depth push (`3d-button`), stepper (`recessed-stepper`) |

3. If the request is vague ("make something cool"), pick from the idea bank below —
   choose the concept that's furthest from the occupied territory.

## Idea bank (un-built as of 2026-07)

- **Charge-to-confirm** — hold to fill a ring/bar; release early and it drains back with elastic overshoot.
- **Peel sticker** — a corner lifts on hover (gradient + shadow fake curl), full peel on press.
- **LED dot-matrix** — label rendered as a dot grid; dots light up in a sweep, flicker on press.
  (Head start: `src/lib/dotmatrix-core.tsx` + `dotmatrix-hooks.ts` already exist — reuse them.)
- **Slot machine / odometer label** — characters roll vertically into place on hover.
- **Shatter & self-repair** — cracks into shards on press (clip-path pieces), reassembles with springs.
- **Thermal ink** — a heat trail follows the cursor across the surface and cools/fades behind it.
- **Typewriter keycap** — deep key travel, slight wobble, ink-stamp effect on the label at bottom of travel.
- **Liquid fill level** — a wavy liquid surface rises inside the button while held.
- **Zipper reveal** — a zipper pull drags across, opening to reveal the confirm state.
- **Dual-action split** — button splits into two halves (confirm/cancel) when pressed.
- **Pixel-sort dissolve** — label dissolves into sorted pixel streaks and reforms as new text.
- **Spotlight caustics** — a light cone follows the cursor with refracted caustic patterns inside.
- **Paper fold** — the button folds along a crease like paper on press, unfolds on release.
- **Compass needle** — an embedded needle/arrow tracks the cursor like a magnetic compass.
- **Pressure gauge** — an analog needle climbs while held, red-zone shake near the top.
- **Conveyor label** — the label rides in on a belt of repeating items and stops on the right one.

## What makes a button cool — principles

- **One idea.** Pick a single effect and execute it fully. Stacking magnetic + gooey +
  gradient border reads as noise; each existing button in the grid is one clear trick.
- **Material realism comes from layers.** A convincing surface needs 3+ shadow layers:
  ambient (large, soft, low opacity), key (tight, directional), and inset highlights
  (top inner light edge + bottom inner dark edge). One `box-shadow` never looks premium.
- **Physical press feedback is non-negotiable.** Minimum `active:scale-95`; better is
  depth compression (shadow layers shrink as the button "goes down" — see `3d-button`).
- **Motion has personality via easing.** Springs with overshoot, elastic returns, blur
  during transit. Linear or default `ease` reads as cheap. Durations: micro-feedback
  100–200ms, transitions 300–500ms, idle loops slow (2s+) and subtle.
- **Letterpress the label** on material buttons: a 1px `text-shadow` (light below on
  dark surfaces, dark below on light) seats the text into the surface.
- **The effect must read within 1 second of hover.** If it needs an explanation or a
  10-second wait, it belongs in the playground, not the grid.

## Technique recipes by tier

Rule: **use the lowest tier that achieves the idea.** CSS beats framer-motion beats
GSAP beats SVG filters — each step up costs bundle size and complexity.

### Tier 1 — CSS/Tailwind materials (no animation lib)

- **Shadow-stack materials** (neumorphic, matte, glossy): a `Record<Variant, {background, color, shadow}>`
  map where the entire look is a 4–7 layer `boxShadow` string in inline `style`.
  Exemplars: `registry/new-york/buttons/premium-button.tsx` (canonical structure),
  `metal-button.tsx` (metallic gradients).
- **Gradient border** (CSS can't gradient `border-color`): outer element = gradient
  background + `padding: <border-width>`, inner element = actual fill.
  Exemplar: `border-gradient-button.tsx`. The user-level `/gradient-border` skill has
  the full technique if needed.
- **3D press physics**: visible side/depth via stacked shadows; on `:active`, translate
  down while shrinking the depth shadows by the same amount so the button "travels".
  Exemplar: `3d-button.tsx`.
- **Glass**: translucent background + `backdrop-blur` + a light top inner-highlight +
  gradient ring. Exemplars: `glass-button.tsx`, `soft-pill-button.tsx`.

### Tier 2 — framer-motion (`framer-motion`)

- **Label/icon swap**: two `<AnimatePresence mode="wait">` blocks keyed on hover state;
  exit/enter with `y`-translate + `filter: blur()` + slight rotate, ~100ms.
  Exemplar: `visit-button.tsx`.
- **Spring toggles / state changes**: `motion` layout or animate props with
  `type: "spring"`; tune `stiffness`/`damping` for overshoot.
  Exemplar: `toggle-buttion.tsx` (yes, filename has the typo — keep it).
- **Draggable buttons**: `drag dragMomentum={false}` on `motion.button`.
  Exemplar: `liquid-glass-button.tsx`.
- Props extend `HTMLMotionProps<"button">` (not `ButtonHTMLAttributes`) so callers can
  pass motion props; forward the caller's `onHoverStart`/handlers before your own logic.

### Tier 3 — GSAP (`gsap`, `@gsap/react`)

- **Magnetic / cursor-driven**: map cursor position into a tween range with
  `gsap.utils.mapRange`, parallax the label at a different strength, elastic return on
  leave, optional `CustomWiggle` idle loop. Exemplar: `magnetic-button.tsx`.
- **Shape morphs**: `MorphSVGPlugin` between two paths inside `useGSAP`.
  Exemplars: `morph-button.tsx`, `morph-image-button.tsx` (image-mask variant).
- Register plugins at module scope (`gsap.registerPlugin(...)`), run setup in
  `useGSAP`/`useEffect`, and **clean up**: remove every listener and
  `gsap.killTweensOf(target)` in the cleanup function.

### Tier 4 — SVG filters / canvas (the exotic tier)

- **Gooey**: `feGaussianBlur` + `feColorMatrix` alpha-contrast trick on a group of
  blobs. Exemplar: `goe-button.tsx`.
- **Refraction / lens**: generate a displacement map on a canvas (SDF math → data URL),
  feed it through `feImage` + `feDisplacementMap` — three displacement passes at
  slightly different scales for RGB chromatic split, then `feBlend`.
  Exemplar: `refraction-glass-button.tsx` (also shows `ResizeObserver` + `useMemo`
  regeneration when the button resizes).
- Reach for this tier only when the idea is *about* the filter (goo, glass, distortion).
  Test in Chrome AND Safari — SVG filter support diverges.

## Repo conventions (must follow)

- File: `registry/new-york/buttons/<kebab-name>.tsx`. `"use client"` at the top when it
  uses hooks/motion/GSAP; omit for purely presentational CSS buttons.
- **JSDoc one-liner at the very top** (after `"use client"`) — `registry-sync` uses it
  as the public description:
  ```tsx
  /**
   * A hold-to-confirm button that fills a progress ring and drains back if released early.
   */
  ```
- Component shape (dominant pattern — see `premium-button.tsx`):
  `React.forwardRef<HTMLButtonElement, Props>` + `.displayName` + `export default`.
  Simple GSAP demos may use a plain function component (see `magnetic-button.tsx`).
- Props: `extends React.ButtonHTMLAttributes<HTMLButtonElement>` (CSS buttons) or
  `HTMLMotionProps<"button">` (motion buttons). Always accept `className` (merge via
  `cn` from `@/lib/utils` — NOT `@/lib/cn`, which is legacy) and `children` with a
  sensible default label, and spread `...props`.
- Variants: `export type XVariant = "a" | "b" | ...` + a `Record<XVariant, styles>` map.
  The grid's `Select` wrappers import these exported types.
- Division of labor: **Tailwind for layout + interaction states** (`px-*`, `rounded-*`,
  `active:scale-95`, `cursor-pointer`), **inline `style` for rich visuals** (multi-layer
  shadows, gradients). Don't fight Tailwind's arbitrary-value syntax for 6-layer shadows.
- Self-contained: no playground scaffolding, no console logs, no dead code.

## Grid + registry wiring

1. Append to `ButtonsArr` in `src/components/mine/grids/button-grid.tsx`, matching its
   exact shape — lowercase `component:` holding a **JSX element** (this grid differs
   from the motion grid's `Component:`):
   ```tsx
   {
     name: "Charge Button",
     description: "Hold-to-confirm button that fills a ring and drains back on early release.",
     component: <ChargeButton>Hold me</ChargeButton>,
     registryName: "charge-button",
   },
   ```
   `registryName` === the registry filename (kebab-case). Add the import at the top of
   the grid file.
2. If the button has variants or demo state, define a local `*Wrapper` component above
   the array with the absolutely-positioned dashed `Select` control — copy the shape of
   `ThreedButtonWrapper` in the same file.
3. Pagination is automatic (`itemsPerPage`) — just append.
4. Run `bun run registry-sync` (never hand-edit `registry.json` or `public/r/*.json`),
   then `bun run lint`.
5. **No commit/push/PR from this skill.** That happens only when Vansh explicitly says
   "run the flow" (see CLAUDE.local.md).

## Quality checklist (before calling it done)

- [ ] Press feedback exists (`active:` scale or depth travel).
- [ ] Focus ring is visible for keyboard users (don't `outline-none` without a replacement).
- [ ] Animates only `transform` / `opacity` / `filter` where possible; no `width`/`top` tweens.
- [ ] No layout shift on hover — the cell around it must not move.
- [ ] Looks right on the grid cell's background (test in the actual grid, not a white page).
- [ ] Listeners removed and tweens killed on unmount (GSAP), no leaked `ResizeObserver`s.
- [ ] Renders standalone with zero props (default label + default variant).
- [ ] `disabled` doesn't break the material (dim it, drop the hover motion).
