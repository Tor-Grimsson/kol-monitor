# Session: kol-monitor — Repo Isolation & Cleanup

**Date:** 2026-04-03
**Agent:** Claude Code (Opus 4.6)
**Summary:** Isolated Video Modulo from kol-mirrors into standalone kol-monitor repo. Removed all Hall of Mirrors code, flattened src/videomodulo/ into src/, cleaned dependencies and CSS.

## Changes Made

### Entry Points
- `src/App.jsx` — Rewritten. VideoModulo is sole route at `/`. Kept react-router-dom.
- `index.html` — Title updated to "kol-monitor".
- `src/main.jsx` — Unchanged.

### Deleted Hall of Mirrors Code
- `src/components/hall-of-mirrors/` — All Pixi variants, SymphonyMixer, MasterModule, RoutingMatrix, generators (~70+ files)
- `src/components/mirror/` — All except `MirrorSidebar.jsx` (kept as styling reference)
- `src/components/mixer/` — ChannelMaster
- `src/components/atoms/`, `molecules/`, `icons/`, `structure/`, `styleguide/`
- `src/pages/` — MirrorPlayground, VideoModuloIndex, Styleguide
- `src/hooks/` — All HoM hooks (useMirrorState, useFrameBuffer, useCanvasFx, usePixiApp, etc.)
- `src/data/mirrorVariants.js`, `src/utils/processImageUpload.js`, `src/assets/default-canvas.svg`
- `src/videomodulo/arc-case/` — All 4 archived cases

### Flattened Directory Structure
- Moved all `src/videomodulo/*` contents up to `src/` — VideoModulo is the only app, no nesting needed
- Updated App.jsx import path accordingly

### CSS Cleanup
- `src/index.css` — Stripped to just `@import "tailwindcss"` + `@import "./styles/theme.css"`
- Removed `src/styles/components.css` (33KB HoM component styles)
- Removed `src/videomodulo/styles.css` (orphaned, never imported)
- Removed all `.mirror-*`, `.symphony-*`, `.pixi-*` CSS rules

### Dependencies Removed
- `pixi.js` — HoM Pixi variants only
- `gsap` — HoM movement variants only
- `react-colorful` — HoM ColorPicker only
- `@playwright/test` — No real tests existed

### Testing Infrastructure Removed
- `playwright.config.ts`, `tests/`, `playwright-report/`

### Metadata Updated
- `package.json` — name changed from `vite-scaffold` to `kol-monitor`
- `LLM_RULES.md` — Rewritten for Video Modulo

### Preserved As-Is
- `public/` — All static assets (fonts, SVGs, images, kol-vector)
- `docs/` — All documentation including llm-context and session logs
- `src/components/mirror/MirrorSidebar.jsx` — Kept as styling reference
- `a_torg/` — Research/archive folder
- `three` dependency — Kept for future use

## Current State

### Build
- 102 modules, 357KB JS bundle, clean build
- No import errors or missing dependencies

### Directory Structure
```
src/
├── App.jsx                    # Router → VideoModulo at /
├── main.jsx                   # React entry
├── index.css                  # Tailwind + theme
├── styles/                    # Design tokens (theme, colors, typography)
├── components/mirror/         # MirrorSidebar.jsx (reference only)
├── VideoModulo.jsx            # Main component
├── ModuloSidebar.jsx          # Sidebar UI
├── moduleRegistry.js          # 34 module definitions
├── patches.js                 # Preset patches
├── hooks/                     # signals, useModuleRegistry, usePatchRouting, useRenderLoop, useRackState
├── modules/                   # control/, controls/, generators/, math/, display/, utility/
└── icons/                     # Icon.jsx + SVGs
```

## Next Steps
1. Re-init git repo (remove .git from kol-mirrors copy, fresh init)
2. Create new GitHub remote (kol-apparat/kol-monitor)
3. Begin Video Modulo development independent of kol-mirrors
