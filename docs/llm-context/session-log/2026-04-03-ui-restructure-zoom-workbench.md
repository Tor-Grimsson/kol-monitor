# Session: UI Restructure — Sidebar, Zoom, Workbench, Typography, Preview

**Date:** 2026-04-03
**Agent:** Claude Code (Opus 4.6)
**Summary:** Major UI restructure — sidebar restyled, zoom system, HP-pixel grid, workbench with library, typography tiers, module preview mode.

## Changes Made

### Sidebar Restyle
- `src/ModuloSidebar.jsx` — Removed 3-tab layout, replaced with stacked sections (Case, Modules, Presets) matching MirrorSidebar style. Sidebar width: 18rem default, 20rem on ≥1024px (via `src/index.css`). Zoom controls in Case section: `[−] input% [+]`.
- Removed sidebar toggle button — sidebar is always visible.

### Zoom System
- `src/VideoModulo.jsx` — CSS `zoom` on rack container. `BASE_WIDTH` derived from `ROW_WIDTH + 52`. Auto-fit via sidebar button. Zoom range 0.5–2.0.
- `src/index.css` — `.sidebar-width` class with CSS variable `--sidebar-width`.

### HP-Pixel Grid
- `src/modules/utility/eurorack.js` — `HP_PX = 16` (1HP = 16px). All module widths now `hp * 16` (round numbers). `ROW_WIDTH = 1664px`. Removed percentage-based `hpToPercent`.
- `src/modules/utility/Case.jsx` — Rows use `ROW_WIDTH` instead of `width: 100%`. Removed `maxWidth: 1400`. Rail slots use `HP_PX` width.
- `src/RackView.jsx` — Extracted from VideoModulo. Module widths use `hpToPx(mod.hp)`.

### Workbench + Library
- `src/Workbench.jsx` — Bottom panel with two tabs: Workbench (held modules) and Library (module catalog). Category filters (All, Control, Math, Generators, Display, Utility) and 1U/3U size filters on left side. Drag-to-resize height. Overlaps case area (absolute positioned). Blank placeholder panel when workbench is empty.
- `src/hooks/useRackState.js` — Replaced parked modules with workbench system. `sendToWorkbench(moduleId)`, `returnFromWorkbench(moduleId)`. Removed `removeModule`, `unparkModule`, `deleteModule`, `moveModule`, `moveParked`.
- Edit mode now shows workbench automatically (even when empty).

### Power Module
- `src/modules/utility/PowerModule.jsx` — 6HP 1U rocker switch. Controls `CasePowerProvider` context.
- `src/hooks/useCasePower.jsx` — Case power context. When off, all module headers show disabled dot.
- `src/hooks/useRenderLoop.js` — Skips all `process()` calls and clears outputs when power is off.
- `src/modules/controls/ModuleHeader.jsx` — Reads case power context, shows disabled when case is off.

### Typography Tiers
- `src/styles/kol-typography-mono.css` — Added `kol-helper-xxxxs` (6px).
- Three-tier system applied across all modules:
  - **10px** (`kol-helper-xxs`) — Module names (ModuleHeader), jack labels (JackSocket)
  - **8px** (`kol-helper-xxxs`) — Control labels (Knob, Fader, Toggle, Selector, Dropdown), buttons, sequencer page, console channel names
  - **6px** (`kol-helper-xxxxs`) — Numeric value readouts (Knob value, Fader value), cable count, power rocker marks
- All inline `fontSize`/`fontFamily`/`fontWeight` removed from module controls.

### Module Preview Mode
- All 34 modules now support `preview` prop. Each module has an extracted `___Panel` function for shared JSX. When `preview=true`, returns static panel with default values, no hooks called.
- Library cards in Workbench pass `preview` prop — modules render as static front panels.

### Component Extraction
- `src/RackView.jsx` — Rack case rendering extracted from VideoModulo.
- `src/Workbench.jsx` — Bottom panel extracted as standalone component.

## Current State

### Working
- 35 modules (34 + Power) with preview mode
- Sidebar: Case (rows + zoom), Modules (catalog), Presets (patches)
- Zoom system with pixel-based HP grid (1HP = 16px)
- Workbench: click module header in edit mode to send to workbench, click in workbench to return
- Library: browse modules by category and size, click to add to rack
- Case power on/off via rocker switch module
- Patch cables, render loop, presets all functional

### Known Issues
- Drag-to-reorder within rack not yet implemented (edit mode only does click-to-workbench)
- Preset knob values not applied when switching between presets (useState only reads init on mount)
- Many presets untested
- No save-current-state-as-preset yet

## Next Steps
1. Drag-to-reorder modules within rack rows
2. Visual polish on workbench/library panel
3. Module search/filter in library (future)
