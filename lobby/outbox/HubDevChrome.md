# HubDevChrome

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubDevChrome.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

Nothing — `/dev` is drawn by kol-shell's `HubDev`; bump when it returns.

## ✅ RETURNED — 2026-10-18 · kol-shell@0.67.0

kol-shell 0.67.0: the `code` Dev row now closes the app's own rows (after `pages`, so under Stage) and Settings keeps the bottom alone; HubDev's tabs are `TabsRow look="chip"` (the ui.kolkrabbi.io component-page tabs); no description line — a tab's `description` is no longer drawn. Verified in an AppStudio harness with a Stage page: rail Use · Stage · Dev, Settings at the foot; two chip tabs; nothing between the tabs and the content.

**Remainder here:** bump kol-shell@0.67.0; drop `description` from your dev tabs (ignored now)

## Adopted here — 2026-10-18

kol-shell 0.67.0; `src/pages/devTabs.jsx` no longer passes `description`. **Remainder here: none.**
