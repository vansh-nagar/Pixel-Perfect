---
name: gsap
description: GSAP animation reference for this project (Next.js + React + @gsap/react). Covers the useGSAP hook & cleanup, gsap.to/from/fromTo, easing, stagger, defaults, timelines (position parameter, labels, nesting, playback), ScrollTrigger, and performance (transforms, will-change, quickTo). Use when writing GSAP animations in playground/registry components.
---

# GSAP

## This project's contract (React + @gsap/react)

This is a **Next.js App Router + React** project. GSAP runs live in the browser inside
client components — there is **no HyperFrames / `window.__timelines` / video render
pipeline** here. Build animations the React way:

- Components that use GSAP must start with `"use client";`.
- Prefer the **`useGSAP()` hook** from `@gsap/react` — it scopes selectors and
  auto-reverts/cleans up every tween, timeline, and ScrollTrigger on unmount:
  ```tsx
  "use client";
  import { useRef } from "react";
  import { useGSAP } from "@gsap/react";
  import { gsap } from "gsap";

  export default function MyAnim() {
    const root = useRef<HTMLDivElement>(null);

    useGSAP(
      () => {
        gsap.from(".title", { y: 48, autoAlpha: 0, duration: 0.6, ease: "power3.out" });
      },
      { scope: root }, // selectors resolve inside root; cleanup is automatic
    );

    return (
      <div ref={root}>
        <h1 className="title">Hello</h1>
      </div>
    );
  }
  ```
- For purely event-driven tweens (click/hover), calling `gsap.to(...)` inside the handler
  is fine (see `registry/new-york/gsap/stagger1.tsx`). Still wrap setup-time animations in
  `useGSAP` so cleanup is handled.
- **Looping/infinite animations ARE allowed** (interactive UI, `repeat: -1`, `yoyo: true`) —
  unlike a video renderer. Just kill/clean them up (useGSAP does this for you).
- Register plugins once at module scope: `gsap.registerPlugin(useGSAP, ScrollTrigger);`
- These animations get promoted from the playground into `registry/new-york/gsap/` and the
  GSAP grid — see [CLAUDE.local.md](../../../CLAUDE.local.md) ("run the flow").

## Core Tween Methods

- **gsap.to(targets, vars)** — animate from current state to `vars`. Most common.
- **gsap.from(targets, vars)** — animate from `vars` to current state (entrances).
- **gsap.fromTo(targets, fromVars, toVars)** — explicit start and end.
- **gsap.set(targets, vars)** — apply immediately (duration 0).

Always use **camelCase** property names (e.g. `backgroundColor`, `rotationX`).

## Common vars

- **duration** — seconds (default 0.5).
- **delay** — seconds before start.
- **ease** — `"power1.out"` (default), `"power3.inOut"`, `"back.out(1.7)"`, `"elastic.out(1, 0.3)"`, `"none"`.
- **stagger** — number `0.1` or object: `{ amount: 0.3, from: "center" }`, `{ each: 0.1, from: "random" }`, `{ grid: [8, 8], from: 0 }`.
- **overwrite** — `false` (default), `true`, or `"auto"`.
- **repeat** — number of repeats; `-1` = infinite (fine for interactive UI). **yoyo** — alternates direction with repeat.
- **onComplete**, **onStart**, **onUpdate** — callbacks.
- **immediateRender** — default `true` for from()/fromTo(). Set `false` on later tweens targeting the same property+element to avoid overwrite.

## Transforms and CSS

Prefer GSAP's **transform aliases** over raw `transform` string:

| GSAP property               | Equivalent          |
| --------------------------- | ------------------- |
| `x`, `y`, `z`               | translateX/Y/Z (px) |
| `xPercent`, `yPercent`      | translateX/Y in %   |
| `scale`, `scaleX`, `scaleY` | scale               |
| `rotation`                  | rotate (deg)        |
| `rotationX`, `rotationY`    | 3D rotate           |
| `skewX`, `skewY`            | skew                |
| `transformOrigin`           | transform-origin    |

