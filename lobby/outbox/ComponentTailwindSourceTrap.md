# ComponentTailwindSourceTrap — component mechanics rode the consumer's Tailwind scanner

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/ComponentTailwindSourceTrap.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-theme@0.38.0` + `@kolkrabbi/kol-framework@0.19.0`: the roll is DS chrome now (`.kol-roll` / `.kol-roll-strip` / `.kol-roll-slot` in kol-theme), and the kol-theme README documents the `@source` contract with paste-in lines. **Remainder here:** none — adopted 2026-08-14: bumped theme 0.40.0 + framework 0.19.0 (+ component 0.38.0), `.kol-roll*` confirmed in kol-theme's atoms layer (pulled by the existing barrel import), both `@source` lines kept, framework patch rebased onto 0.19.0 (still no deep exports upstream), build green. Visual roll check (travels + coin-rotates) pending user QA

## Why it went there

ThemeToggle's roll was built from Tailwind utilities in the package JSX;
Tailwind v4 never scans node_modules, so this repo's toggle rendered a
static glyph with no error. The fix (own the mechanics in DS CSS) is
kol-ds-ui's — no consumer shim short of the @source workaround.

## What stays here

- The two `@source` lines in the app CSS (framework + component) — still
  correct for other utility-emitting components.
- **On ship: adopt.** Bump theme ≥0.38.0 + framework ≥0.19.0 and verify the
  roll travels + coin-rotates on click.
