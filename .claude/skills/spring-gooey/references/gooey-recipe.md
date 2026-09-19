# Gooey recipe — annotated template and choreography patterns

Contents
1. The three-layer template (annotated)
2. Spacing arithmetic
3. Choreography patterns: reveal pills, toggle knob, nav indicator, loader dots
4. CSS blur+contrast fallback (when SVG filters are ruled out)

The exemplar `registry/new-york/buttons/antinomy-button.tsx` is the finished,
verified version of pattern 3.1. Read it alongside this file.

`registry/new-york/buttons/goe-button.tsx` is an older gooey button in the grid. It
shows the effect but also the two mistakes to avoid: a single global filter id
(`#goo-effect`, so two instances share one definition) and text inside the filtered
layer. Don't copy its structure.

---

## 1. The three-layer template

Every gooey component is the same skeleton. Names in comments match the exemplar.

```tsx
"use client";
/**
 * One-line description — the registry sync script uses this as the public description.
 */
import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const ease = [0.19, 1, 0.22, 1] as const; // expo-out: fast start, long settle — the follower's curve

export default function GooeyThing({ size = 14 }: { size?: number }) {
  const [active, setActive] = React.useState(false);
  const reduced = useReducedMotion();

  // Unique filter per instance. useId may contain ":" or "«»"; strip to what a URL fragment likes.
  const gooId = `goo-${React.useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  // Everything scales from one number so the proportions hold at any size.
  const unit = size / 14;
  const sigma = 2 * unit;      // blur radius
  const travel = 10 * unit;    // furthest any shape moves
  const offset = 20 * unit;    // ≥ 3*sigma + travel → room for the blur to fuse without clipping

  const transition = reduced ? { duration: 0 } : { duration: 0.4, ease };

  return (
    <button
      type="button"
      className="relative isolate inline-flex ..."        // isolate: the filter never composites with siblings
      onPointerEnter={(e) => e.pointerType !== "touch" && setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}                     // keyboard gets the same reveal
      onBlur={() => setActive(false)}
    >
      {/* The filter definition. Keep it rendered (size-0), never display:none — Safari ignores hidden defs. */}
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
        <defs>
          <filter id={gooId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={sigma} result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" />
          </filter>
        </defs>
      </svg>

      {/* STAGE: padded by `offset` so blurred shapes never touch an edge; negative margins
          pull the padding back so the layout footprint equals the visible content. */}
      <span className="relative inline-flex" style={{ padding: offset, margin: -offset }}>

        {/* LAYER 1 — filtered shapes only. Opaque fills; tint with opacity on THIS element. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [filter:var(--goo)] supports-[-webkit-hyphens:none]:[filter:none]"
          style={{ "--goo": `url(#${gooId})` } as React.CSSProperties}
        >
          <motion.span
            className="absolute h-[2em] rounded-full bg-foreground"
            style={{ top: offset, left: offset }}
            initial={false}                                   // no mount animation
            animate={{ width: active ? 96 : 0, x: active ? travel : 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 266, damping: 15, mass: 1 }}
          />
          <motion.span
            className="absolute h-[2em] rounded-full bg-foreground"
            style={{ top: offset, left: offset }}
            initial={false}
            animate={{ width: active ? 140 : 0, x: active ? travel + 96 : 48 }}
            transition={reduced ? { duration: 0 } : { duration: active ? 0.8 : 0.4, ease }}  // the follower
          />
        </span>

        {/* LAYER 2 — labels. Never filtered. Sits on top of the shapes. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center"
          style={{ padding: offset }}
          initial={false}
          animate={{ x: active ? travel : 0 }}
          transition={transition}
        >
          ...label pills...
        </motion.span>

        {/* LAYER 3 — hidden measure copy. Gives the stage its size and, via ResizeObserver,
            the target widths the shapes animate to (width:auto can't be animated). */}
        <span aria-hidden="true" className="pointer-events-none invisible flex">
          ...same pills, unstyled by state...
        </span>
      </span>
    </button>
  );
}
```

Notes on the template:
- `--goo` as a CSS variable lets the Safari fallback (`supports-[-webkit-hyphens:none]:[filter:none]`)
  win by normal cascade order — an inline `style={{ filter }}` would beat any class.
- Put `top: offset; left: offset` on the shapes so their coordinate space is the stage's
  content box, i.e. the same box the labels are laid out in. Then a label at `x` and a
  shape at `x` line up exactly.
- Shapes that collapse should collapse toward where they will reappear from (the exemplar
  parks each closed pill at its own centre, `x: shift + width / 2`, so opening reads as
  "blooming from the middle", not "sliding in from the left").

## 2. Spacing arithmetic

```
sigma   = blur radius (stdDeviation)          e.g. 2 × unit
spread  = 3 × sigma                            how far blur reaches past the shape
travel  = max distance any shape moves         e.g. label shift, knob track length
overshoot = ~10% of travel for a "liquid" spring (stiffness 266 / damping 15)
offset  = ceil(spread + travel + overshoot)    stage padding on every side
```

Then:
- Stage: `padding: offset; margin: -offset` (asymmetric margins are fine when the visible
  content is meant to hang outside the box — the exemplar pulls left by an extra `shift`
  so the resting label's ink sits on the layout edge, and adds it back on the right so the
  button's box matches the revealed pills; that is what makes the focus ring hug the shape).
- Filter region: `-20% / 140%` covers `offset` for any stage that's at least 5× offset wide.
  For very small stages (a lone 24px knob), give the region absolute units:
  `x={-offset} y={-offset} width={w + 2 * offset} height={h + 2 * offset}` with
  `filterUnits="userSpaceOnUse"`.
- Verify by screenshotting the **mid** frame — clipping only shows while shapes are moving.

## 3. Choreography patterns

Each pattern names the leader (spring) and the follower (ease / heavier spring), because
the stretch between them is the effect.

### 3.1 Reveal pills (exemplar)
- Shapes: pill A behind the action word, pill B behind the label.
- Trigger: hover / focus.
- Leader: A — spring 266/15/1 on width and x, blooms from its centre.
- Follower: B — 0.8s expo-out in, 0.4s out.
- Labels: the label layer translates by `shift`; the action word mounts with a fade and
  `layout="position"` so the existing label slides rather than jumps.
- Mid frame: A fully open, B two-thirds open, a neck between them.

### 3.2 Toggle knob that stretches
- Shapes: the knob, plus a ghost knob that stays at the old position and shrinks.
- Trigger: click / keyboard toggle (`role="switch"`, `aria-checked`).
- Leader: knob x — spring 400/26 (snappy; one visible settle, no wobble).
- Follower: ghost spawned at the knob's live position — scale 1 → 0 while drifting
  ~40% of the travel toward the knob over 0.35s on a slow-start ease `[0.65, 0, 0.35, 1]`.
  Slow start matters: on expo-out the ghost shrinks faster than a 400-stiffness knob
  moves and the neck breaks by ~100ms. With slow start, one blob spans most of the
  track at ~100ms, thins to a neck by ~150ms, and the last bead is absorbed at ~230ms.
- Track is *not* in the filtered layer unless you want the knob to melt into the track
  edges (nice for a "liquid inside a tube" feel — then the track is a shape too, and the
  knob colour must contrast via the label layer, e.g. an icon on top).
- Spacing: travel = track length − knob size; σ ≈ knob / 8.

### 3.3 Nav indicator that blobs between items
- Shapes: the active indicator pill, plus a trailing clone.
- Trigger: hover an item (return to the selected item on leave).
- Leader: indicator x/width — spring 266/22/1 measured from the target item's rect
  (damping 22, not 15: a full-span hop is ~200px and 19% overshoot would fly ~38px past
  the last item). Use a heavier spring (200/24) for the return to the selected item so
  it settles rather than bounces.
- Follower: a thinner strand (≈0.8em tall) whose edges are `useTransform`-derived from a
  lagging tail point (old item's centre) and the leader's live centre. The tail tweens on
  a slow-start ease `[0.65, 0, 0.35, 1]`, 0.5s out / 0.65s back, so it hangs back while
  the leader leaves and the blob reads as a droplet stretched between items. A same-height
  clone on expo-out does *not* work here: expo-out is ahead of the spring for the first
  ~100ms, and two equal-height overlapping pills union into a stadium with no neck. Keep
  the strand thinner than the pill so it doesn't black out the labels it crosses.
- Measure items with refs and `getBoundingClientRect()` relative to the list; re-measure
  on `ResizeObserver` of the list.
- Spacing: travel = full list width; σ = 3px at 14px type. The stage is the list itself,
  padded; labels are the real nav links (layer 2), never filtered.

### 3.4 Loader dots
- Shapes: 3 circles.
- Leader: none — this is a keyframe pattern. Each circle animates `x` toward its
  neighbour and back with a spring (`type: "spring"`, repeat) offset by 120ms per dot.
- σ ≈ dot / 4 so adjacent dots fuse at the closest approach and split at the farthest.
- Reduced motion: static three dots at rest opacity 0.6.

## 4. CSS blur+contrast fallback

Only when SVG filters are unavailable (some email/iframe sandboxes) or the component is
guaranteed to sit on one solid colour.

```css
.surface { background: <the page colour>; filter: blur(2px) contrast(10); opacity: 0.08; }
.blob    { background: <opposite of the page colour>; }
```

`contrast(10)` binarises luminance, not alpha, which is why the surface needs an opaque
background of the *page* colour and the blobs the opposite. The surface prints a
rectangle on any other background, `opacity` is the only way to tint, and Safari renders
`contrast()` differently — the original Antinomy site turns it off there and on touch
(`@media (hover: none)`). Prefer the SVG route.
