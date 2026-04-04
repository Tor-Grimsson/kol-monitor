# Session: Module Design — Controls, Layout Components, Module Redesigns

**Date:** 2026-04-03
**Agent:** Claude Code (Opus 4.6)
**Summary:** New controls (FlipToggle, LED, LabeledJack), layout components (ModuleLayout, ModuleControls, ModuleJacks, ModuleRow), /design page for visual prototyping, redesigned Noise Tools + Attenuverter + Mult + Reverb modules.

## Changes Made

### New Controls
- `src/modules/controls/FlipToggle.jsx` — Vertical/horizontal two-state toggle switch with labelA/labelB. Variant prop: vertical (default), horizontal.
- `src/modules/controls/LED.jsx` — Small indicator light. Colors: red, yellow, green, white, blue. Active/inactive state with glow.
- `src/modules/controls/LabeledJack.jsx` — JackSocket wrapped with 8px label. labelPosition prop: top/bottom. Single source of truth for jack+label combo.

### Layout Components
- `src/modules/utility/ModuleLayout.jsx` — Variants: 3u (vertical), 1u (horizontal), 1u-stacked (1U with rows). Contains ModuleControls, ModuleJacks, ModuleRow.
- `ModuleControls` — Flex column, left-aligned children, fit-width.
- `ModuleJacks` — Flex row/column variant for signal I/O.
- `ModuleRow` — Generic flex row for any content.

### Module.jsx Updates
- `u` prop added — controls bottom padding (1U: 8px, 3U: 12px) and header padding (1U: 8px, 3U: 16px).
- Header (label + power dot) managed by Module wrapper, not individual modules. All 35 modules pass label/enabled/onToggle to Module.

### Design Page
- `src/pages/ModuleDesign.jsx` — Visual prototyping at `/design`. Reference mockups (pure divs) and system mockups (real components) side by side. Used to design Noise Tools and Quadratt layouts before implementing.
- Route added to `src/App.jsx` via lazy loading.

### Module Redesigns

**Noise Tools (22HP 1U)** — Complete rewrite from simple noise generator to full Intellijel-style noise tools:
- Clock section: pulse rate knob, yellow LED, clk/rnd flip toggle
- Noise outputs: pink, white, pulse
- Sample & Hold: trig input, signal input (normalled from white), sample/track toggle, hold output
- Slew limiter: signal input (normalled from hold), slew time knob, slew output
- Internal normalling: clock→trig, white→S&H input, hold→slew input

**Attenuverter (26HP 1U)** — Expanded from 1-channel to 4-channel Quadratt:
- 4 channels (A-D) with UNI/-/+ flip toggle and knob each
- I/O grid with caret-down arrows (input→output) and caret-right arrows (cascade between outputs)
- Cascading outputs: unpatched output sums into next channel
- Dividers between each channel strip

**Mult (8HP 1U)** — Dual mult with normalling:
- Two rows: in→4 out each
- Second input normalled from first when unpatched
- Output jacks with dark bg, inputs without

**Reverb (6HP 1U)** — Redesigned with ModuleLayout:
- CV inputs for size and decay
- ModuleControls + ModuleRow + ModuleJacks structure
- Divider between controls and signal I/O

### Typography
- Jack labels: 8px via LabeledJack (kol-helper-xxxs)
- Module names: 10px via ModuleHeader (kol-helper-xxs)
- Knob labels: 8px (kol-helper-xxxs), value readout removed
- Knob variants: column (default), row-left, row-right

### JackSocket Updates
- `bg` prop — dark background on outputs by default, transparent on inputs. Uses bg-fg-04 class.
- `labelSize` prop — configurable label size, default xxs.
- Background wrapper: s+4 px for both in/out to maintain alignment.

### Divider Updates
- Horizontal: w-full py-1 built in.
- Vertical: h-full, no default padding.

### Dropdown Updates
- Text centered, capitalize transform.

### Other
- `src/components/icons/Icon.jsx` used for caret-down/caret-right arrows in I/O grids.
- Patch module moved to 1U with compact button styling.

## Current State

### Working
- /design page for visual prototyping
- Noise Tools with full signal chain
- Quadratt 4-channel attenuverter with cascade
- Dual Mult with normalling
- Reverb with CV inputs
- Layout components for standardized module design
- LabeledJack for consistent jack+label

### Known Issues
- Some 1U modules still have 3U-style layouts (need redesign)
- Hardcoded arrow positions in I/O grid (pixel values)
- Many 3U modules not yet using ModuleLayout components

## Next Steps
1. Redesign remaining 1U modules (VCA, Logic, Ring Mod, Ramp, Switch, Comparator)
2. Apply ModuleLayout to 3U modules
3. Apply LabeledJack across all modules
