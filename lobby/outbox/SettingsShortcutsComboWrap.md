# SettingsShortcutsComboWrap — a three-character combo wraps in the six-column grid

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsShortcutsComboWrap.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-27 — kol-shell 0.9.1

## Why it went there

`SettingsShortcuts`' combo cell squeezes to min-content in the 6 × 2 grid, so
`⌘ K`, `+ / −` and `1–9` break across lines (seen rendering on `/settings`).
The cell is kol-shell's; a consumer can only paper over it.

## What stays here

- `SettingsPage` passes `comboLabel={(c) => <span style={{ whiteSpace: 'nowrap' }}>{c}</span>}`
  — drop it on the bump that fixes the cell.

## ✅ RETURNED — 2026-08-27 · kol-shell 0.9.1

SettingsShortcuts' combo cell is whitespace-nowrap; LabelRow's label keeps its 160 but yields (flex 0 1 160px, min-width 0) and truncates when the row is squeezed — the label is the prose, the combo the datum. 6 × 2 untouched. Verified in source only (no server run, by your rule).

**Remainder here:** bump kol-shell 0.9.1; drop the nowrap comboLabel

**Remainder here:** none — adopted 2026-08-27: on kol-shell 0.10.0 (the combo cell is `whitespace-nowrap` in the shipped source), the nowrap `comboLabel` dropped from `SettingsPage`. Visual check the user's.