- **autoAlpha** — prefer over `opacity`. At 0: also sets `visibility: hidden`.
- **CSS variables** — `"--hue": 180`.
- **svgOrigin** _(SVG only)_ — global SVG coordinate space origin. Don't combine with `transformOrigin`.
- **Directional rotation** — `"360_cw"`, `"-170_short"`, `"90_ccw"`.
- **clearProps** — `"all"` or comma-separated; removes inline styles on complete.
- **Relative values** — `"+=20"`, `"-=10"`, `"*=2"`.

## Function-Based Values

```javascript
gsap.to(".item", {
  x: (i, target, targets) => i * 50,
  stagger: 0.1,
});
```

## Easing

Built-in eases: `power1`–`power4`, `back`, `bounce`, `circ`, `elastic`, `expo`, `sine`. Each has `.in`, `.out`, `.inOut`.

## Defaults

```javascript
gsap.defaults({ duration: 0.6, ease: "power2.out" });
```

## Controlling Tweens

```javascript
const tween = gsap.to(".box", { x: 100 });
tween.pause();
tween.play();
tween.reverse();
tween.kill();
tween.progress(0.5);
tween.time(0.2);
```

## gsap.matchMedia() (Responsive + Accessibility)

Runs setup only when a media query matches; auto-reverts when it stops matching. Pairs well
with `useGSAP` for `prefers-reduced-motion`.

```javascript
let mm = gsap.matchMedia();
mm.add(
  {
    isDesktop: "(min-width: 800px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  },
  (context) => {
    const { isDesktop, reduceMotion } = context.conditions;
    gsap.to(".box", {
      rotation: isDesktop ? 360 : 180,
      duration: reduceMotion ? 0 : 2,
    });
  },
);
```

---

## Timelines

### Creating a Timeline

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
tl.to(".a", { x: 100 }).to(".b", { y: 50 }).to(".c", { opacity: 0 });
```

### Position Parameter

Third argument controls placement:

- **Absolute**: `1` — at 1s
- **Relative**: `"+=0.5"` — after end; `"-=0.2"` — before end
- **Label**: `"intro"`, `"intro+=0.3"`
- **Alignment**: `"<"` — same start as previous; `">"` — after previous ends; `"<0.2"` — 0.2s after previous starts

```javascript
tl.to(".a", { x: 100 }, 0);
tl.to(".b", { y: 50 }, "<"); // same start as .a
tl.to(".c", { opacity: 0 }, "<0.2"); // 0.2s after .b starts
```

### Labels

```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");
tl.addLabel("outro", "+=0.5");
tl.play("outro");
tl.tweenFromTo("intro", "outro");
```

### Timeline Options

- **paused: true** — create paused; call `.play()` to start.
- **repeat**, **yoyo** — apply to whole timeline.
- **defaults** — vars merged into every child tween.

### Nesting Timelines

```javascript
const master = gsap.timeline();
const child = gsap.timeline();
child.to(".a", { x: 100 }).to(".b", { y: 50 });
master.add(child, 0);
```

### Playback Control

`tl.play()`, `tl.pause()`, `tl.reverse()`, `tl.restart()`, `tl.time(2)`, `tl.progress(0.5)`, `tl.kill()`.

---

## ScrollTrigger

Register once, then attach to a tween/timeline. Inside `useGSAP({ scope })`, triggers are
cleaned up automatically on unmount.

```tsx
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, ScrollTrigger);

useGSAP(
  () => {
    gsap.from(".panel", {
      y: 100,
      autoAlpha: 0,
      stagger: 0.15,
      scrollTrigger: {
        trigger: ".panel",
        start: "top 80%",
        // scrub: true, pin: true, markers: true (debug)
      },
    });
  },
  { scope: root },
);
```

This repo also has Lenis (`@studio-freight/lenis`) for smooth scroll — if a component scrolls,
check existing grids (e.g. `text-grid.tsx`) for how Lenis + ScrollTrigger are wired together.

---

## InertiaPlugin (momentum / throw / flick)

Free and bundled since GSAP 3.13 (this project is 3.15) — import from `gsap/InertiaPlugin`.
Glides a property to a stop honoring an initial velocity; great for flick-scroll, throw-to-snap,
and magnetic/cursor-follow buttons.

```tsx
import { InertiaPlugin } from "gsap/InertiaPlugin";
gsap.registerPlugin(useGSAP, InertiaPlugin);

