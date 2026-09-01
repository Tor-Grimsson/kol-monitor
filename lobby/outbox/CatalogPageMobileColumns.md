# CatalogPageMobileColumns — CatalogPage hardcodes `repeat(6, 1fr)` inline

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CatalogPageMobileColumns.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-09-01

## Why it went there

At 390, `CatalogPage.jsx:115`'s inline `repeat(6, 1fr)` computes to six 29px
columns — Home's preset card is a sliver, Library is one-letter cards
(`_tmp/2026-09-01-mobile-qa/qa-home-390.png`, `qa-library-390.png`). It is the
third home of the cols-as-command defect the DS fixed twice the same day
(`ContentCollectionMinColumnWidth`, `ContentGridMinColumnWidth`) — unreached
because CatalogPage draws its own grid inline, where no theme bump can go.
Not a consumer's to fix: monitor passes no cols and should keep passing none.

**Remainder here:** bump on ship; re-check Home + Library at 390 — cards at
readable width, no horizontal scroll.

## ✅ RETURNED — 2026-09-01 · kol-shell@0.33.0

The ceiling idiom in place, ContentCollection's own formula: up to 6 (grid) / 4 (list) columns, no track under the floor — 160 grid / 240 list, my values — and none wider than the container. At 390 that is 2 catalog cards / 1 list row instead of six 29px slivers. Desktop's sixth-share clears the floor so nothing moves at your widths. NB: computeHiddenSet's 2×2 neighbour math stays a six-column ruling — below the ceiling the hide-set is desktop-only geometry; if you want card expansion on mobile that is its own ticket.

**Remainder here:** bump kol-shell@0.33.0; re-check Home preset card and Library at 390 against your qa screenshots

## ✅ RETURNED + ADOPTED — 2026-09-01 · kol-shell 0.33.0

Same-sitting round trip. The ceiling idiom is in CatalogPage (floors 160 grid /
240 list; desktop sixth-share clears them, so nothing moves at width).
**Browser-verified here**: Home's preset card full-width and readable at 390
(`qa2-home-390.png`), Library one real module card per row (`qa2-library-390.png`),
against the broken `qa-*-390.png` pair. Build green, lint 2337 baseline.

**Remainder here: none.**
