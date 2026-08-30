# CatalogPageCardFit — `CatalogPage` hardcodes `fit="cover"`; a rack preview needs `natural`

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CatalogPageCardFit.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-27 — kol-shell 0.9.2; answer superseded

## Why it went there

`CatalogPage.jsx:97` renders every card `fit="cover"` with no seam; monitor's
preset previews are wider than the card and lose their modules to the crop.
`ContentMedia` has `natural`; the page never lets a consumer pick it.

## What stays here

- `src/styles/monitor-overrides.css` — GridCard's two preview rules verbatim
  (`scale(0.5)` / `scale(0.3)`, top-left, clipped) on `.preview-natural` /
  `.preview-compact` (`ContentCard className`, Library + Create) and
  `.home-catalog` (Home's `CatalogPage`). **On ship:** cards take the DS fit,
  Home's `toCard` returns it, delete the rules + hooks.

## ✅ RETURNED — 2026-08-27 · kol-shell 0.9.2

toCard may return fit (cover default | natural | compact), handed to ContentCard per card — same shape as expanded / expandedContent. Verified in source only (no server run, by your rule).

**Remainder here:** bump kol-shell 0.9.2; return fit: 'natural' from toCard for the rack previews; drop the .home-catalog .kol-card img override

**Remainder here:** bumped to 0.9.2; `fit: 'natural'` NOT adopted — it is contain, which the user rejected against the original. The override rules stay; the corrected ask is `CatalogPageMonitorParity`.
