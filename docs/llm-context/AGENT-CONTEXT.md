# Agent Context

## Current State

### Active Work
- **36 modules** (35 + Scope). All support `preview` prop. Header managed by Module wrapper with `u` prop.
- **1U modules complete**: Power, Mult, Noise Tools, Attenuverter, VCA, Logic, Comparator, Switch, Ring Mod, Reverb, Ramp, Scope, Patch — all redesigned with consistent layouts, CV inputs, LabeledJack.
- **Layout components**: ModuleLayout (3u/1u/1u-stacked), ModuleControls, ModuleJacks, ModuleRow.
- **Controls**: Knob (col/row-left/row-right), FlipToggle (vertical/horizontal), LED, LabeledJack (top/bottom/left/right), Toggle (vertical/horizontal), Fader, Dropdown, Selector, WaveSelect, RampSelect, LogicSelect.
- **Design page**: `/design` for visual prototyping. Noise Tools + Quadratt mockups.
- **Zoom + pan**: CSS zoom, spacebar+drag to pan. 1HP=16px, ROW_WIDTH=1664px.
- **Workbench**: Fixed bottom panel, Library + Workbench tabs, category/size filters.
- **Reverb**: Full signal processing (scalar/color/points), 12 taps, mix/freeze/src/byp controls.

### Default Rack Layout
- **Row 1 (1U)**: Power, Mult, Noise, Atten, VCA, Logic, Comparator
- **Row 2 (3U)**: Clock, Clk Div, LFO, Envelope, Sequencer, Constant, Pen, Quantizer, Scale/Ofs, Maths, Mixer
- **Row 3 (3U)**: Waveform, RGB Osc, Wireframe, SMX3, LineGen, Waveshaper, Delay, Monitor, Output
- **Row 4 (1U)**: Patch, Switch, Ring, Reverb, Ramp, Scope

### Known Issues
- 3U modules not yet redesigned with layout components/LabeledJack
- Preset knob values not applied on switch (useState reads init on mount only)
- Drag-to-reorder within rack not implemented
- Some dividers may need padding after default removal

### Recent Changes (2026-04-04, session 19)
- All 1U modules redesigned with consistent layouts and CV inputs
- New ScopeModule (16HP 1U) — oscilloscope with pass-through
- Reverb: full signal processing, 12 taps, mix/freeze/src/byp
- New controls: RampSelect, LogicSelect
- New SVG icons: ramp-up/down/tri, logic-and/or/xor/not/nand/nor
- LabeledJack: left/right label positions added
- Toggle: gap increased to 4px
- Divider: default padding removed, added per-use
- Dropdown: capitalize transform

### Recent Changes (2026-04-03, sessions 16-18)
- Repo isolation, flattened src, zoom system, workbench, typography tiers, preview mode, design page, Noise Tools, Attenuverter, Mult redesigns

## Project Overview

**Video Modulo** — Eurorack-inspired modular video synthesis environment.

**Live:** https://kol-monitor-six.vercel.app/

### Key Files
- `src/VideoModulo.jsx` — Main layout: sidebar, rack, workbench, zoom, pan
- `src/RackView.jsx` — Rack case rendering
- `src/Workbench.jsx` — Bottom panel: workbench + library
- `src/ModuloSidebar.jsx` — Left sidebar
- `src/pages/ModuleDesign.jsx` — Visual prototyping at /design
- `src/moduleRegistry.js` — 36 module definitions
- `src/hooks/useRackState.js` — Rack state: rows, workbench, edit mode
- `src/hooks/useRenderLoop.js` — Render loop (topo sort, power gating)
- `src/hooks/signals.js` — Signal types: scalar, color, points, pen
- `src/modules/utility/Module.jsx` — Module wrapper: header, u prop
- `src/modules/utility/ModuleLayout.jsx` — Layout variants + ModuleControls/Jacks/Row
- `src/modules/utility/eurorack.js` — HP_PX=16, ROW_WIDTH=1664
- `src/modules/utility/JackSocket.jsx` — Jack with bg, labelSize props
- `src/modules/controls/LabeledJack.jsx` — Jack + label (top/bottom/left/right)
- `src/modules/controls/` — Knob, Fader, Dropdown, Toggle, FlipToggle, LED, Selector, WaveSelect, RampSelect, LogicSelect, ModuleHeader
- `src/components/atoms/Divider.jsx` — Divider (no default padding)
- `src/components/icons/Icon.jsx` — SVG icon loader (caret-down/right for I/O grids)
- `src/icons/Icon.jsx` — Module icon loader (wave/ramp/logic SVGs)
