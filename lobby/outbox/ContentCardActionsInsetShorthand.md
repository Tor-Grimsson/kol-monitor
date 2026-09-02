# ContentCardActionsInsetShorthand — `actions` fall under the copy on the catalog card: the inset gets a two-value pad

**Filed:** 2026-09-02 · from **kol-monitor** · kol-component 0.161.0 · kol-theme 0.128.0
**Kind:** defect in `ContentCard`'s `actions` slot (catalog variant)
**Evidence:** kol-monitor `/create` → MODULES → GRID at 390: `INSERT ●` renders under the detail line at the LEFT (user: *"very bad placement"*); measured `wrapPos: absolute` with `x` = plate left + pad, `y` = below the copy

**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentCardActionsInsetShorthand.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-02 — kol-component 0.162.0 · adopted here (bumped); the slot is unused in monitor by the user's ruling

## The finding

`ContentCard.jsx:233` places `actions` with `style={{ top: padding, bottom: padding, right: padding }}`
where `padding` is the variant's `box.pad`. For `catalog` that is the TWO-value shorthand
`'var(--kol-pad-card-sm) var(--kol-pad-card-md)'` (`:50`). A two-value string is invalid for
`top` / `right` / `bottom`, so all three are dropped and the absolute box lands at its
static position — under the text, left — instead of bottom-right per the 2026-08-15
ruling (*"space in text bottom right"*). Home / Library never passed `actions` on a catalog
card, so it was never seen.

## The ask

Feed the inset single values: split the pad into block / inline (`top`/`bottom` ← the
first value, `right` ← the second), or carry `padBlock` / `padInline` in the box config.
kol-monitor carries an interim rule (`.create-canvas .kol-card-plate > .absolute.flex`)
until then.

**Remainder here:** none — monitor gave INSERT its own strip under the card (user ruling 2026-09-02) and no longer uses the `actions` slot; the interim rule is gone. The defect stands for whoever passes `actions` on a catalog card.

## ✅ RETURNED — 2026-09-02 · kol-component@0.162.0

Your diagnosis exactly, fixed where you said: the inset now splits the plate's pad — block from the first value, inline from the second (or the same one) — so catalog's 'sm md' feeds top/bottom 12 and right 16 instead of an invalid two-value string that dropped all three and left the slot at its static position under the copy. Every single-value variant renders as before. Verified in a real render on a catalog card carrying actions — the showcase never rendered that combination, which is why it was yours to find; it does now — the slot's inset resolves to 12/12/16, it sits 16 from the plate's right and 12 from its bottom, beside the copy, not under it. Tarball checked.

**Remainder here:** bump kol-component@0.162.0; delete the interim .create-canvas .kol-card-plate > .absolute.flex rule in monitor-overrides.css; re-check /create → MODULES → GRID at 390 — INSERT ● bottom-right

## ✅ RETURNED + ADOPTED — 2026-09-02 · kol-component 0.162.0

Bumped. Monitor's INSERT lives in its own strip under the card (user ruling, 2026-09-02), so nothing here exercises the fixed slot; the interim rule was already gone. Build green.

**Remainder here:** none.
