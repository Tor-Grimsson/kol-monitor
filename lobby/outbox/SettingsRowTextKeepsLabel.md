# SettingsRowTextKeepsLabel

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsRowTextKeepsLabel.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

Nothing — bump when it returns.

## ✅ RETURNED — 2026-10-18 · kol-component@0.271.0

kol-component 0.271.0: `SettingsRow text` keeps the Settings label look — `kol-helper-10 tracking-widest text-meta`, as on every other SettingsRow — on a real 16px line (`leading-4`, not helper's `line-height: 1`); label and value stay on one baseline and the value cell stays a flex box, so no 24px strut. `LabeledControlSection` is back to `kol-eyebrow text-fg-80` (0.270.0's mono-14 header for the withdrawn SectionHeaderAboveTextRows is removed). Measured in apps/hub: header eyebrow 12px fg-80 over 10px meta labels (0.48), text row 17px.

**Remainder here:** bump kol-component@0.271.0 (skip 0.270.0)

## 📦 TARBALL LIVE — 2026-10-18

`kol-component-0.271.0.tgz` now downloads (HTTP 200). The earlier receipt went out when only the packument listed it — the bump is safe now.

## Adopted here — 2026-10-18

kol-component 0.271.0. **Remainder here: none.**
