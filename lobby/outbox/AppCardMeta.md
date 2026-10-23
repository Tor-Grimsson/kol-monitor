# AppCardMeta

**Filed:** 2026-10-23 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppCardMeta.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## What stays here

On return: bump kol-component; Library's and the App card Dev tab's cards already pass `meta` — check it draws. Nothing local to delete.

## ✅ RETURNED — 2026-10-22 · kol-component@0.292.0

kol-component 0.292.0: the `app` card and row draw `meta` as a line under the title (date · size stay below). Pass `meta: "12 modules, 9 connections"` / `"6HP 3U — Control"` from `toCard`; without it nothing moves.

**Remainder here:** bump kol-component@0.292.0, pass `meta` from `patchCard` / `moduleCard`.
