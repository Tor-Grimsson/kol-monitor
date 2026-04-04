# Agent Context

## Current State

### Active Work
- **37 modules**. All support `preview` prop. Header managed by Module wrapper with `u` prop. All use LabeledJack.
- **IconSelect** — single reusable icon button grid for all type selectors.
- **Knob** — variants: column, row-left, row-right. `bipolar` prop for `-/+` marker.
- **Controls**: Knob, FlipToggle (v/h), LED (multi-color), LabeledJack (top/bottom/left/right), Toggle (v/h), Fader (no value readout), Dropdown, IconSelect, Selector, ModuleHeader.
- **Layout components**: ModuleLayout (3u/1u/1u-stacked), ModuleControls, ModuleJacks, ModuleRow.
- **Design page**: `/design` for visual prototyping.
- **Zoom + pan**: CSS zoom, spacebar+drag to pan. 1HP=16px, ROW_WIDTH=1664px.
- **Workbench**: Fixed bottom panel, Library + Workbench tabs, category/size filters.

### Module Summary

**1U**: Power (6), Mult (8), Noise Tools (22), Attenuverter (26), VCA (8), Logic (8), Comparator (6), Switch (10), Ring Mod (6), Reverb (10), Ramp (6), Scope (16), Patch (6), Constant (4), Quantizer (4), Scale/Ofs (4), S&H (6)

**3U**: Clock (4), ClockDiv (4), LFO (6), Envelope (6), Sequencer (12), Pen (6), Mixer (6), Maths (20), Filter (6), Transform (6), Waveform (6), RGB Osc (8), Wireframe (6), SMX3 (8), LineGen (6), Waveshaper (6), Delay (6), Monitor (12), Output (16), Console (48)

### Default Rack
- **Row 1 (1U)**: Power, Mult, Noise, Atten, VCA, Logic, Comparator
- **Row 2 (3U)**: Clock, ClkDiv, LFO, Env, Seq, Pen, Mixer, Wave, RGB, Wire, SMX3, LineGen, Shaper, Delay, Monitor
- **Row 3 (3U)**: Transform, Maths, Filter, Console, Output
- **Row 4 (1U)**: Patch, Switch, Ring, Reverb, Ramp, Scope, Constant, Quantizer, ScaleOfs

### Key Module Details
- **Console** (48HP): 4 channels (input, s1/s2 sends, flex fader, mute), R1/R2 send on/off toggles, stacked send/return, master with canvas + controls row.
- **Maths** (20HP): Dual func gen, 4 independent attenuverters, SUM/OR/INV bus, cycle input, LEDs.
- **Monitor/Scope**: Split/overlay FlipToggle for dual-channel display.
- **Envelope**: Cycle starts immediately from idle, skips sustain in cycle mode.
- **Waveshaper** (6HP): 8 modes, amount/symmetry/smooth with harmonic fold.
- **Filter** (6HP): SVF LP/HP/BP/Notch, handles all signal types.
- **Reverb** (10HP): 12 taps, mix/freeze/src/byp.

### Recent Changes (2026-04-04, session 21)
- Console redesign: better spacing, flex faders, send on/off toggles, single control row under canvas
- Monitor + Scope: split/overlay FlipToggle
- Envelope: cycle fix (starts from idle, skips sustain)
- Maths: 4 independent attenuverters, cycle input, layout improvements
- Fader: value readout removed

### Recent Changes (2026-04-04, session 20)
- FilterModule, Maths redesign, Waveshaper rewrite, Clock/ClockDiv upgrades
- IconSelect consolidation, LabeledJack migration, Knob bipolar prop, 30+ SVG icons
- HP adjustments, rack redistribution

## Project Overview

**Video Modulo** — Eurorack-inspired modular video synthesis environment.

**Live:** https://kol-monitor-six.vercel.app/

### Key Files
- `src/VideoModulo.jsx` — Main layout
- `src/RackView.jsx` — Rack rendering
- `src/Workbench.jsx` — Bottom panel
- `src/ModuloSidebar.jsx` — Left sidebar
- `src/pages/ModuleDesign.jsx` — Prototyping at /design
- `src/moduleRegistry.js` — 37 modules
- `src/hooks/` — useRackState, useRenderLoop, usePatchRouting, useCasePower, signals
- `src/modules/utility/` — Module, ModuleLayout, eurorack, JackSocket, Case, PatchCableOverlay, PowerModule
- `src/modules/controls/` — Knob, Fader, Dropdown, Toggle, FlipToggle, LED, LabeledJack, IconSelect, Selector, ModuleHeader
- `src/components/atoms/Divider.jsx`
- `src/icons/Icon.jsx`
