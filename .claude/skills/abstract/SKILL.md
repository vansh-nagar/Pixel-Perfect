---
name: abstract
description: Abstract Components — build flat-colour, grid-locked procedural art tiles on canvas that animate on a snap-then-hold beat (token columns, ray fans, quadtrees, chevron flows, metro maps, dither fields, wireframe echoes). Covers the look, the grid rule, the motion rule, the Scene engine in src/app/playground/_art, a pattern catalog with 12 working exemplars, studying a reference image, screenshot checks, and promotion to the registry. Use when the user runs /abstract, or asks for abstract, procedural or generative art, motion-graphics tiles, or "something like the playground art board".
argument-hint: "[idea, or path to a reference image]"
---

# Abstract Components

How to build abstract, procedural art pieces for the playground: solid colours,
a strict cell grid, and rhythmic motion. The exemplars are the 12 tiles in
`src/app/playground/_art/scenes/`, built from a reference board of orange, blue
and pink motion graphics. **Read the exemplar closest to your idea before
building** — each one is short and shows a pattern end to end. A snapshot of
the whole kit lives in `references/_art/` in case the playground gets cleaned.

The bar: every frame, including a paused one, must look **designed**, not
random. If something sits at an arbitrary pixel position, or the tile looks
unfinished mid-rest, it isn't done.

## What to build

The request is whatever follows `/abstract`; it may be empty.

- **Nothing given:** invent one new piece. First read `SCENES` in
  `src/app/playground/_art/art-gallery.tsx` and the pattern catalog below, then
  pick a pattern (or a pairing of two) the board doesn't have yet.
- **An idea in words:** build that one piece.
- **A reference image:** run the study script (see Workflow), read every tile
  crop, and build one scene per tile.

Before writing code, describe each piece in one sentence: *"Pink blocks slide
down a staircase on ember, one cell per tick."* If you can't, the idea isn't
sharp enough yet.

## The look

- **Flat, solid colour only.** No gradients, glows, shadows or blur. The only
  exception is stepped alpha on echo copies (`wireframe-echo.ts`).
- **One ground per tile:** ink `#101010`, or a saturated field (orange, cobalt,
  blue, ember). Use 2–4 colours per tile, all from `C` in `scene.ts`; add a new
  colour there, never inline a one-off.
- **Token vocabulary:** glyphs `A B L % 0 1` in the page font, small squares
  (~0.3 cell), discs (~0.46 cell), solid blocks carrying a glyph (neighbouring
  blocks fuse into one shape), diamonds, capsules, 1px lines, dots on line tips.
- **Text** sits one glyph per cell, like tracked monospace.
- **Leave air.** The reference balances dense clusters with empty ground.
  Pieces that fill every cell read as noise.

## The grid rule (the one that matters most)

1. **One cell size per tile:** `u = height / ROWS` (5–18 rows). Every size and
   position derives from `u`, so the piece scales with the tile.
2. **Place on whole or half cells** from a stated origin: the tile centre, or
   `x0 = (width - SPAN * u) / 2` for a centred design that is `SPAN` cells wide.
3. **Randomness picks; it never places.** Seeded `rng()` / `hash()` choose
   which cell, glyph, formation or run. Never use `Math.random()`: the same
   size must give the same piece.
4. **Diagonals run at 45°** or from grid point to grid point. To keep tokens on
   grid points along a diagonal, place them by whole columns (see
   `chevron-flow.ts`).
5. **Curves** appear only as rounded corners between grid-aligned segments
   (`metro.ts`) or as shapes snapped to grid points (the arc formation in
   `wings.ts`).
6. **Tokens keep their identity.** A token's content comes from its id
   (`id = slot - shift`), so it travels with the token instead of cells
   blinking in place.

## The motion rule

- **Snap, then hold.** Use `beat(t, period, move)`: it eases over the first
  `move` fraction of each beat, then rests. Anything that moves ends each beat
  back on the grid.
