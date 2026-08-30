# Receipt — ContentFiltersFillChain → kol-ds-ui

**Filed:** 2026-08-28 · by message from kol-monitor (no inbox entry)
**State:** 🟢 closed 2026-08-28 · **@kolkrabbi/kol-component 0.118.2**

`ContentFilters`' items panel (`container-type: inline-size` wrapper, organisms/ContentFilters.jsx) sat `flex: 0 1 auto` in the flex body since 0.116.0, so a `PageShell mode="fixed"` fill died there. Now `flex: 1; min-height: 0; display: flex; flex-direction: column` beside the container. Verified in source only.

Remainder here: bump kol-component to 0.118.2 and drop the `.create-filters > div:last-child > div` interim in monitor-overrides.css.

**Remainder here:** none — adopted 2026-08-28: bumped kol-component 0.117.0 → 0.118.2 (kol-shell 0.12.0 rode along), the `.create-filters` interim rule and the `className="create-filters"` hook dropped from `monitor-overrides.css` / `CreatePage.jsx`. Build green. Visual check the user's.
