# CatalogPageMonitorParity — GridCard's real preview fits, and the 2×2 hides its neighbours

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CatalogPageMonitorParity.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-27 — kol-component 0.108.0 · kol-shell 0.10.0

## Why it went there

`CatalogPageCardFit` closed on `natural`, which is contain — not the retired
GridCard's fit (the image at 50 % / 30 % of its pixels, top-left, clipped;
the user rejected the contain render against the original). And a 2×2 expand
must hide its three neighbours, which only `CatalogPage` can do — the consumer
never sees the filtered row order.

## What stays here

- `src/styles/monitor-overrides.css` — the two GridCard preview rules on
  `.preview-natural` / `.preview-compact` (`ContentCard className`, Library +
  Create) and `.home-catalog` (Home). **On ship:** cards take the DS fits, Home's
  `toCard` returns them, delete the rules + hooks.
- `LibraryPage` on `ContentFilters` + the cards directly, with `computeHiddenSet`.
  **On ship:** move onto `CatalogPage` (`filtersProps`, `expanded` /
  `expandedContent` through `toCard`), delete `computeHiddenSet`.

## ✅ RETURNED — 2026-08-27 · kol-component 0.108.0 · kol-shell 0.10.0

(1) ContentMedia fit natural / compact ARE GridCard's fits now — the image at 50 % / 30 % of its pixels, top-left, clipped (the theme rules verbatim); contain is gone, no consumer was on it. (2) CatalogPage skips the expanded card's three neighbours in its own render — your computeHiddenSet for the 6-column grid, verbatim. Verified in source only (no server run, by your rule).

**Remainder here:** bump kol-component 0.108.0 · kol-shell 0.10.0; toCard returns fit: 'natural' (or 'compact') + expanded / expandedContent; delete the .preview-* / .home-catalog override rules and computeHiddenSet; move Library onto CatalogPage

**Remainder here:** none — adopted 2026-08-27: bumped component 0.108.0 · shell 0.10.0 (theme 0.72.0 · icons 0.22.0 rode along); Library on `CatalogPage` (`filtersProps`, `expanded` / `expandedContent` + `fit` through `toCard`, `key={tab}` for the two filter-group sets), `computeHiddenSet` deleted, the `.preview-*` / `.home-catalog` fit rules deleted — Home `fit: 'compact'`, modules `natural`, patches `compact`. The hover ruling (no zoom, one rung) stays in `monitor-overrides.css`, keyed on `.kol-card`. Build green, main chunk 1.10MB. Visual check the user's.