// Minimal: provide initial velocity (units/sec); duration is computed automatically.
gsap.to(obj, { inertia: { x: 500, y: -300 } });
```

Per-property config (object form):

| key | meaning |
| --- | --- |
| `velocity` | initial velocity (units/sec), or `"auto"` when the prop is tracked |
| `min` / `max` | clamp the **resting** value to a range (not the velocity) |
| `end` | exact land value (number), snap notches (array), or `(natural) => value` (function) |
| `resistance` | friction per second |

```javascript
gsap.to(obj, {
  inertia: {
    x: { velocity: 500, max: 1024, min: 0 },
    y: { velocity: -300, end: [0, 100, 200] }, // snap to nearest notch
  },
});
```

**Auto velocity tracking** — track a property ahead of time, then use `velocity: "auto"`:

```javascript
InertiaPlugin.track(el, "x,y");          // start ≥0.5s before you need it
InertiaPlugin.getVelocity(el, "x");      // read current velocity
InertiaPlugin.untrack(el, "x,y");        // stop (do this in useGSAP cleanup)
```

**Magnetic cursor-follow + throw-back** (the pattern used in the playground): `quickTo` to lag-follow
the cursor (which builds velocity), then on `pointerleave` an inertia tween with `velocity: "auto"`
and `end: 0` glides it back to center with natural momentum.

```tsx
useGSAP(
  () => {
    const el = ref.current!;
    InertiaPlugin.track(el, "x,y");
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      xTo(gsap.utils.clamp(-22, 22, (e.clientX - (r.left + r.width / 2)) * 0.4));
      yTo(gsap.utils.clamp(-10, 10, (e.clientY - (r.top + r.height / 2)) * 0.4));
    };
    const onLeave = () =>
      gsap.to(el, { inertia: { x: { velocity: "auto", end: 0 }, y: { velocity: "auto", end: 0 } } });
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      InertiaPlugin.untrack(el);
    };
  },
  { scope: ref },
);
```

Notes: inertia tweens are fully reversible/seekable (unlike frame-loop physics). Often paired with
`Draggable` (`{ inertia: true }`), but works standalone as above. Everything is reversible and can be
dropped into a timeline.

---

## Performance

### Prefer Transform and Opacity

Animating `x`, `y`, `scale`, `rotation`, `opacity` stays on the compositor. Avoid `width`, `height`, `top`, `left` when transforms achieve the same effect.

### will-change

```css
will-change: transform;
```

Only on elements that actually animate.

### gsap.quickTo() for Frequent Updates

```javascript
let xTo = gsap.quickTo("#id", "x", { duration: 0.4, ease: "power3" }),
  yTo = gsap.quickTo("#id", "y", { duration: 0.4, ease: "power3" });
container.addEventListener("mousemove", (e) => {
  xTo(e.pageX);
  yTo(e.pageY);
});
```

### Stagger > Many Tweens

Use `stagger` instead of separate tweens with manual delays.

### Cleanup

Pause or kill off-screen animations. With `useGSAP({ scope })` this is automatic on unmount.

---

## Best Practices

- Use `useGSAP({ scope })` for setup-time animations so cleanup is automatic.
- Use camelCase property names; prefer transform aliases and autoAlpha.
- Prefer timelines over chaining with delay; use the position parameter.
- Add labels with `addLabel()` for readable sequencing.
- Pass defaults into the timeline constructor.
- Store tween/timeline return value when controlling playback.
- Respect `prefers-reduced-motion` via `gsap.matchMedia()`.

## Do Not

- Animate layout properties (width/height/top/left) when transforms suffice.
- Use both svgOrigin and transformOrigin on the same SVG element.
- Chain animations with delay when a timeline can sequence them.
- Create tweens before the DOM exists (use `useGSAP`, not bare module code).
- Skip cleanup — let `useGSAP` handle it, or `kill()` manually for ad-hoc tweens.

## References

- GSAP docs: https://gsap.com/docs/v3/
- useGSAP hook: https://gsap.com/resources/React/
- ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Working examples in this repo: `registry/new-york/gsap/` (`stagger1.tsx`, `flip-text-reveal.tsx`).
