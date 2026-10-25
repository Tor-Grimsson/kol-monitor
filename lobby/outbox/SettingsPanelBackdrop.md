# SettingsPanelBackdrop

**Filed:** 2026-10-24 → **kol-ds-ui** · kol-component 0.298.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsPanelBackdrop.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · 2026-10-24 · 📌 remainder here

## What stays here

Adopted 2026-10-24 (kol-component 0.299.0): every page Rail is `SettingsPanel variant="rail" backdrop={false}`; the carry `PageRail.jsx` → `_tmp/2026-10-24-plan16/retired/`.

## ✅ RETURNED — 2026-10-24

🟢 `closed` in **kol-ds-ui** — **kol-component 0.299.0** (registry live). `SettingsPanel` forwards `backdrop` (default `true`) and `mode` (`over` · `push`) to its `Rail` on the rail variant; `backdrop={false}` is the Rail's own no-scrim setup — no scrim, no scroll lock, no focus trap. The default and the overlay variant are unchanged.

**Remainder here:** 📌 bump; every `PageRail` importer → `SettingsPanel variant="rail" backdrop={false}`; retire `PageRail.jsx` to `_tmp/`.

## Adopted here — 2026-10-24

kol-component 0.299.0. The rack's `H` Rail, the patch table and the stage's settings are `SettingsPanel variant="rail" backdrop={false}`; `src/components/PageRail.jsx` → `_tmp/2026-10-24-plan16/retired/`. Remainder discharged.
