# ContentFiltersFirstGroupFixedWidth — the first filter group is one catalog column wide, not a hug

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentFiltersFirstGroupFixedWidth.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — kol-component 0.111.0 · kol-theme 0.73.0, 2026-08-27

## Why it went there

`ContentFilters` (0.104.3, `ContentFiltersFirstGroupHugs`) sizes the first
group to its longest chip — 78px on Home, 92px on kol-website `/work` — so the
flowing groups start at a different x on every surface. User ruling
2026-08-27: not hug, a set width — **one catalog column** (`1fr` of the 6-col
grid, gap 24), so TYPE sits over the first card. The column is the component's;
a consumer cannot reach the grid width from inside the filter row (the strip
narrows it), so the interim here is a plain 160.

## What stays here

- `className: 'w-40'` (160, the reachable interim) on the first group of every
  `filterGroups` — Home (`TYPE`), Library (`Category` · `Tags`), Create —
  **drop on the bump.**
- The LLM_RULES bulletin entry (2026-08-27) — the announcement the user asked
  for; it ages out on its own.

---

## ✅ RETURNED — 2026-08-27 · kol-component 0.111.0 · kol-theme 0.73.0

🟢 `closed` in **kol-ds-ui** — The first filter group wears `.kol-filters-first` — `calc((100cqw − 120px) / 6)`, the `1fr` of `repeat(6, 1fr)` gap 24 — measured on the header row (`.kol-filters-row`, `container-type: inline-size`) so the count/strip beside the groups never narrows it; it sits over the first card and the flowing groups start over the second. A page without a 6-column catalog gets the same fraction of its own row. Components layer — `group.className` still wins on width; `stack: false` on the first still makes it flow. Doc paragraph + JSDoc say one catalog column, not hug. 21 gates clean; verified in source only (no server run, by your rule).

**Remainder here:** bump kol-component 0.111.0 · kol-theme 0.73.0; drop `className: 'w-40'` from the first group of every `filterGroups` (Home · Library ×2 · Create).

**Remainder here:** none — adopted 2026-08-27: bumped kol-component 0.113.0 · kol-theme 0.74.0; the `w-40` interim dropped from every first filter group (Home `Type`, Library `Category` + `Tags`, Create `Category`) — the column is `.kol-filters-first` in kol-theme now, `(100cqw − 120px) / 6` on `.kol-filters-row`. Build green. Visual check the user's.
