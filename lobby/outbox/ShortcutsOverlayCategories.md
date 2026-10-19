# ShortcutsOverlayCategories

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShortcutsOverlayCategories.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

Nothing — bump when it returns. The user demos it in kol-ds-ui's `apps/` first.

## ✅ RETURNED — 2026-10-18 · kol-shell@0.69.0

kol-component 0.272.0 + kol-shell 0.69.0: AppHub's `S` opens `CommandOverlay mode="shortcuts"` again — the ⌘K modal, no search field. Rows are this page's sections (plus sections with no `routes`) under the header "Shortcuts", each with the → arrow; Enter / → / click enters one — its keys as rows, label left, combo right, never run, no footer — and the back arrow / ← / Backspace returns to the categories. `S` toggles, Esc closes, ⇧S is ignored. The demo is `apps/overlays` (`pnpm overlays`, :5201): every overlay — CommandOverlay search · go · add (drill-in) · shortcuts (scoped to /rack), ShortcutsOverlay, useModal prompt · confirm · confirm + options · alert, SettingsPanel drawer · overlay, FullscreenOverlay — on apps/controls' Specimen frame. Verified there: five categories with arrows, Enter on Rack → its five keys with a back arrow, back → categories, `S` again closes.

**Remainder here:** bump kol-component@0.272.0 + kol-shell@0.69.0 (both tarballs serve, HTTP 200)

## Adopted here — 2026-10-18

kol-component 0.272.0 + kol-shell 0.69.0. **Remainder here: none.**

## 📦 FOLLOW-UP — 2026-10-18 · kol-component@0.274.0 · kol-shell@0.70.0 · kol-theme@0.176.0

Reworked with the user in kol-ds-ui's `apps/overlays` (and the showcase's Overlays set, `/sets/overlays`). All four tarballs download (HTTP 200).

- `S` (CommandOverlay `mode="shortcuts"`) is **fold only**: categories open in place (arrow → / ↓), the page's own sections (those with `routes` that match) open on arrival, App stays folded; footer `↵ Expand/Collapse` and `⌘↵ Expand all / Collapse all`. Section headings are the rail's eyebrow.
- Fold rows work in any mode: a row with `items` is a category. `mode="go"` folded into `search` (still accepted).
- `ShortcutsOverlay` is now `SettingsPanel variant="overlay"` with a `title` prop — your ⇧S rail's sections, the × on the header line.
- `SettingsPanel variant="drawer"` is now `variant="rail"` (drawer still accepted). New `--kol-pad-overlay` (20 · 24) on Rail and both overlays.
- Quick Look's × sits at the header's far right.

**Remainder here:** bump kol-component@0.274.0 + kol-shell@0.70.0 + kol-theme@0.176.0; `src/overlays/ShortcutsRail.jsx` can go on the user's call.

**Adopted here (follow-up)** — 2026-10-18: bumped kol-component@0.274.0 + kol-shell@0.70.0 + kol-theme@0.176.0; build passes. ShortcutsRail retire = user's call.
