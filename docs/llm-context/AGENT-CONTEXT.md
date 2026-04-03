# Agent Context

## Current State

### Active Work
- **35 modules** (34 + Power) across control (10), math (13), generators (7), display (3), utility (2). All support `preview` prop for static rendering.
- **Sidebar**: Stacked sections (Case, Modules, Presets). MirrorSidebar-inspired styling. Zoom controls in Case section. Width: 18rem / 20rem on ≥1024px. Always visible.
- **Zoom system**: CSS `zoom` on rack container. 1HP = 16px base unit. `ROW_WIDTH = 1664px`. Zoom range 0.5–2.0. Auto-fit button.
- **Workbench**: Bottom panel with two tabs — Workbench (held modules) and Library (module catalog). Category + 1U/3U filters. Drag-to-resize. Overlaps case area. Edit mode auto-opens it.
- **Edit mode**: Click module header to send to workbench. Click in workbench to return to rack. Drag-to-reorder within rack not yet implemented.
- **Power module**: 6HP 1U rocker switch. Controls case power context. When off, all modules disabled (dots off, no processing, outputs cleared).
- **Module preview**: All modules have `___Panel` function for shared JSX. `preview` prop skips hooks, renders static panel. Used by library cards.
- **Typography tiers**: 10px (module names, jack labels), 8px (control labels, buttons), 6px (numeric readouts, tight spaces). All via `kol-helper-*` classes.
- **Rack state**: `useRackState` manages rows, modules with HP offsets, workbench, edit mode. No more parked/drag system.
- **Preset system**: Each preset defines modules + connections + initial knob state. `init` prop on modules. 22+ presets.
- **Render loop**: Centralized (Kahn's topo sort, 1-frame cycle delay). Port-based patch routing. Typed signals: scalar, color, points, pen.
- **Patch cables**: Orange wires, red jacks, signal-proportional glow. Drag-to-connect, click-to-disconnect.

### Known Issues
- Drag-to-reorder within rack not yet implemented
- Preset knob values not applied when switching between presets (useState only reads init on mount)
- Many presets untested / produce random-looking output
- No save-current-state-as-preset yet
- Console module layout needs visual polish

### Recent Changes (2026-04-03, session 17)
- **Sidebar restyle**: Stacked sections replacing 3-tab layout. MirrorSidebar-inspired. Zoom controls.
- **Zoom system**: CSS zoom, pixel-based HP grid (1HP = 16px), ROW_WIDTH = 1664px.
- **Workbench + Library**: Bottom panel with tabs, category/size filters, module preview cards.
- **Power module**: 6HP 1U rocker switch, CasePowerProvider context, render loop integration.
- **Typography tiers**: 10px/8px/6px system, all inline font styles removed from modules.
- **Module preview mode**: All 34 modules support `preview` prop via extracted Panel functions.
- **Component extraction**: RackView.jsx, Workbench.jsx extracted from VideoModulo.

### Recent Changes (2026-04-03, session 16)
- **Repo isolation**: kol-monitor split from kol-mirrors. All Hall of Mirrors code removed.
- **Flattened**: `src/videomodulo/` contents moved to `src/`.
- **Removed**: HoM code, deps (pixi.js, gsap, react-colorful), playwright, components.css.
- **Updated**: App.jsx, package.json, LLM_RULES.md, README.md, index.html.

## Project Overview

**Video Modulo** — Eurorack-inspired modular video synthesis environment. Part of the Kolkrabbi Apparat suite.

**Live:** https://kol-monitor-six.vercel.app/

### Architecture
- Single-page React app with react-router-dom (sole route: `/` → VideoModulo)
- Rack case with 1U/3U rows, HP-pixel grid (1HP = 16px, 104HP row = 1664px)
- CSS zoom scales the entire rack to fit available space
- Centralized render loop with topological sort
- Typed signal system: scalar, color, points, pen
- Port-based patch routing with drag-to-connect
- Sidebar: Case/zoom, Module catalog, Presets
- Workbench: bottom panel for module management + library browsing

### Key Files
- `src/VideoModulo.jsx` — Main layout: sidebar, rack, workbench, zoom
- `src/RackView.jsx` — Rack case rendering with module slots
- `src/Workbench.jsx` — Bottom panel: workbench + library tabs, filters
- `src/ModuloSidebar.jsx` — Left sidebar: Case, Modules, Presets sections
- `src/moduleRegistry.js` — 35 module type definitions
- `src/patches.js` — Preset patch configurations
- `src/hooks/useRackState.js` — Rack state: rows, workbench, edit mode
- `src/hooks/useModuleRegistry.jsx` — Module registration context
- `src/hooks/usePatchRouting.jsx` — Patch cable routing context
- `src/hooks/useCasePower.jsx` — Case power on/off context
- `src/hooks/useRenderLoop.js` — Centralized render loop (topo sort, power gating)
- `src/hooks/signals.js` — Signal type definitions and helpers
- `src/modules/utility/eurorack.js` — Grid constants: HP_PX=16, ROW_WIDTH=1664
- `src/modules/utility/Case.jsx` — Eurorack case + RackRow components
- `src/modules/utility/JackSocket.jsx` — 3.5mm jack socket with drag, glow
- `src/modules/utility/PatchCableOverlay.jsx` — SVG catenary patch cables
- `src/modules/utility/PowerModule.jsx` — Case power rocker switch
- `src/modules/controls/` — Knob, Fader, Dropdown, Toggle, Selector, WaveSelect, ModuleHeader
- `src/modules/display/drawSignal.js` — Signal rendering for Monitor/Output
- `src/icons/Icon.jsx` — SVG icon loader
