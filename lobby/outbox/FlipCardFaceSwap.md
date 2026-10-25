# FlipCardFaceSwap

**Filed:** 2026-10-24 → **kol-ds-ui** · kol-hardware (installed)
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FlipCardFaceSwap.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · 2026-10-24 · 📌 remainder here

## What stays here

`src/pages/dev/CardFlipPage.jsx` carries a local `Flip` (plain backface 3D). On return: bump, swap it for `FlipCard`, re-check the turn on /dev → Card flip.

## ✅ RETURNED — 2026-10-24

🟢 `closed` in **kol-ds-ui** — **kol-hardware 0.7.0** (registry live). `FlipCard` swaps faces by backface: both faces `backface-visibility: hidden` (`-webkit-` too), the back pre-rotated 180° in the preserve-3d turner, no timed `visibility`; the face that is away is `inert` and aria-hidden. Walked: no face hidden at any sample through the turn, the back hit from edge-on (~142ms of 450).

**Remainder here:** 📌 bump kol-hardware to 0.7.0; swap the dev tab's local `Flip` for `FlipCard`; re-check /dev → Card flip.

## Adopted here — 2026-10-24

Bumped kol-component 0.301.0 · kol-theme 0.189.0 · kol-shell 0.81.0 · kol-hardware 0.7.0 · kol-framework 0.55.0. See playbook `2026-10-24-plan-16.md`. Remainder discharged.
