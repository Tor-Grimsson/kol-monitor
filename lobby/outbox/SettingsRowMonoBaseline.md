# SettingsRowMonoBaseline

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsRowMonoBaseline.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

`src/overlays/ShortcutsRail.jsx` — the combo span (`kol-mono-12 text-fg-80`) re-matches the new label on return.

## ✅ RETURNED — 2026-10-18 · kol-component@0.269.0

kol-component 0.269.0: `SettingsRow text` (and `LabeledControl inline text`, `text` on a `SettingsSections` row) — a row whose value is text: the label sets in `kol-mono-12` at `text-fg-80` (the value's ink, not `text-meta`), label and value sit on one baseline (`items-baseline`), and the value cell is a flex box so the inherited line-height strut is gone. Opt-in — switch and dropdown rows are unchanged. Measured in apps/hub at 328px: `text` row 16px (was 24), label and value text bottoms equal, both inks 0.8.

**Remainder here:** bump kol-component@0.269.0; pass `text` on `src/overlays/ShortcutsRail.jsx`'s `SettingsRow`s

## Adopted here — 2026-10-18

kol-component 0.269.0; `ShortcutsRail`'s rows pass `text`. **Remainder here: none.**