- **Stagger** by index for ripples (0.02–0.04 s per item, ~0.1 s per column).
- **Nothing half-finished at rest.** If a continuous input drives a threshold
  (a moving focus, a noise value that splits a square), quantise the input per
  beat and animate between the two states. Otherwise partial shapes linger.
- **Tempo:** conveyors 0.15–0.5 s per step, formation changes 1.8–2.6 s, full
  loops ≤ 4 s. Use `easeInOutCubic` by default and `easeInOutExpo` for snappy,
  mechanical moves.
- **Never go blank.** Every moment of a loop shows a composed frame.
- **Reduced motion** freezes each tile at `t = 2 s` (`STILL_TIME` in
  `art-canvas.tsx`). Make sure that frame looks good.

## The engine

| File | Role |
|---|---|
| `_art/scene.ts` | `Scene` contract, palette `C`, glyph sets, `rng`, `hash`, easing, `beat`, `span`, and the drawing helpers `glyph`, `disc`, `square`, `gridLines` |
| `_art/art-canvas.tsx` | Runs one scene: device-pixel-ratio sizing, resize, pause off-screen or in hidden tabs, reduced motion, `data-scene` for screenshots |
| `_art/art-gallery.tsx` | The board: `SCENES` list, 3 columns, tiles at `aspect-[385/157]` |
| `_art/scenes/*.ts` | One scene per file |

```ts
export interface Scene {
  background: string;                                       // painted before every frame
  resize(width: number, height: number): void;              // build layout here, not per frame
  draw(ctx: CanvasRenderingContext2D, t: number): void;     // t in seconds
}
export type SceneFactory = () => Scene;
```

To add a piece, create `scenes/<kebab-name>.ts` exporting a `SceneFactory` and
add `{ name, scene }` to the **top** of `SCENES`. When two tiles share one
system, write a config-driven factory (`tokenColumns(config)`) rather than two
copies.

