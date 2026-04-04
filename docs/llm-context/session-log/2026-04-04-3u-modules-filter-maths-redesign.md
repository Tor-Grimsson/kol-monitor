# Session: 3U Module Redesigns — Filter, Maths, Waveshaper, IconSelect, LabeledJack Migration

**Date:** 2026-04-04
**Agent:** Claude Code (Opus 4.6)
**Summary:** New Filter module, Maths full redesign from Make Noise reference, Waveshaper rewrite with 8 modes, IconSelect consolidation, LabeledJack migration across all 22 3U modules, HP adjustments across many modules.

## Changes Made

### New Modules
- **FilterModule** (6HP 3U) — SVF video signal filter with LP/HP/BP/Notch modes. Handles scalar/color/points. Cutoff + resonance with CV inputs.

### Major Redesigns

**MathsModule** (20HP 3U) — Full redesign based on Make Noise Maths reference:
- Dual function generators (Ch1 left, Ch4 right) with rise/fall/both CV, vari-response (log/exp), cycle toggle + cycle input
- Center section: 4 attenuverter knobs (ch1-4) with bipolar `-/+` markers, ch2/ch3 signal inputs
- Outputs: 1/2/3/4 unity, OR/SUM/INV bus, EOR/EOC per channel
- LEDs: yellow/white EOR/EOC (swapped between channels), red OR, green INV
- Symmetrical 3-column layout matching reference

**WaveshaperModule** (6HP 3U) — Complete rewrite:
- 8 shape modes: exp, log, s-curve, clip, fold, wrap, step, sine
- Amount knob (dry/wet blend, 0=passthrough)
- Symmetry knob (shifts curve bend point)
- Smooth knob with harmonic fold toggle
- Handles scalar/color/points signal types
- Pre-computed shaper factory for performance

**ClockModule** (4HP 3U) — Added run/stop FlipToggle with yellow LED, BPM readout below knob, 8 division outputs (1 through 1/8)

**ClockDividerModule** (4HP 3U) — Rotating clock divider with 8 divisions, rotate + reset inputs

### IconSelect Consolidation
- Created `src/modules/controls/IconSelect.jsx` — single reusable component replacing WaveSelect, RampSelect, LogicSelect, ShapeSelect
- Takes `items` array and `columns` prop
- Hover shows name via `title` attribute
- Applied to: Waveform, LFO, Ramp, Logic, Wireframe, LineGen, Waveshaper, Pen, Filter

### New SVG Icons
- Filter: filter-lp, filter-hp, filter-bp, filter-notch
- Shapes: shape-cube, shape-tetra, shape-octa, shape-sphere
- Shaper: shaper-exp, shaper-log, shaper-scurve, shaper-clip, shaper-fold, shaper-wrap, shaper-step, shaper-sine
- Lines: line-line, line-grid, line-circle, line-spiral, line-lissa
- Caps: cap-round, cap-square, cap-butt

### LabeledJack Migration
- All 22 3U modules migrated from JackSocket+label to LabeledJack via subagent

### Knob Updates
- Added `bipolar` prop — shows `-/+` above knob dial
- Stroke width standardized across all shaper/line icons to match wave icons (2.5)

### HP Adjustments
- Wireframe: 8→6, SMX3: 12→8, LineGen: 8→6, Mixer: 8→6, Maths: 8→20, Transform: 12→6
- Constant: moved to 1U, Quantizer: moved to 1U, ScaleOffset: moved to 1U

### Layout Updates
- Transform: single column layout (was 2-column)
- Delay: in/out flex row, removed divider
- Quant/S+O: removed dividers, in/out flex row, knobs row-right
- Output: single row with dividers `[cv] [bg] | [a b c d] | [pen]`
- Sequencer: vertical steps (top-to-bottom), horizontal drag, knob row-right, fol toggle horizontal
- Pen: IconSelect on top, color+out flex row at bottom
- RGB Osc: gap 8px, added clock sync input

### Default Rack Redistribution
- Row 1 (1U): Power, Mult, Noise, Atten, VCA, Logic, Comparator
- Row 2 (3U): Clock, ClkDiv, LFO, Env, Seq, Pen, Mixer, Wave, RGB, Wire, SMX3, LineGen, Shaper, Delay, Monitor (104HP)
- Row 3 (3U): Transform, Maths, Filter, Console, Output
- Row 4 (1U): Patch, Switch, Ring, Reverb, Ramp, Scope, Constant, Quantizer, ScaleOfs

## Current State

### Working
- 37 modules total (added Filter)
- All modules use LabeledJack consistently
- IconSelect replaces all type-specific selectors
- Maths fully functional with dual function generators + bus
- Waveshaper handles all signal types with 8 modes
- Filter SVF handles scalar/color/points

### Known Issues
- `size="sm"` still used on some CV jacks across modules (should standardize to default)
- Old WaveSelect/RampSelect/LogicSelect/ShapeSelect files still exist (unused, can delete)
- Preset system needs updating for new module configurations
- Some modules still use Selector component (could migrate to IconSelect)

## Next Steps
1. Remove unused select components (WaveSelect, RampSelect, LogicSelect, ShapeSelect)
2. Standardize jack sizes across all modules (remove size="sm")
3. Continue 3U module layout polish
4. Session log work
