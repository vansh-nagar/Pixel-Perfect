# Reference effects

References inspected 2026-09-11:
- https://vessa.design/?ref=onepagelove
- https://griffin.com/?utm_source=landing.gallery

Read both user-requested local skills:
`~/.claude/skills/reverse-engineer/SKILL.md` and
`~/.claude/skills/reverse-engineer-implement/SKILL.md`.
The workflow was scoped to editable components in the existing Next.js library.
No production bundles, branding, licensed fonts, or media were added.

## Placement

- `/blocks/mouse-followers`: Dither Cursor Trail, page 3, entry 10.
- `/blocks/backgrounds`: exactly Currency Sky Background and Dither Wave Background,
  with a two-column desktop / one-column mobile grid. Sidebar and heading are **Backgrounds**.
- The extra standalone preview was removed at the user's request.
- The 18 retired background components and their registry exports were removed,
  and tutorial/category listings updated. Other categories are unchanged.

## Recovered behavior

Vessa `MDitherTrail` (`NvD7DDHJ2.js`) renders Bayer8 dithering through a chain
of 24 tapered capsules. Defaults: 3 CSS pixel cells, #1f2de6 at 0.1 opacity,
0.045 radius relative to height, radius taper 0.22, density 0.75 with taper
0.7, maximum chain spacing radius*2/23. Follow smoothing is 1-0.7^(dt*60);
visibility smoothing is 1-0.88^(dt*60). Movement expires after 60ms and the
field clears below strength 0.002.

Vessa `MDitherField` (`B-R0SCp-.js`), used above the footer via `MStageFrame`
(`Da79ZiS22.js`), combines two slow diagonal sine bands with Bayer8 thresholding.
Defaults: 2.5 CSS pixel cells, density 0.74, #1f2de6 and #eef0f3. Frequencies
5.2/8.4 and time rates -0.11/+0.07 are preserved. Pointer x/y use GSAP
power3.out over 0.5s; strength uses power2.out over 0.4s enter/0.6s leave.
The canvas reveals over 0.9s with power2.out. The marketing CTA plate is not
part of this reusable background.

Griffin `AsciiPattern` (`index-7e3d3e5932bbeb8e.js`, modules 68531/87713)
uses Canvas2D. Five trigonometric waves are combined over three terrain scales
(1, 2.2, 4.5), then contour bands choose between · / $ £ glyphs. Defaults:
12x14 CSS pixel cells, 12px font, terrain scale 0.13, contour spacing 0.08,
speed 0.9, draw every second animation frame. Brightness thresholds 15/50/100/160
map to #1a1918/#2c2a28/#524e4a/#959089 on #0c0c0b. The implementation preserves
these formulas, thresholds, and default settings.

## Usage

Copy from the normal gallery menus. Registry exports:
`/r/dither-cursor-trail.json`, `/r/dither-wave-background.json`,
`/r/currency-sky-background.json`.

Each component accepts children, className, and style; provide a container
height. The cursor is transparent. The two backgrounds include their base color.

```tsx
<DitherCursorTrail style={{ height: 600 }} />
<DitherWaveBackground style={{ height: 380 }} />
<CurrencySkyBackground style={{ height: 254 }} />
```

Cursor options: color (six-digit hex), opacity, pixelSize, radius.
Dither options: color, paperColor (six-digit hex), pixelSize, density, speed,
interactive. This background uses the existing GSAP dependency.
Currency options: speed, opacity, cellWidth, cellHeight, fontSize, fontFamily,
terrainScale, contourSpacing, paused. It has no animation-library dependency.

## Validation and limits

- Registry sync/build, TypeScript, and git diff whitespace checks passed.
- Targeted ESLint: zero errors or warnings in the components and grids.
- Registry contains exactly two backgrounds and generated sources match canonical files.
- Browser checks confirm gallery integration, transparent cursor motion/fade,
  both animated background patterns, working navigation, and no captured console errors.
- Mobile sizing was inspected at 390px; canvases resize without horizontal overflow.
- Cursor demo intentionally uses #818cf8, opacity 0.3, radius 0.075 so it remains
  visible on the library's light/dark surfaces. The reusable defaults retain Vessa values.
- Coordinates are container-local, not viewport-global. Cursor animation stops
  once faded. Backgrounds pause offscreen/hidden and become static for reduced motion.
- Griffin uses system monospace by default instead of distributing the source's
  licensed Sohne Mono. Consumers may supply their own fontFamily.
- Without WebGL the cursor is absent and the dither background remains solid.
- Visual review was not a frame-synchronized zero-diff comparison: wave phase,
  pointer history, host dimensions, and font metrics can differ. No exact full-page
  pixel parity is claimed.

Local server: `bun run dev --port 3016`.
Registry maintenance: `bun run registry-sync --prune` removes entries whose
canonical registry files no longer exist; pruning is opt-in, and preserves
legacy/custom entries outside `registry/new-york`.
