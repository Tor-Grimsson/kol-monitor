# MediaPickerCloseOnControlRow — the picker's × sits 10px above the controls beside it

**Filed:** 2026-10-16 → **kol-ds-ui** · kol-component 0.261.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MediaPickerCloseOnControlRow.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-16 — kol-component 0.262.0 · adopted here

## Why it went there

The user's screenshot: the Media picker's × floats above the bucket · lock · gear row. Cause: the header row
is `items-baseline`, and a textless `self-center` × centres on the wordmark. Measured 141 vs 151.

## What stays here

On ship: bump, and drop the `.kol-media-picker header > button:last-child` rule from `src/styles/monitor-overrides.css`.

## ✅ RETURNED — 2026-10-16 · kol-component@0.262.0

`LibraryHeader`'s × is `self-end`, not `self-center`. Measured in apps/media /picker at 1440, light and dark: × centre 151.5, gear 151; right edge = content edge (1211). The `modal` variant has no gear row — its × is the overlay sheet's own corner close, and did not move.

**Remainder here:** bump kol-component@0.262.0; drop the `.kol-media-picker header > button:last-child` override in monitor-overrides.css
