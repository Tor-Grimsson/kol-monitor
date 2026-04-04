# Session: 1U Module Redesigns — Layout, Controls, New Modules

**Date:** 2026-04-04
**Agent:** Claude Code (Opus 4.6)
**Summary:** Redesigned all 1U modules with consistent layouts, new controls, CV inputs, and new ScopeModule. Reverb upgraded to full signal processing with mix/freeze/bypass.

## Changes Made

### Module Redesigns

**Switch (10HP 1U)** — Dual independent A/B switch. Two rows with divider. LabeledJack for all, vertical divider between cv and out.

**VCA (8HP 1U)** — Dual VCA. Two rows with divider. LabeledJack for all, vertical divider between cv and out.

**Ring Mod (6HP 1U)** — CV input for depth added. Knob row-right, horizontal divider, jacks below. LabeledJack.

**Comparator (6HP 1U)** — CV input for threshold added via ModuleRow. Knob on top, in+out row below. LabeledJack.

**Ramp (6HP 1U)** — CV input for rate added via ModuleRow. RampSelect icon buttons (3 SVG icons: up/down/tri). LabeledJack for rst/out.

**Logic (8HP 1U)** — LogicSelect 2x3 icon grid (6 SVG gate symbols: AND/OR/XOR/NOT/NAND/NOR). Horizontal divider, jacks below with vertical divider. LabeledJack.

**Reverb (10HP 1U)** — Full signal processing rewrite:
- Handles scalar, color, points signal types
- 12 prime-spaced taps for denser diffusion
- Mix knob (wet amount on top of dry)
- Freeze toggle (hold buffer)
- SRC toggle (bypass source, wet-only output)
- BYP toggle (bypass effect, pass-through)
- Two-column layout: knobs left, toggles+jacks right

**Noise Tools (22HP 1U)** — CV inputs for all knobs (already done previous session, verified).

**Patch (6HP 1U)** — Compact buttons, centered dropdown, sentence case.

### New Modules

**ScopeModule (16HP 1U)** — 1U oscilloscope. Canvas center, A/B in/out stacked left with labels, pen input right. Pass-through outputs. Same drawing logic as 3U Monitor.

### New Controls

**RampSelect** — 1x3 icon button row for ramp shapes (up/down/tri).
**LogicSelect** — 2x3 icon button grid for logic gates (AND/OR/XOR/NOT/NAND/NOR).

### New SVG Icons
- `src/icons/svg/ramp-up.svg`, `ramp-down.svg`, `ramp-tri.svg`
- `src/icons/svg/logic-and.svg`, `logic-or.svg`, `logic-xor.svg`, `logic-not.svg`, `logic-nand.svg`, `logic-nor.svg`

### LabeledJack Updates
- Added `labelPosition="left"` and `"right"` variants for horizontal layout.

### Toggle Updates
- Gap changed from `gap-0.5` (2px) to `gap-1` (4px).

### Divider Updates
- Removed default `py-1` from horizontal, removed `h-full` from vertical (uses `alignSelf: stretch` instead).
- Padding added per-use via className.

### Dropdown Updates
- `textTransform: 'capitalize'` for sentence case.

### Default Rack Updates
- Row 1: removed S&H (in Noise Tools), adjusted HP values
- Row 4 added: Patch, Switch, Ring, Reverb, Ramp, Scope
- All 1U modules have `u={1}` for correct header padding

## Current State

### 1U Modules (complete)
Power (6), Mult (8), Noise (22), Atten (26), VCA (8), Logic (8), Comparator (6), Switch (10), Ring (6), Reverb (10), Ramp (6), Scope (16), Patch (6)

### Known Issues
- Some dividers may need padding adjustments after default removal
- 3U modules not yet redesigned with new layout components
- Preset knob values still not applied on switch

## Next Steps
1. Redesign 3U modules with layout components
2. Apply LabeledJack across 3U modules
3. Add CV inputs to remaining modules
