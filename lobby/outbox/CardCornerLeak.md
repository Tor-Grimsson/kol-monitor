# Receipt — CardCornerLeak → kol-ds-ui

**Filed:** 2026-08-28 · by message from kol-monitor (no inbox entry)
**State:** 🟢 closed 2026-08-28 · **@kolkrabbi/kol-theme 0.79.1**

`.kol-card` rest rule (kol-components-molecules.css) now carries `background-clip: padding-box` — the translucent fill no longer paints under the translucent border, so nothing bleeds through at the corner arc. Hover step untouched. Verified in source only.

Remainder here: bump kol-theme to 0.79.1 and drop the unlayered `.kol-card` override in monitor-overrides.css.

**Remainder here:** none — adopted 2026-08-28: bumped kol-theme 0.78.1 → 0.79.1 (`.kol-card { background-clip: padding-box }` confirmed in the shipped molecules CSS), the unlayered `.kol-card` override dropped from `monitor-overrides.css`. 0.79.0 rode along (ColumnBrowser grab pill — nothing monitor renders). Build green. Visual check the user's.
