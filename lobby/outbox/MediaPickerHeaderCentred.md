# MediaPickerHeaderCentred — the picker header row centres on the wordmark (supersedes MediaPickerCloseOnControlRow)

**Filed:** 2026-10-16 → **kol-ds-ui** · kol-component 0.262.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MediaPickerHeaderCentred.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-16 — kol-component 0.263.0 · adopted here

## Why it went there

The earlier ask (`self-end` on the ×) was wrong; the user's lines showed the whole row hanging below the wordmark.

## What stays here

On ship: bump, and drop `.kol-media-picker header { align-items: center }` from `src/styles/monitor-overrides.css`.

## ✅ RETURNED — 2026-10-16 · kol-component@0.263.0

`LibraryHeader`'s `<header>` is `items-center`, and the × drops `self-end` — it centres with the row. Measured in apps/media /picker at 1440, light and dark: wordmark cap middle 139.1, gear and × 140.5, dropdown 141; × right edge = content edge. The full-page library header (apps/media /) centres the same way: cap middle 70.6, trash and gear 72.

**Remainder here:** bump kol-component@0.263.0; drop the `.kol-media-picker header { align-items: center }` override
