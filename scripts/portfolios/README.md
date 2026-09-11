# Clean portfolios

The collection is part of the Blocks browser at `/blocks/clean-portfolios`.
Select Folio, Index, or Letter in the same preview surface; `?template=letter`
selects a template on direct entry. Old `/clean-portfolios` URLs redirect here.

## Customize

Edit `scripts/portfolios/generate.mjs`, then run `node scripts/portfolios/generate.mjs`.
The generated files in `public/portfolios` supply the embedded previews. The UI has no Open or Download actions.
Replace the fictional profile, project descriptions, dates, and example.com addresses.
No runtime libraries, remote assets, or JavaScript are required.

The Blocks interface renders these exact files in an isolated iframe, keeping the
library theme separate from template CSS. Desktop/mobile controls only change the
frame width. Adding a template requires a catalog entry and a generated HTML file.

## Current design

Following the request for more distinct designs, Folio now has a side rail and compact work list; Index uses a ruled project ledger; Letter uses an editorial spread. Mobile layouts collapse to one column. This supersedes the earlier section-reconstruction geometry below.

## Earlier reference study

Used the local `reverse-engineer` and `reverse-engineer-implement` skills for
section measurement, reconstruction, and preserving the generated document in the
existing Next.js application. Scope is selected homepage sections, not full-site clones.

References discovered through https://deadsimplesites.com/:
- https://www.paullarkin.info/ — 640px content column, 16px heading, 48px header gap,
  128px introduction-to-work gap, year/project/type rows, compact bottom navigation.
- https://www.arlan.me/ — 528px content width, 15px type, 32px list indentation,
  33.5px rows, 40px section separation, muted aligned dates.
- https://joshpuckett.me/ — left-aligned 548px content, 96px desktop inset,
  24px serif headings, 16px/26px paragraphs, 48px rules, 72px section spacing.

Measured values are recorded in `reference/measurements-desktop.json`.

Intentional differences: fictional content; system fonts instead of the references'
font files; original generic marks instead of branded icons; local HTML disclosures
instead of outgoing project pages; Folio uses in-page navigation instead of extra routes.
This is section-based reconstruction, not a claim of pixel-identical full-site parity.
The browser inspection API cannot expose `document.getAnimations`; computed animation
styles were captured instead. The redesigned templates have no entrance animation.

## Validation

Production build, TypeScript, and focused lint pass. Browser checks cover template
selection, mobile frame width, project disclosure, and overflow in the mobile previews.
The generated documents are served unchanged inside the Next.js wrapper.
