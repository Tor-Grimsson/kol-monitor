# ShortcutsOverlayList

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShortcutsOverlayList.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

`src/overlays/ShortcutsRail.jsx` (⇧S) — the side-rail version, for the user's comparison. Keep or retire on his call.

## ✅ RETURNED — 2026-10-18 · kol-shell@0.68.0

kol-shell 0.68.0 + kol-component 0.268.0: AppHub's `S` sheet is `ShortcutsOverlay` — a list, no search field, no Run footer, no Enter-to-run; `S` toggles it, Esc closes it, ⇧S is ignored. Only the current page's sections are drawn (plus sections with no `routes`) — the muted Elsewhere block is gone from `ShortcutsOverlay` and from `CommandOverlay`'s shortcuts mode. Verified in apps/hub: ⇧S no sheet; `S` open, `S` closed; Esc closes; no field, no Run.

**Remainder here:** bump kol-shell@0.68.0 + kol-component@0.268.0; keep or retire `src/overlays/ShortcutsRail.jsx` on the user's call

## Adopted here — 2026-10-18

kol-shell 0.68.0 + kol-component 0.268.0. `ShortcutsRail` (⇧S) stays until the user picks. **Remainder here:** keep or retire `ShortcutsRail` — his call.
