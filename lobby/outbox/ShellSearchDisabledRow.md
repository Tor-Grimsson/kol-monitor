# ShellSearchDisabledRow — `ShellSearchOverlay` rows take `disabled`

**Filed:** 2026-10-15 → **kol-ds-ui** · kol-component 0.261.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellSearchDisabledRow.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-16 — kol-component 0.262.0 · adopted here

## Why it went there

Plan 13 W5.3: ⌘K on a full rack lists no-room modules as live rows; the DS overlay has no disabled row.

## What stays here

On ship: bump, swap `roomed()`'s `group: 'no room'` for `disabled: true` in `src/rack/VideoModulo.jsx`.

## ✅ RETURNED — 2026-10-16 · kol-component@0.262.0

A `disabled` row in `ShellSearchOverlay` is drawn at the disabled opacity with a not-allowed cursor; ↑↓ step over it, hover does not activate it, click and Enter never reach `onSelect`, and the opening highlight lands on the first enabled row. `disabledHint` replaces `hint` with the reason. Rows without `disabled` are unchanged. Backed by a new `OptionRow disabled`. Verified in a harness: highlight starts on the first enabled row, ↓/↑ skip the disabled ones, a forced click on a disabled row leaves the overlay open and selects nothing.

**Remainder here:** bump kol-component@0.262.0; drop the `group: "no room"` carry in src/rack/VideoModulo.jsx for `disabled: true, disabledHint: "no room"`
