# Flynet build queue

**To resume after a compaction or in a new session:** read this file and
[`geometry.md`](geometry.md), then relaunch every row still marked `stub`, grouped
by worker as recorded here. The shell and the stubs already exist.

Status: `stub` → `built` (worker wrote it) → `done` (integrated, typechecks).

| # | Node | Section | Mode | Worker | Model | Status | File |
|---|---|---|---|---|---|---|---|
| 01 | `1:1567` | hero (nav + headline + logos) | full-bleed | A | sonnet | stub | `src/app/flynet/_sections/hero.tsx` |
| 02 | `1:1825` | integrate | full-bleed (white) | B | opus | stub | `src/app/flynet/_sections/integrate.tsx` |
| 03 | `1:2021` | explore | full-bleed (dark) | C | sonnet | stub | `src/app/flynet/_sections/explore.tsx` |
| 04 | `1:2084` | use cases | full-bleed (white) | D | sonnet | stub | `src/app/flynet/_sections/use-cases.tsx` |
| 05 | `1:2561` | own it | full-bleed (white), inset 0 | E | sonnet | stub | `src/app/flynet/_sections/own-it.tsx` |
| 06 | `1:2164` | community/ecosystem | full-bleed (white) | D | sonnet | stub | `src/app/flynet/_sections/community.tsx` |
| 07 | `1:2200` | footer | full-bleed (dark) | E | sonnet | stub | `src/app/flynet/_sections/footer.tsx` |

## Shell

Path: `src/app/flynet/page.tsx` + `src/app/flynet/_shell/frame.tsx` + `src/app/flynet/layout.tsx`
· owns rails, rail column, content inset, section order, gaps (0), full-bleed background
slots, fonts. Only the orchestrator edits these.

## Worker log

| Worker | Sections | Model | Status | Requests raised |
|---|---|---|---|---|
| A | hero | sonnet | running | |
| B | integrate | opus | running | |
| C | explore | sonnet | running | |
| D | use cases + community | sonnet | running | |
| E | own it + footer | sonnet | running | |

## Shared-component requests

| Requested by | Thing | Measurements | Outcome |
|---|---|---|---|

## Whole-page verification

| Breakpoint | Pass | What was wrong | Fixed in |
|---|---|---|---|
| desktop 1440 | | | |
| mobile 390 | | | |
