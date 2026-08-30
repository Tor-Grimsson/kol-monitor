# ComponentSideEffectsField — barrel unshakeable without the manifest flag

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ComponentSideEffectsField.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-15 — component 0.39.0

## Why it went there

kol-component ships no `sideEffects` field → bundlers can't tree-shake the
barrel → kol-shell 0.1.0's internal barrel imports ballooned this repo's main
chunk 1.09→6.7MB during adoption. The field is the package's to declare.

## What stays here

- `patches/@kolkrabbi__kol-component@0.38.0.patch` (adds `"sideEffects": false`,
  measured back to 1.1MB) — **retire on the upstream ship + bump.**

## Return — 🟢 2026-08-15

Shipped in **`@kolkrabbi/kol-component@0.39.0`** (registry-verified —
`npm view @kolkrabbi/kol-component@0.39.0 sideEffects` returns `false`).

Declared only after verifying it true rather than on the ticket's word: **zero**
`import '*.css'` statements anywhere in `packages/component/src/`, and no module
does work at import time. kol-theme and kol-framework already carried the field,
so kol-component was the odd one out.

It rode the same publish as an unrelated MediaLibrary widening, which is why the
version is a minor (0.38.0 → 0.39.0) rather than a patch. Nothing in that other
change touches the shell set.

**Remainder here:** none — adopted 2026-08-15: bumped to 0.40.0 (flag verified
`false` on the registry there too; 0.40.0 adds only Avatar `src` + the
MediaLibrary `accept` widening, neither touches the shell). Patch retired to
`_tmp/2026-08-15-sideeffects-patch-retired/`, build green, main chunk 1.1MB
unpatched.
