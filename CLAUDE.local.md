# Pixel Perfect — personal working notes (Vansh)

> Personal, gitignored. My goal here is to **learn animation** (GSAP + Motion/Framer
> Motion) by building one animation at a time in the playground, while Claude handles
> the repetitive plumbing — promoting it into the registry + grid, syncing, cleaning
> up, and opening the PR.

## What this project is

`pixel-perfect` is a Next.js (App Router) + shadcn-style **component registry & showcase**,
run with **bun**. Animations live as standalone registry components and are displayed in
paginated "grids". The flow is always: **build in the playground → promote into a grid →
publish via the registry**.

Key locations:
- **Playground (my scratch pad):** [src/app/playground/page.tsx](src/app/playground/page.tsx) — I build/iterate one animation here.
- **Registry components:** `registry/new-york/<category>/<name>.tsx` — the canonical, reusable source.
- **Grids (showcase):** [src/components/mine/grids/](src/components/mine/grids/) — one grid per category, imports from the registry.
- **Registry manifest:** `registry.json` + generated `public/r/*.json` (do not hand-edit — use the sync script).
- **Sync script:** [scripts/sync-registry.mjs](scripts/sync-registry.mjs).

---

## ⚡ The Flow — trigger phrase: "run the flow" (a.k.a. "flow it", "promote this")

When I say **"run the flow"**, I've just finished an animation in the playground and I
want Claude to take it the rest of the way. Claude should do ALL of the following, in
order, without stopping to ask unless something is genuinely ambiguous (e.g. it can't
tell which category, or the animation needs a name I haven't given):

1. **Read the playground** ([src/app/playground/page.tsx](src/app/playground/page.tsx)) and identify the animation
   component(s) I just built. If the playground imports a local component, follow it.

2. **Pick the category** based on the tech used:
   | Animation uses… | Registry folder | Grid file |
   |---|---|---|
   | **GSAP** (`gsap`, `@gsap/react`) | `registry/new-york/gsap/` | [src/components/mine/grids/gsap-grid.tsx](src/components/mine/grids/gsap-grid.tsx) |
   | **Motion / Framer Motion** (`motion`, `framer-motion`) | `registry/new-york/motion-framer/` | [src/components/mine/grids/motion-animations-grid.tsx](src/components/mine/grids/motion-animations-grid.tsx) |
   | SVG / text / buttons / etc. | matching `registry/new-york/<cat>/` | matching `*-grid.tsx` |

   If unsure which category, ask me — don't guess.

3. **Create the registry component** at `registry/new-york/<category>/<kebab-name>.tsx`:
   - Self-contained and reusable (no playground-only scaffolding, no leftover console logs).
   - `"use client"` at the top when it uses hooks/animation.
   - Add a **JSDoc one-liner at the very top** — the sync script uses it as the description:
     ```tsx
     /**
      * A staggered text reveal driven by a GSAP timeline.
      */
     ```
   - Keep imports clean; match the style of neighbouring registry files.

4. **Register it in the matching grid.** Append a new entry to that grid's array and
   **match the existing shape of THAT grid exactly** (the shapes differ between grids):
   - `gsap-grid.tsx` uses `component: <MyComp />` (a JSX element).
   - `motion-animations-grid.tsx` uses `Component: MyComp` (a component type).
   - Always include: `name`, `description`, the component field, and `registryName`
     (kebab-case, matching the registry filename).
   - Add the `import` for the new component at the top of the grid.

5. **Sync the registry:** run `bun run registry-sync`. This adds/updates the
   `registry.json` entry (inferring deps) and regenerates `public/r/*.json`. Don't
   hand-edit `registry.json`.

6. **Clean up the playground** so it's a blank slate for my next animation. Reset
   [src/app/playground/page.tsx](src/app/playground/page.tsx) to a minimal placeholder:
   ```tsx
   const Page = () => {
     return <div className="grid min-h-screen place-items-center">Playground</div>;
   };

   export default Page;
   ```
   (Remove now-unused imports. Don't delete the registry component or grid entry.)

7. **Verify it compiles** before publishing: run `bun run lint` (and a quick type check
   if fast). Fix anything obvious that the move introduced.

8. **Branch, commit, PR:**
   - Create a branch like `feat/<category>-<kebab-name>` off `main`.
   - Conventional-commit message, matching the repo's existing style, e.g.
     `feat: add <Name> animation to <category> grid`.
   - Open the PR with `gh`. PR body: one line on what the animation is + that it was
     promoted from the playground into the `<category>` grid and registry.
   - **Only commit/push/PR when running the flow** — that's the explicit signal.

Report back with: the new registry path, the grid it was added to, and the PR link.

---

## Conventions & gotchas

- **Package manager is bun.** Use `bun run <script>`, not npm/yarn.
- `registryName` (in the grid) === the registry **filename** (kebab-case). Keep them in sync.
- Each grid paginates via `itemsPerPage`; just append to the array — pagination handles the rest.
- The JSDoc top-comment in a registry component is its public description — write it well.
- Never hand-edit `registry.json` or `public/r/*.json`; they're generated by `registry-sync`.
- I'm here to **learn** — when promoting, if you change my animation code (perf, cleanup,
  idiomatic GSAP/Motion), leave a short note in the PR body on what you changed and why.
