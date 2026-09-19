---
name: spring-gooey
description: Build UI components with a gooey (metaball / liquid blob-merge) effect driven by spring motion — pills that fuse, toggles whose knob stretches, nav indicators that blob between items, loaders, buttons whose shapes melt together and split apart. Covers the SVG goo filter, the stage spacing that gives the blur room to merge (padding + negative margins + filter region), keeping text out of the filtered layer, spring presets, reduced motion, Safari/touch fallbacks, and this repo's registry conventions. Use whenever the user runs /spring-gooey, says "Spring GUI" / "spring gooey", or asks for anything gooey, liquid, blobby, metaball-like, "merging", "melting" or "stretching" shapes, or a springy morph between pills — even if they never say the word "gooey".
---

# Spring Gooey

How to build a component whose shapes **fuse and split like liquid**, moved by
**springs**. The exemplar is `registry/new-york/buttons/antinomy-button.tsx`:
a label that slides right while two pills bloom, merge through a neck, and
snap back. **Read the exemplar before building** — it is the source of truth
for the technique; don't reconstruct it from memory. The annotated generic
template, the choreography patterns (toggle, nav indicator, loader, reveal),
and the CSS fallback live in `references/gooey-recipe.md`.

Two things make the effect: a **goo filter** (blur, then push alpha to 0 or 1,
so any two shapes closer than about two blur radii grow a smooth neck) and
**spring timing** (a leader that overshoots and a follower that lags, so there
is a moment where the shapes are stretched between each other). Most failed
gooey components lose one of these — the filter gets clipped by tight spacing,
or every part moves in lockstep and nothing ever stretches.

## Keep it simple

The exemplar is the bar for restraint, not just technique: a plain text label,
solid theme-token shapes, one trigger, one idea. The goo and the spring *are*
the design — they don't need a gradient, a glow, a shadow stack, an icon, or a
second effect on top. Every extra layer competes with the merge moment and adds
a repaint. Likewise keep the API small: `variant` and `size` like the
neighbouring registry files, a label, and native button props; no config
objects, no theme props, no animation-timing knobs unless the user asks. If a
version with fewer parts still shows the stretch, ship the version with fewer
parts.

## The five rules

**1. Filter shapes only; text and icons live in a sibling layer.**
The alpha threshold turns anti-aliased edges into hard 0/1 pixels, so any text
inside the filtered layer turns jagged and blurred icons smear. Structure every
component as: one absolutely positioned *filtered layer* holding only solid
shapes, one *label layer* on top that is never filtered, and (when shapes must
match text widths) a *hidden measure copy* that sizes the stage.

**2. Give the blur room — the spacing rule.**
An SVG filter renders inside the filtered element's box plus its filter
region. Blur spreads roughly `3 × stdDeviation` in every direction, and shapes
travel while they animate. If a blurred shape reaches the edge it gets sliced
flat, and a flat edge on a "liquid" shape is the single most common tell.
So:
- Wrap the shapes in a **stage** padded by `offset = ceil(3σ + max travel)`
  on every side, and pull that padding back with **negative margins** so the
  component's layout footprint stays the size of the visible content. The
  exemplar uses `offset = 20 × (fontSize / 14)` with `σ = 2 × (fontSize / 14)`.
- Set the filter region explicitly (`x="-20%" y="-20%" width="140%"
  height="140%"`), because the default region is only 10% larger than the box.
- No `overflow-hidden` on the stage or between the stage and the shapes. Add
  `isolate` on the root so the filter never composites with siblings.
- Filter the smallest element that contains all shapes — filtering a large
  wrapper costs a full-size offscreen surface every frame.

**3. Solid blobs; tint the whole layer.**
The threshold binarises alpha, so a 30%-opacity blob either vanishes or turns
fully solid — never "pale". Give blobs an opaque fill (`bg-foreground`) and put
`opacity` on the *filtered layer*; opacity is applied after the filter, so the
merged shape stays crisp and tints as one piece. Because the fill comes from
theme tokens, dark mode is free — no `dark:` classes.

**4. Spring the leader, ease the follower.**
A gooey merge needs one shape to arrive before the other; the gap between them
is where the neck stretches. Drive the *leader* (the shape the eye follows —
the revealed pill, the knob, the active indicator) with a spring that
overshoots a little, and the *follower* (the trailing shape, the ghost, the
old position) with a slower ease or a heavier spring. Use different timings
for enter and leave — fast in, slower out reads as weight; the reverse reads
as a snap. Set `initial={false}` so nothing animates on mount.

