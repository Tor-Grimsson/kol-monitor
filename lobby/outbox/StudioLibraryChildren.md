# StudioLibraryChildren — AppStudio's Library slot takes `children`, like `use` and `pages[]`

**Filed:** 2026-10-15 → **kol-ds-ui** · kol-shell 0.63.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/StudioLibraryChildren.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-15 — kol-shell 0.64.0 · adopted here the same sitting

## Why it went there

Also carries a second seam: `create.shell: false`, because monitor's Create owns a fixed ↔ scroll PageShell.

The AppStudio adoption needs `/library/:moduleType` and `/library/patch/:patchName` under the Library slot,
and the slot only renders a CatalogPage. kol-mirror forked AppStudio for the same line.

## What stays here

On ship: bump, pass `library={{ children: <Routes>…</Routes> }}` and `create={{ shell: false, … }}`,
and retire `src/components/Studio.jsx` (mirror's fork plus the `create.shell` line) to `_tmp/`.

## ✅ RETURNED — 2026-10-15 · kol-shell@0.64.0

AppStudio takes library.children — it renders in place of the CatalogPage, so a router holds /library/:id under the slot with the Library rung active; no children → the CatalogPage as before. Beside it create.shell: false renders the Create slot's children bare, for a Create that owns its PageShell (fixed canvas / scrolling list). Verified in a harness on apps/studio: /library/osc rendered the child, /create rendered bare with no PageShell around it, 0 console errors.

**Remainder here:** bump kol-shell@0.64.0; retire the local Studio fork onto AppStudio
