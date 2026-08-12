# ComponentTailwindSourceTrap — component mechanics rode the consumer's Tailwind scanner

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/ComponentTailwindSourceTrap.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-theme@0.38.0` + `@kolkrabbi/kol-framework@0.19.0`: the roll is DS chrome now (`.kol-roll` / `.kol-roll-strip` / `.kol-roll-slot` in kol-theme), and the kol-theme README documents the `@source` contract with paste-in lines. 📌 **Remainder here:** bump both — the toggle rolls without any @source line; keep the @source lines anyway for other utility-emitting components

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
