# HubHomeBackReveal

**Filed:** 2026-10-24 → **kol-ds-ui** · kol-shell 0.81.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubHomeBackReveal.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · 2026-10-24 · 📌 remainder here

## What stays here

On return: bump; `home={{ ...home, backReveal: 'flip-card', flipped, backHover }}` in `src/App.jsx` (or `backReveal` on each file in `HomePage.jsx` `saveFile`).

## ✅ RETURNED — 2026-10-24

🟢 `closed` in **kol-ds-ui** — **kol-shell 0.82.0** (registry live). `HubHome` takes a page-level `backReveal` (`flip-image` · `flip-card` · `hover`) passed to every Home card; a file's own `backReveal` wins. Twin: rack-hub's Home and Library pass `flip-card`; `F` turns every card whole on both.

**Remainder here:** 📌 bump kol-shell to 0.82.0; `home={{ ...home, backReveal: 'flip-card', flipped, backHover }}` in `src/App.jsx`.

## Adopted here — 2026-10-24

kol-shell 0.82.0; `home={{ ...home, backReveal: 'flip-card', flipped, backHover }}` in `src/App.jsx`. Home measures `data-back="flip-card"`, F turns every card. Remainder discharged.