If `src/app/playground/_art/` is missing, copy `references/_art/` back to it
and render `<ArtGallery />` from `src/app/playground/page.tsx`. If `page.tsx`
holds something else (the user's work in progress), ask before replacing it.

Performance habits: precompute layout in `resize`; cache per-beat data such as
formations; batch many rects or arcs into one path and one `fill()`; use
`clip()` for masks; wrap transforms in `save()`/`restore()`. Aim for a steady
60 fps with the whole board animating.

## Pattern catalog

| Pattern | How it works | Exemplar |
|---|---|---|
| Formation morph | Each beat, tips regroup into a seeded formation of grid points (a row, diagonal, column or arc); lines follow with a per-index stagger | `spray.ts`, `wings.ts` |
| Mirror | Draw one half inside a clip, then `translate(2cx, 0)` + `scale(-1, 1)` and draw it again; text mirrors too | `chevron-flow.ts`, `wings.ts` |
| Stepped scroll | A loop of rows built from motifs; `offset = dir × (index + p)`; clipped to a column | `token-columns.ts` |
| Conveyor on a path | Ordered path cells; `content = pattern[i − shift]`, where `shift = floor(t / tick)` | `staircase.ts` |
| Mask over fixed glyphs | Bars tween their level; the glyphs stay put and a clip reveals them | `equalizer.ts` |
| Cascade subdivision | Split only at midpoints; per-beat split state; lines grow from the centre, delayed by depth | `subdivision.ts` |
| Flow along nested Vs | Tokens placed by whole columns; `y = level + max(0, turn − s)` | `chevron-flow.ts` |
| Octilinear traffic | Hand-designed map on grid vertices, rounded corners, resampled; tokens spaced by arc length | `metro.ts` |
| Threshold field | A fixed fine grid of marks; drifting, domain-warped noise decides which are on | `dither-field.ts` |
| Echo lag | The same motion replayed with a time lag per copy: fans out while moving, collapses at rest | `wireframe-echo.ts` |
| Breathing mark + decode | Shapes slide along their own slant; scrambled text locks in left to right | `emblem.ts` |

New pieces often come from pairing two rows: echo lag + formation morph,
conveyor + octilinear path, threshold field + glyph tokens, stepped scroll +
mirror.

## Workflow

1. **Study the input.** For a reference image:

       python3 .claude/skills/abstract/scripts/study-reference.py <image> --cols 3 --rows 4 --out <scratch>/ref

   It saves each tile upscaled 3× and prints its dominant colours. Pass
   `--cols/--rows` when you know the grid. Read every crop before writing code.
2. **Decide per piece:** ground, 2–4 colours, `ROWS`, token set, pattern(s),
   and the one-sentence description.
3. **Write the scene** and add it to `SCENES`.
4. **Check the code:** `bunx tsc --noEmit -p . | grep playground` and
   `bunx eslint src/app/playground` should both print nothing.
5. **Look at it.** Find the running dev server (see below), then:

       node .claude/skills/abstract/scripts/snap.mjs --url http://localhost:<port>/playground \
         --scene "<Name>" --at 600,1500,2400,3300 --out <scratch>/snap

   Read every frame: one mid-move, the rest at rest. Compare against the
   reference and the symptom table below. The script also prints frame timing
   (avg ≤ 17 ms) and console errors. Omit `--scene` to capture the whole board.
6. **Iterate** until every captured frame looks designed.
7. **Report** each piece in one line, the files touched, and the constants
   worth tuning. Don't commit: "run the flow" is the user's signal for the
   registry and the PR.

**Dev server.** `cat .next/dev/lock` normally names the running server, but it
can be empty while one runs, so also check
`ps -eo pid,command | grep "pixel-perfect.*next dev"` and
`lsof -nP -iTCP -sTCP:LISTEN`. Next 16 allows one dev server per project, so
never start a second one and never kill the user's. If none is running, start
one with `run_in_background: true` and stop that exact task when done.

## Symptom → cause → fix

| Symptom | Cause | Fix |
|---|---|---|
| Floating "+" marks or half-drawn lines while resting | A continuous input drives a threshold | Quantise the input per beat; animate between beat states |
| Repeated rows or arms look identical | Pattern runs always come in the same order | Random run order, a lead token kind per path, well-spread seeds (`j × 37`) |
| Routes tangle in one corner | Random walk | Hand-design vertices on the grid and centre the map |
| Blob edges run as straight diagonals | Value-noise lattice showing | Domain warp plus a second octave; lower the frequency |
| Field too thin or too solid | Threshold or frequency off | Threshold 0.48–0.54; about 1–1.6 noise cells per tile height |
| Glyphs sit off-centre vertically | `textBaseline = "middle"` | Use `glyph()` (alphabetic baseline, dropped by 0.36 em) |
| Hairline seams between neighbouring blocks | Anti-aliased edges | Overlap fills by 0.25 px on each side |
| Content cropped on narrow tiles | Layout in fixed pixels | Derive from `u`; centre a `SPAN`-cell design; for one centred mark use `u = min(h / rows, w / span)` |
| Mirror leaves a strip empty | Mirror axis rounded off-centre | Mirror around the exact `width / 2` |
| Frame time over 17 ms | Per-frame allocation or one fill per shape | Batch into one path; precompute in `resize`; cache per beat |

## Promoting to the registry

When the user says "run the flow" for one of these pieces, follow the flow in
`CLAUDE.local.md`, with one difference: registry components must be
standalone single files. Convert the scene into a component shaped like
`registry/new-york/backgrounds/halftone-blobs-background.tsx`:

- Inline only the helpers it uses (`rng`, `hash`, `beat`, the easing, `glyph`);
  don't import from the playground.
- Props: `children`, `className`, `style`, the colours, `speed`, `paused`.
- Keep the canvas handling from `art-canvas.tsx`: device pixel ratio,
  `ResizeObserver`, `IntersectionObserver`, hidden-tab pause, reduced motion.
- Category `backgrounds`, grid `background-grid.tsx`.

When the user likes a new piece, copy it into `references/_art/scenes/` and add
a row to the pattern catalog, so the exemplar library grows with each run.
