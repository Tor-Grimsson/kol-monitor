# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Video Modulo** — a eurorack-inspired modular video synthesis environment built with React 19 and Tailwind CSS 4. Part of the Kolkrabbi Apparat suite. Uses Vite 7 for build tooling.

## Commands

- **Dev server:** `yarn dev`
- **Build:** `yarn build`
- **Lint:** `yarn lint`
- **Preview prod build:** `yarn preview`

**Use Yarn, not npm.** The project has `yarn.lock`.

## Architecture

Single-page React app with react-router-dom. VideoModulo is the sole route at `/`.

### Layout
- `VideoModulo` — Root: rack case + sidebar
- Sidebar: 3 tabs (Presets, Case, Modules)
- Rack rows with 1U/3U heights, HP-based module widths
- Patch cable overlay for connections

### State
- `src/hooks/useRackState.js` — Rack rows, modules, parked modules, edit mode
- `src/hooks/useModuleRegistry.jsx` — Module registration context
- `src/hooks/usePatchRouting.jsx` — Patch cable routing, drag-to-connect
- `src/hooks/useRenderLoop.js` — Centralized render loop (Kahn's topo sort)
- `src/hooks/signals.js` — Typed signals: scalar, color, points, pen

### Modules (34 total)
- `src/modules/control/` — Clock, LFO, Envelope, Sequencer, Logic, Comparator, S&H, Pen, Constant, ClockDivider
- `src/modules/math/` — Mult, Attenuator, VCA, Switch, Quantizer, ScaleOffset, RingMod, Waveshaper, Delay, Reverb, Mixer, Maths, Transform
- `src/modules/generators/` — RGBOscillator, Waveform, Wireframe, Noise, Ramp, SMX3, LineGen
- `src/modules/display/` — Monitor, Output, Console
- `src/modules/utility/` — Case, Module, JackSocket, PatchCableOverlay, PatchModule
- `src/modules/controls/` — Knob, Fader, Dropdown, Toggle, Selector, WaveSelect, ModuleHeader

### Styles (`src/styles/`)
- `theme.css` — imports color + typography, defines spacing/radius/shadow/z-index tokens
- `kol-color-simple.css` — color tokens
- `kol-typography-mono.css` — typography classes

### Design Tokens
- Typography: `.kol-display-*`, `.kol-heading-*`, `.kol-text-*`, `.kol-helper-*` (sizes: xl→xxxs)
- Colors: `text-fg-{96,64,32,08}`, `bg-surface-{primary,secondary}`, `accent-primary`
- Z-index: `--kol-z-nav: 1000`, `--kol-z-overlay: 50`, etc.

### Session Log Protocol

Read `docs/llm-context/AGENT-CONTEXT.md` and latest session log in `docs/llm-context/session-log/` before starting work. Write a session log after significant changes.

## ESLint

Flat config (`eslint.config.js`). `no-unused-vars` ignores variables matching `^[A-Z_]`.
