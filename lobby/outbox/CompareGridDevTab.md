# CompareGridDevTab

**Filed:** 2026-10-17 → **kol-ds-ui** · kol-component 0.264.0 · kol-shell 0.64.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CompareGridDevTab.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` · synced 2026-10-17

## What stays here

Plan 14 (`.kol/llm-plan/14-dev-tab-shortcuts-workbench.md`) adopts it once it ships.

## ✅ RETURNED — 2026-10-17 · kol-component@0.265.0

`IconPlate` (the box is the size; ground, keyline guide, glyph in one square) and `CompareGrid` in kol-component 0.265.0: A beside B, each side named by `labels`, the 16px real size beside each name, the item name + a state chip under the pair; the toolbar is controls (size 24 · 48 · 96 · 128, ground, guide, a filter by your own states with counts); a missing side is an empty plate with its `candidate`. Verified on monitor's own 116 (110 redrawn · 5 missing · 1 same) at 96 with the guide on. The dev page is kol-shell 0.65.0 `HubDev`: `AppHub` / `AppStudio` `dev={{ tabs: [{ value, label, description, content }] }}` → `/dev` behind a `code` row above Settings, a dev server only, absent from a production build; tabs on their own row with one line each, content full width, the open tab remembered. Monitor supplied the content, not the layout. Documented in 16-app-anatomy.md (Hub and Studio tables).

**Remainder here:** bump kol-component@0.265.0 + kol-shell@0.65.0; move the Dev tab onto `dev={{ tabs }}` (drop the hand-built /dev route and rail row) and the Icons tab onto `CompareGrid` (`a`: your local icon, `b`: kol-icons, `state`: same · redrawn · missing, `candidate`: the mapped name); retire IconsDiff/DividerDiff layouts
