# OverscrollNone

**Filed:** 2026-10-22 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/OverscrollNone.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## What stays here

On return: bump kol-theme; check Home and Library don't bounce on iPhone. Nothing local to delete — Monitor never had the rule.

## ✅ RETURNED — 2026-10-22 · kol-theme@0.180.0

kol-theme 0.180.0: `html { overscroll-behavior: none; }` in `kol-base-tokens.css`, which `@kolkrabbi/kol-theme/core` and the umbrella both load — every KOL app stops rubber-banding. Also in 0.180.0: a float opened inside a float stacks above it (`--kol-float-depth`, with kol-component ≥0.285.0).

**Remainder here:** none — adopted 2026-10-22: kol-theme 0.180.0 bumped (and in `minimumReleaseAgeExclude`); the rule is in `dist/assets/*.css`. On-device check is the user's.
