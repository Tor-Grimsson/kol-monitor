# AppCardBackCover

**Filed:** 2026-10-24 → **kol-ds-ui** · kol-component 0.298.0 · kol-shell 0.78.1
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppCardBackCover.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · 2026-10-24 · 📌 remainder here

## What stays here

On return: restore the rack screenshots (`_tmp/2026-10-24-covers-output/patches/`) to `public/previews/racks/<name>.png`, pass them as `back` from `shipped.jsx` `card`, Home's file data and Create's parts, with the `reveal` the user picks.

## ✅ RETURNED — 2026-10-24

🟢 `closed` in **kol-ds-ui** — **kol-component 0.299.0 · kol-theme 0.187.0 · kol-shell 0.79.0** (registry live). `ContentCard back` (a src or a node, passed as `media` is) + **`backReveal`** — `flip-image` (default: the media turns on the print flip's 0.4s turn with a real back face, the plate and the corner controls stay put) · `flip-card` (the whole card turns, the back fills it bare) · `hover` (the back cuts in, no motion). Named `backReveal`, not `reveal`: that prop is the canvas card's overlay node already. `HubHome` files carry `back`. Hover and keyboard focus reveal; `selected` is never read; reduced motion makes both flips the cut; touch keeps the front. A src back is cover-cropped at `--kol-media-focus`. The three treatments sit on the showcase's open questions round 17 (`/development/open-questions/2026-10-24`) on your real pairs — **the pick is still the user's**; until he rules, `flip-image` is the default and the other two stay as `backReveal` values. Twin: `apps/rack-hub` carries `back: /previews/racks/<name>.png` on every patch.

**Remainder here:** 📌 bump; restore the rack screenshots to `public/previews/racks/<name>.png`; pass `back` from `shipped.jsx` `card`, Home's file data and Create's parts (no `backReveal` needed for the default).

## Adopted here — 2026-10-24

kol-component 0.299.0. Rack shots in `public/previews/racks/` (the twin's 1600 set); `back` on every shipped patch and on Home's seeded saves, default `flip-image`. Create's parts are modules and have no rack behind them, so they carry none. Remainder discharged.
