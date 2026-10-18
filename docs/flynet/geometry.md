# Flynet landing — geometry

Figma file key: `edt5MzP9P73ZZNGtaT3jNu` · page node `1:1566`
References: desktop only (1440 frame). No tablet/mobile frames exist.
Route: `/flynet` → `src/app/flynet/page.tsx`

## Page

| | Desktop (≥1024) | Tablet (768–1023) | Mobile (<768) |
|---|---|---|---|
| Frame width | 1440 | — | — |
| Rail column (between the two vertical rails) | 1280, centered, max-w 1280 | full − 2×32 | full − 2×16 |
| Rail gutter (viewport edge → rail) | 80 | 32 `inferred` | 16 `inferred` |
| Content inset (rail → content) | 20 | 20 | 16 `inferred` |
| Content width | 1240 (x=100…1340) | fluid | fluid |
| Content | centered | centered | centered |

Page background: `#ffffff`, text `#000000`. The page is light-only; it never follows the site's dark theme.

**Rails.** Two 1px vertical lines on the rail column edges run through every section, drawn above section content (z-10).
Light sections: `rgba(0,0,0,0.1)`. Dark sections: `rgba(255,255,255,0.1)`.
**Markers** are 7×7 squares centred on a rail: `#1b1b1b` on light sections, `#e3e3e3` on dark ones.

**Section gaps are 0.** Sections stack flush; all vertical breathing room is each
section's own internal padding (listed below), painted on that section's background.

Fonts (substitutes — the Figma fonts are commercial and not installed):
- `GTF Good Sans` → **Figtree** (`var(--font-flynet-sans)`, the page default)
- `PP Supply Mono` → **DM Mono** (`font-flynet-mono` class), used for buttons, nav, labels, stats

Dark-section noise: one shared 512px tile `/flynet/noise.png`, shown at 256px, `mix-blend-soft-light` over `#1b1b1b`.

## Sections

All sections are **full-bleed** (background edge to edge, content inside the rail column).
`gapAfter` = 0 everywhere.

| # | Node | Name | Kind | Bg | Height | pad top / bottom | Inset | Notes |
|---|---|---|---|---|---|---|---|---|
| 01 | `1:1567` | hero (nav + headline + logo strip) | hero | sky image, light | 1024 | nav 80 · headline at y=512 · logo strip y=862–934 · 90 bottom | 20 | rails start at y=80. rule + markers at y=80, 862, 934 |
| 02 | `1:1825` | integrate (3 cards) | cards | white | 792 | 80 / 80 | 20 | heading → cards gap 40 |
| 03 | `1:2021` | explore (app list + phone + card) | product demo | `#1b1b1b` + noise, dark | 1191 | 120 / 220 | 20 | rules + markers at y=80 and y=1090 |
| 04 | `1:2084` | use cases (intro + 5 cards) | cards | white | 980 | 80 / 80 | 20 | |
| 05 | `1:2561` | own it (CTA + globe) | CTA | white | 998.4 | 64 / 64 | 0 at lg+ (16/20 below) | text sits on the left rail; globe x=523…1419 |
| 06 | `1:2164` | community/ecosystem (2 cards) | cards | white | 960 | 80 / 80 | 20 | |
| 07 | `1:2200` | footer | footer | `#1b1b1b` + noise, dark | 1048.3 | 120 / 0 | 20 | rule at y=24; markers only at y=77; rule + markers at y=732; wordmark ends at section bottom |

Total: 1024 + 792 + 1191 + 980 + 998.4 + 960 + 1048.3 = 6993.7 ✓

## Shell API — `src/app/flynet/_shell/frame.tsx`

```tsx
<FlynetSection tone="light" | "dark" inset? railsFrom? background={<XBackground />}>
  <X />
</FlynetSection>
```

- Backgrounds come from the section's `XBackground` export, rendered at `inset-0` behind the content, full viewport width.
- Content components have no outer margin, max-width, horizontal page padding or bg colour; they own their vertical padding.
- `<RailDivider line? markers? />` is a zero-height, full-width block placed in normal flow as a direct child of the content root.

## Responsive assumptions (desktop-only reference)

- Gutters to rails: 80 (lg+) / 32 (md) / 16 (base). Content inset 20 / 20 / 16.
- Grids: 3-col → 2-col at `md` → 1-col below `md`. 2-col → 1-col below `md`.
- Side-by-side layouts (explore, own-it, footer columns) stack below `lg`; footer columns use a 2-col grid on mobile, 3-col at `md`.
- Type steps: 60 → 40 below `md`; 48 → 36 below `md`; 28 → 24 below `md`.
- Nav links hidden below `lg`. Hero is `min-h-[1024px]` only at `lg+`.
