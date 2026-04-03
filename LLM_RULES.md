# LLM Rules for Video Modulo

---

## ⚠️ CRITICAL STARTUP PROTOCOL - READ THIS FIRST ⚠️

**WHEN THE USER SAYS "read `LLM_RULES.md`" YOU MUST:**

1. **READ** `/docs/llm-context/AGENT-CONTEXT.md`
2. **READ** the latest session log from `/docs/llm-context/session-log/` (sort by date, most recent first)
3. **STOP** and say "Context loaded. What would you like me to work on?"
4. **WAIT** for the user to specify their task

**DO NOT:**
- Skip reading the context files
- Start working before the user specifies a task

**IF THE USER ASKS "Do you understand?" or "Outline the task?":**
Respond with a clear plan of what you'll do BEFORE taking any action.

---

# LLM Agent Onboarding

Welcome to **Video Modulo** — a eurorack-inspired modular video synthesis environment. Part of the Kolkrabbi Apparat suite.

## Quick Start

1. **Read this file** to understand the project structure
2. **Read** `/docs/llm-context/AGENT-CONTEXT.md` for current project state
3. **Check** `/docs/llm-context/session-log/` for the most recent session log
4. **Follow** the conventions and guidelines below

## Project Overview

**Video Modulo** is a single-page React app for modular signal synthesis with a eurorack-style interface. Pure math signal path (scalar/color/points), vector rendering, patch cable routing.

### Tech Stack
- React 19 + Vite 7
- React Router 7
- Tailwind CSS 4
- Three.js (available for 3D geometry)
- **Yarn** (package manager - NOT npm)

### Package Manager

**⚠️ IMPORTANT: This project uses Yarn, NOT npm**

- **Run dev server:** `yarn dev`
- **Install dependencies:** `yarn install` or `yarn`
- **Build:** `yarn build`
- **Lint:** `yarn lint`

**DO NOT use npm commands** — the project has `yarn.lock`, not `package-lock.json`

## Architecture

### Layout
- `VideoModulo` — Root component: rack case + sidebar
- Sidebar: Presets, Case management, Module catalog
- Rack rows with 1U/3U heights, HP-based module widths
- Patch cable overlay for connections

### State
- `useRackState` — Rack rows, modules, parked modules, edit mode
- `useModuleRegistry` — Module registration context
- `usePatchRouting` — Patch cable routing context
- `useRenderLoop` — Centralized render loop (Kahn's topo sort)

### Signal System
- Typed signals: scalar, color, points, pen
- Port-based patch routing with drag-to-connect
- Centralized render loop with topological sort
- 1-frame cycle delay for feedback loops

## Directory Structure

```
kol-monitor/
├── src/
│   ├── App.jsx                          # React Router → VideoModulo at /
│   ├── index.css                        # Tailwind + theme CSS imports
│   ├── styles/                          # Design tokens
│   │   ├── theme.css                    # Imports color + typography + defines tokens
│   │   ├── kol-color-simple.css         # Color tokens
│   │   └── kol-typography-mono.css      # Typography classes
│   └── videomodulo/                     # All application code
│       ├── VideoModulo.jsx              # Main component
│       ├── ModuloSidebar.jsx            # Sidebar UI
│       ├── moduleRegistry.js            # 34 module definitions
│       ├── patches.js                   # Preset patches
│       ├── hooks/                       # App hooks
│       │   ├── signals.js               # Signal type definitions
│       │   ├── useModuleRegistry.jsx    # Module registration
│       │   ├── usePatchRouting.jsx      # Patch routing
│       │   ├── useRenderLoop.js         # Render loop
│       │   └── useRackState.js          # Rack state management
│       ├── modules/                     # Module implementations
│       │   ├── control/                 # Clock, LFO, Envelope, Sequencer, etc.
│       │   ├── controls/                # Shared UI: Knob, Fader, Dropdown, Toggle, etc.
│       │   ├── generators/              # RGBOsc, Waveform, Wireframe, Noise, etc.
│       │   ├── math/                    # Mult, VCA, Delay, Mixer, Transform, etc.
│       │   ├── display/                 # Monitor, Output, Console
│       │   └── utility/                 # Case, Module, JackSocket, PatchCableOverlay
│       └── icons/                       # Icon.jsx + SVG icons
├── public/                              # Static assets (fonts, SVGs, images)
├── docs/
│   ├── llm-context/                     # AI agent context
│   │   ├── AGENT-CONTEXT.md
│   │   └── session-log/
│   └── video-modulo/                    # Architecture & research docs
└── LLM_RULES.md                         # This file
```

## LLM Context Protocol

This project uses **session logs** to maintain context across agents and sessions.

### Reading Context

**Always read the latest session log** in `/docs/llm-context/session-log/` before starting work. Session logs are named:
- `YYYY-MM-DD-session-description.md`

Sort by date to find the most recent.

### Writing Context

When you complete significant work:
1. Create a new session log in `/docs/llm-context/session-log/`
2. Use the format: `YYYY-MM-DD-brief-description.md`
3. Include: session metadata, changes made, current state, next steps
4. Update `AGENT-CONTEXT.md` if needed

## Working Conventions

### Code Style

- **No over-engineering** — Make only requested changes
- **Remove unused code** — Delete completely, no backwards-compat hacks
- **Edit over create** — Prefer modifying existing files
- **Use existing patterns** — Follow established naming and structure
- **Apply exact values** — When user specifies a concrete number, use it

### Typography System

**Weight Hierarchy:**
- 600 (SemiBold) - Display styles
- 500 (Medium) - Headings & helpers
- 400 (Regular) - Body text

**Class Naming:**
- `.kol-display-*` - Hero/section headings
- `.kol-heading-*` - Content headings
- `.kol-text-*` - Body copy
- `.kol-helper-*` - Labels/metadata

**Size Scale:** xl, lg, md, sm, xs, xxs, xxxs

### CSS

- Design tokens in `src/styles/theme.css`
- Color tokens: `text-fg-{96,64,32,08}`, `bg-surface-{primary,secondary}`, `accent-primary`
- Z-index via CSS variables: `--kol-z-nav`, `--kol-z-overlay`, etc.

### Git Workflow

- Only commit when explicitly asked
- Write clear, concise commit messages
- Never force push or use destructive commands without permission
