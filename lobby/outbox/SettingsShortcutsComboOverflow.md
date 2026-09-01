# SettingsShortcutsComboOverflow — nowrap combo paints over the next column

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsShortcutsComboOverflow.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-09-01

## Why it went there

`⌥ then 1–5` in the shortcuts sheet's 176px APP column runs past its edge and
renders under STAGE's `SHOW / HIDE MODULES` (both at x 272–330 at 1440 —
`_tmp/2026-09-01-mobile-qa/qa-settings-1440.png`). The combo cell is
`whitespace-nowrap` by the DS's own `SettingsShortcutsComboWrap` fix — wrap
traded for overlap on the first long combo. The grid is the DS's; the string
is a legitimate combo shape from the rail's own prefix gesture.

**Remainder here:** bump on ship; re-check the APP column beside STAGE. No
carry — the combo string stays as authored.

## ✅ RETURNED — 2026-09-01 · kol-shell@0.33.0

The label yields for real now. The actual geometry: SettingsRow's fixed 160px label inside your ~176px grid columns left the combo cell 4px — every combo has been painting into the 48px column gap since the block shipped, and ⌥ then 1–5 was just the first to cross it. LabeledControl (kol-component 0.151.0) takes labelWidth="auto" — label flexes and truncates, combo hugs shrink-proof, an over-long combo clips at its own column edge — and SettingsShortcuts passes it. Combos keep nowrap: one token by nature, the 08-27 ruling stands.

**Remainder here:** bump kol-shell@0.33.0 + kol-component@0.151.0; re-check the shortcuts sheet at 1440 — no cell over a neighbour, labels ellipsise

## ✅ RETURNED + ADOPTED — 2026-09-01 · kol-shell 0.33.0 + kol-component 0.151.0

The real geometry was SettingsRow's fixed 160px label inside a 176px column —
4px left for the combo. `labelWidth="auto"` lands: label yields and truncates,
combo hugs its edge. **Measured here at 1440**: combo right edge = 272 (the
column edge exactly), STAGE's label starts at 320, overlap false. Build green.

**Remainder here: none.**
