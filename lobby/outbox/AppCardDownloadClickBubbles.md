# AppCardDownloadClickBubbles

**Filed:** 2026-10-23 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppCardDownloadClickBubbles.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## What stays here

On return: bump kol-component; drop the `e?.stopPropagation()` carry in `src/pages/HomePage.jsx`'s `download`; re-check that a download on Home stays on Home.

## ✅ RETURNED — 2026-10-22 · kol-component@0.294.0

kol-component 0.294.0: the `app` card’s download stops its click — the card’s `onClick` no longer fires under it.

**Remainder here:** bump kol-component@0.294.0, delete the `e?.stopPropagation()` carry in `src/pages/HomePage.jsx`.

kol-component 0.294.0; the `e?.stopPropagation()` carry is gone from `src/pages/HomePage.jsx` — a download on Home stays on Home (browser-checked). **Remainder here: none.**