| Feel | stiffness | damping | mass | Use for |
|---|---|---|---|---|
| liquid (default) | 266 | 15 | 1 | leader growing in place or travelling ≤ 2× its own size — visible overshoot sells the stretch |
| liquid, long travel | 266 | 22–26 | 1 | leader hopping across a track or nav — overshoot scales with distance, so 15 would fly past the target |
| snappy | 400 | 26–30 | 1 | knobs and toggles — one visible settle, no wobble |
| heavy | 170 | 22 | 1.4 | large panels, loaders, anything bigger than a button |
| follower, arriving | `duration: 0.8` in / `0.4` out, `ease: [0.19, 1, 0.22, 1]` | | a shape that appears *behind* the leader and catches up (the exemplar's second pill) |
| follower, hanging back | `duration: 0.35–0.65`, `ease: [0.65, 0, 0.35, 1]` | | a ghost or tail that must *stay* at the old spot while the leader leaves (toggle ghost, nav strand) |

Pick the follower's curve from what it does, not from a default: an expo-out
curve starts fast, so a ghost on expo-out leaves with the leader and the two
shapes never separate — the union is a plain stadium with no neck. A slow-start
curve keeps the ghost put for the first ~100ms, which is exactly when the
leader is pulling away.

Use `motion/react` (`import { motion, useReducedMotion } from "motion/react"`)
— the repo's registry already depends on it and it has native springs. GSAP
has no native spring; only reach for it when the component is already GSAP.

**5. Measure, don't guess.**
`width: auto` can't be animated, so shapes that must fit text get their target
widths from a hidden copy of the labels observed with `ResizeObserver`. Widths
land in state, the blobs animate to them, and custom labels or font loads keep
working. Reduced motion: read `useReducedMotion()` and set every transition to
`{ duration: 0 }` so the final state still appears, just without travel.

## Tuning the filter

```
<filter id={id} x="-20%" y="-20%" width="140%" height="140%">
  <feGaussianBlur in="SourceGraphic" stdDeviation={σ} result="blur" />
  <feColorMatrix in="blur" type="matrix"
    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" />
</filter>
```

- `σ` (stdDeviation): 2px at 14px type; scale it with the size. Bigger σ gives
  a longer neck and softer corners; past ~6px small shapes lose their corners.
- Alpha row `19 -9` thresholds at ≈0.47. `30 -15` is crisper but aliases;
  `12 -5` is softer. Adjust σ before touching the matrix.
- Shapes merge when their gap is under ~2σ. Choreograph so they touch or
  overlap at the merge moment; a 6px gap with σ = 2 just shows two shapes.
- One filter per instance: build the id from `React.useId()` (strip to
  `[a-zA-Z0-9-]`) so two instances on a page don't share or clobber a filter.
  Keep the `<svg>` in the DOM as `absolute size-0` — Safari ignores filters
  defined inside `display: none`.
- CSS `filter: blur() contrast(10)` is the old trick. It needs an opaque
  backdrop behind the shapes (that's what contrast pushes against), which
  prints a rectangle on any other background and makes solid fills impossible.
  Only use it when the component sits on a known solid colour and the SVG
  route is ruled out.

## Safari and touch

- `filter: url(#id)` on HTML elements repaints unreliably in Safari during
  animation. Ship a fallback that turns the filter off there —
  `supports-[-webkit-hyphens:none]:[filter:none]` is a Safari-only `@supports`
  test (Chromium ignores it; verified on this repo's grid) — and make sure the
  unfiltered shapes still look intentional (two adjoining pills, not a mess).
- Hover doesn't exist on touch. Gate hover state with
  `event.pointerType !== "touch"` and give the same reveal to focus and press,
  so keyboard and touch users get the effect too.

## Workflow

1. Read the exemplar and skim `references/gooey-recipe.md`. If it's a button,
   also run the novelty check in `/cool-buttons` — `goe-button` and
   `antinomy-button` already occupy gooey territory, so bring a new choreography.
2. Write the choreography as a comment before any code: which shapes exist,
   which one leads, which follows, what triggers it, and what the mid-frame
   looks like (this is the frame you will screenshot).
3. Compute spacing: pick σ, find the largest distance any shape travels, set
   `offset`, set the filter region, apply the negative margins.
4. Build the three layers (filtered shapes, labels, measure copy). Theme
   tokens for colour, `variant` and `size` props like the neighbouring registry
   files, `React.forwardRef` + `displayName` + default export, `"use client"`
   first and a one-line JSDoc second (the sync script uses it as the description).
5. Wire state: hover (non-touch), focus, press if the effect is press-driven,
   `disabled`. Reduced motion.
6. Verify — don't stop at "it compiles":
   - `bun run lint` on the file and `bunx tsc --noEmit`.
   - Screenshot it on the **running** dev server (never start a second one —
     `cat .next/dev/lock` tells you the port):
     ```
     NODE_PATH=$PWD/node_modules node .claude/skills/spring-gooey/scripts/snap.js \
       --url http://localhost:PORT/blocks/buttons --page all --text "Card Name" --up 2 --out /tmp/goo
     ```
     Look at the **mid** frame: is there a neck between the shapes? Any flat
     cut edge? Is the text crisp? Then check the dark frames.
7. Hand off with the registry path and what to look for. Promotion into a
   grid, sync, and PR is the "run the flow" process in `CLAUDE.local.md` —
   don't commit unless that was asked.

## Symptom → cause → fix

| Symptom | Cause | Fix |
|---|---|---|
| One side of the blob is cut flat | stage too tight, or an `overflow-hidden` ancestor | raise `offset`, widen the filter region, remove the overflow |
| Text looks jagged or fuzzy | text inside the filtered layer | move labels to the unfiltered sibling layer |
| Blobs invisible or suddenly solid | semi-transparent blob fill | opaque fill on blobs, `opacity` on the layer |
| Shapes overlap but never form a neck | gap larger than ~2σ, or σ too small | choreograph them to touch; raise σ a little |
| Everything jumps on first render | missing `initial={false}` | add it to every `motion.*` with an `animate` |
| Second instance breaks the first | shared filter id | `useId`-based id per instance |
| Filter dead in Safari, or shapes vanish | `<svg>` in `display:none`, or Safari's repaint bug | keep svg `absolute size-0`; ship the Safari fallback |
| Pills the wrong width for custom text | widths hard-coded | hidden measure copy + `ResizeObserver` |
| Effect looks mechanical | leader and follower share one transition | different spring/ease for each, different enter/leave |
