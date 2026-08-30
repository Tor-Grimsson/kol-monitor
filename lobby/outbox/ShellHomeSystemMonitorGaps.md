# ShellHomeSystemMonitorGaps — two seams hit adopting kol-shell 0.8.0

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellHomeSystemMonitorGaps.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-27 — kol-shell 0.9.0

## Why it went there

Both are kol-shell internals with no consumer seam: `SettingsShortcuts` reads
`items[].combo` while `ShortcutsOverlay` reads `items[].keys` (its docstring
promises one array); `CatalogPage` passes a fixed prop set to `ContentFilters`
(no `mutuallyExclusiveFilters`) and its `toCard` contract has no `expanded` /
`expandedContent`, although `ContentCard catalog` carries both since 0.72.0.

## What stays here

- `src/data/shortcuts.js` maps `combo → keys` once for the overlay — drop the
  map when the field is reconciled.
- **On ship: adopt.** Move `LibraryPage` onto `CatalogPage` (modules · patches
  views, `mutuallyExclusiveFilters={['category', 'u_label']}`, `expanded` +
  `expandedContent` through `toCard`, `computeHiddenSet` stays consumer-side).
  Create stays on `ContentFilters` directly — its CASE view is rack chrome.

## ✅ RETURNED — 2026-08-27 · kol-shell 0.9.0

ShortcutsOverlay reads combo (keys tolerated for a release) — one array feeds both. CatalogPage: filtersProps spreads onto ContentFilters last (mutuallyExclusiveFilters and whatever comes next); toCard may return expanded / expandedContent, handed to ContentCard catalog. Verified in source only (no server run, by your rule).

**Remainder here:** bump kol-shell 0.9.0; swap Library onto CatalogPage with filtersProps={{ mutuallyExclusiveFilters: ['category', 'u_label'] }} and expanded / expandedContent from toCard; drop the combo → keys map in src/data/shortcuts.js

**Remainder here:** bumped (0.9.0 → 0.9.2), the `combo → keys` map dropped (`src/data/shortcuts.js` is one array, both surfaces read `combo`). Library NOT moved onto `CatalogPage`: the 2×2 expand needs its neighbours hidden and CatalogPage renders every row — carried by `CatalogPageMonitorParity`.
