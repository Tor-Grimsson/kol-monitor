# KolComponentDeepExports — subpath exports so an atom doesn't cost four peers

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/KolComponentDeepExports.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-component@0.35.0` (exports map registry-verified): subpath exports beside the barrel for all five tiers — `./atoms/*` `./molecules/*` `./organisms/*` `./utilities/*` (`.jsx`) `./hooks/*` (`.js`). **Remainder here:** none — adopted 2026-08-12: bumped to 0.37.0 (+ kol-theme 0.37.0), kol-component patch retired to `_tmp/2026-08-12-deep-exports-adoption/`, `framer-motion`/`gsap`/`hls.js`/`opentype.js` dropped, build green (main chunk 1.07MB)

## Why it went there

The exports map is `packages/component/package.json` in kol-ds-ui — nothing a
consumer can shim. Filed from this repo's DS-adoption scoping (Button swap,
5 call sites).

## What stays here

- **On ship: adopt.** Bump ≥0.35.0, swap the local Button for
  `@kolkrabbi/kol-component/atoms/Button` with the `iconComponent` seam.
