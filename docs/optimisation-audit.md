# System Optimisation Audit

**Date:** 2026-04-05
**Scope:** Full system — render loop, patch routing, modules, canvas drawing, React tree

---

## TIER 1: Architecture (systemic, biggest wins)

### Re-render cascade — nothing is memoized
- `useRackState` returns new object every render — all 45+ modules re-render on any state change
- `usePatchRouting` context value not wrapped in `useMemo` — every cable change re-renders 100+ components (all modules + all JackSockets)
- `RackView` not wrapped in `React.memo`, no memoization on module wrappers
- `ModuleInitContext.Provider` recreated per module per render
- CSS `zoom` (not `transform: scale`) forces synchronous layout on entire DOM subtree
- `ModuloSidebar` not memoized, re-renders on zoom/pan
- Case rails: 5 rows × 2 rails × 104 slots = 1040 divs recreated on parent re-render

**Files:** useRackState.js:225-237, usePatchRouting.jsx:105-116, RackView.jsx:1-54, VideoModulo.jsx:150

### Render loop O(n²)
- Topo sort rebuilds every frame (connection reference equality check fails — `connections !== cachedConnections.current` always true)
- Input gathering scans ALL connections per module per frame — O(modules × connections) = ~7500 iterations/frame
- Disabled modules still get `process()` called — just return null inside
- `prevOutputsRef.current = new Map(outputsRef.current)` allocates new Map every frame
- Cycle detection uses `sorted.includes(id)` which is O(N) per cycle module

**Files:** useRenderLoop.js:73-81, useRenderLoop.js:102-112, useRenderLoop.js:151

---

## TIER 2: Hot Path (60x/sec)

### Signal objects created every frame
- `scalar()`, `color()`, `points()` allocate new objects per call
- Every module with output = 1-3 new objects/frame × 45 modules = 2700+ allocations/sec
- `penColor()` builds RGB strings via template literals per draw call
- `pen()` spreads PEN_DEFAULTS on every call

**Files:** signals.js:14-30

### Connection checking O(n) everywhere
- Every module calls `conns.some()` per port per render
- MathsModule: 13 port checks × full connection scan each
- AttenuatorModule: 8 port checks
- JackSocket: checks connection status per render — 80+ linear scans across all jacks
- PatchCableOverlay: recalculates all cable paths + DOM queries (getBoundingClientRect) on every change
- Scroll listener triggers forceUpdate → full SVG rebuild

**Files:** All 45 module files, JackSocket.jsx:30, PatchCableOverlay.jsx:36-94

### MathsModule setState in process()
- `setEor1Active()`, `setEoc1Active()` etc called inside 60fps process loop
- Triggers full component re-render every frame
- Each re-render re-evaluates all 13 `conns.some()` checks

**Files:** MathsModule.jsx:317-319

---

## TIER 3: Module-Specific

### Heaviest modules (ranked by CPU cost)

1. **LifeModule** — 256×256 = 65K cells × 8 neighbors × 15 gens/sec = 975K ops/sec. `gridToPoints()` creates thousands of point objects per frame.
2. **DitherModule** — raycast mode: 576 cells × O(edges) per cell. `buildFillMap()` runs ray-casting per cell. ASCII filter creates new array inside cell loop (line 538-544).
3. **WireframeModule** — 6 trig calls × 1200 vertices = 7200 trig ops/frame. No rotation matrix (3 sequential rotations with intermediate array allocations). New array per vertex.
4. **TransformModule** — 3 trig + 9 multiplies per point. New point object per input point via `map()`. 1000-point signal = 27K math ops + 1K allocations/frame.
5. **ModulatorGenModule** — `Array.concat()` in loop creates new array copy each iteration = O(n²) allocation for concentric circles.
6. **RadialGenModule** — `getLfoValue()` with Math.sin called per point (up to 800 points). Mirror logic branches per iteration.
7. **GenHifiModule** — `generate()` called every frame regardless of input changes. Wave mode creates 256+ point objects per frame.
8. **LineGenModule** — Grid mode: 4 nested loops creating 1600+ points/edges per frame, even when params static.
9. **GenLofiModule** — 16×16 grid × complex `sample()` with trig per cell. 3 outputs generated simultaneously every frame.

**Files:** LifeModule.jsx:101-130, DitherModule.jsx:426-548, WireframeModule.jsx:274-280, TransformModule.jsx:141-165, ModulatorGenModule.jsx:276-302, RadialGenModule.jsx:42-96, GenHifiModule.jsx:578, LineGenModule.jsx:18-107, GenLofiModule.jsx:114-136

---

## TIER 4: Canvas Drawing

### Independent rAF loops
- MonitorModule, ConsoleModule, ScopeModule, OutputModule each have their own `requestAnimationFrame()` loop — 4 independent loops not synced with the module render loop.

### Drawing inefficiencies
- Scanline effect: h/3 `fillRect` calls per frame per canvas
- Edge fill: multiple `ctx.fill()` calls inside loop instead of one batched fill
- Edge stroke: per-segment `moveTo()` instead of polyline chains
- `ctx.font = '9px monospace'` set on every text render
- Aspect ratio math recalculated every frame
- No off-screen clipping for points — all 10K+ points processed even if invisible
- No `ctx.save()/restore()` — manual `resetPen()` is fragile, state leakage risk

### ConsoleModule
- 4 channel signals + 2 returns drawn with manual globalAlpha compositing
- RGB background color string rebuilt every frame
- `Math.max()` over all send levels computed twice per frame (rtn1, rtn2)

**Files:** drawSignal.js, MonitorModule.jsx:127-169, ConsoleModule.jsx:308-342, PatchCableOverlay.jsx:87-94

---

## Fix Order

1. ~~**Memoize React tree**~~ ✅ DONE
2. ~~**Build connection index**~~ ✅ DONE
3. ~~**Cache topo sort**~~ ✅ DONE (merged into #2)
4. ~~**Skip disabled modules in render loop**~~ ✅ DONE
5. ~~**MathsModule LED state → refs**~~ ✅ DONE
6. ~~**Pre-compute rotation matrices**~~ ✅ DONE (WireframeModule; TransformModule already pre-computed)
7. ~~**Dirty-flag caching**~~ ✅ DONE
8. **CSS `transform: scale()` instead of `zoom`** — SKIPPED: PatchCableOverlay already compensates for CSS zoom in getBoundingClientRect math. Switching would break cable positioning. Risk > reward.
9. ~~**Connection index for UI**~~ ✅ DONE
10. ~~**Consolidate rAF loops**~~ ✅ DONE

---

## Changes Applied

### Fix 1: Memoize React tree (2026-04-05)

**Problem:** Every state change (zoom, pan, cable, sidebar) re-rendered all 45+ modules. Zero memoization anywhere in the component tree.

**Before:**
- Pan/zoom: 45+ module components re-render per frame
- Cable change: 100+ components re-render (all modules + JackSockets)
- `useRackState` return: new object every render, breaks downstream memo
- `usePatchRouting` context value: new object every render, broadcasts to all consumers
- `handlePanDown`: recreated on every pan frame (dep on `panOffset`)
- Rail/Case/RackRow: 1040+ static DOM elements recreated on parent re-render

**After:**
- `usePatchRouting.jsx`: context value wrapped in `useMemo([pendingOutput, connections, ...])`. `lockedRef`/`visibilityRef` now stable `useRef` (were recreated objects). Context only triggers consumer re-renders when connections or pendingOutput actually change.
- `useRackState.js`: return wrapped in `useMemo([rows, workbench, editMode, ...callbacks])`. Callbacks are `useCallback` so only `rows`/`workbench`/`editMode` state changes produce a new object.
- `Case.jsx`: `Rail`, `RackRow`, `Case` all wrapped in `React.memo`. Rail (104 screw-hole divs × 2 per row × 5 rows = 1040 elements) now never re-renders.
- `RackView.jsx`: full rewrite — `RackView`, `RackRowContent`, `ModuleSlot` all `React.memo`. Module sort per row is `useMemo`. Individual modules only re-render when their specific row data changes.
- `VideoModulo.jsx`: `handlePanDown` deps changed from `[panOffset]` to `[]`, reads panOffset from ref. Eliminates callback churn during pan gestures.

**Measurable impact:**
- Pan/zoom: 45+ module re-renders → 0 (memoized, props unchanged)
- Cable patch: re-renders scoped to modules that consume connections (still all, but context value is now stable between connection changes)
- Sidebar toggle: module tree unaffected
- Rail rendering: 1040 divs created once, never again

### Fix 2-4: Connection index, topo sort cache, skip disabled modules (2026-04-05)

**Problem:** Render loop had O(modules × connections) input gathering, topo sort rebuilt every frame, disabled modules still processed.

**Before:**
- Input gathering: for each of 45 modules, scan ALL connections (linear) = ~7500 iterations/frame at 60fps = 450K iterations/sec
- Topo sort: `connections !== cachedConnections.current` always true (new array ref from React state), Kahn's O(V+E) runs every frame
- Disabled modules: `process()` called, creates null outputs, wastes input gathering + function call overhead
- Cycle detection: `sorted.includes(id)` is O(N) per cycle module
- Output swap: `new Map(outputsRef.current)` allocates fresh Map every frame

**After:**
- `useRenderLoop.js` rewritten:
  - `buildGraph()` creates `connIndex: Map<toModuleId, Connection[]>` alongside topo sort. Input gathering is now O(1) lookup + iterate only relevant connections per module.
  - Topo sort cached by `connectionsRef.current` reference (which is stable between changes via `useEffect` sync in usePatchRouting). Only rebuilds when connections actually change.
  - Cycle detection uses `Set.has()` instead of `Array.includes()` — O(1) vs O(N).
  - Output swap: `prev.clear()` + copy entries instead of `new Map()` allocation.
  - Disabled modules: checked via `mod.enabledRef.current` before input gathering or `process()`. Completely skipped.
- `useModuleRegistry.jsx`: `useModule` auto-captures `enabledRef` from `useModuleEnabled` (no changes to 42 module files needed).
- `useModuleEnabled.js`: exposes `enabledRef` via `getLastEnabledRef()` for zero-touch integration.

**Measurable impact:**
- Input gathering: 7500 iterations/frame → ~150 (only relevant connections per module)
- Topo sort: 60 sorts/sec → 0 (cached, only runs on actual connection change)
- Disabled modules: 40 disabled modules × (input gather + process call) → 0 cost
- Output swap: 60 Map allocations/sec → 0 (reuse + clear)
- Cycle detection: O(N) includes → O(1) Set.has

### Resource Hoggers Identified

| Module | Cost | Notes |
|--------|------|-------|
| LifeModule (256×256) | ~975K ops/sec | 65K cells × 8 neighbors × 15 gens/sec. gridToPoints creates thousands of objects. |
| DitherModule (raycast) | ~3500 raycasts/frame | 576 cells × edges. buildFillMap is O(cells² × edges). ASCII filter allocates array per cell. |
| WireframeModule (sphere) | ~7200 trig/frame | 6 trig × 1200 vertices. No rotation matrix. New array per vertex. |
| TransformModule | ~27K ops/1K points | 3 trig + 9 mul + object alloc per point. |
| MathsModule | Re-renders 60x/sec | setState in process() for LED indicators. 13 conns.some() per render. |
| ModulatorGenModule | O(n²) concat | Array.concat in loop for concentric circles. |
| ConsoleModule | 6 signals drawn/frame | 4 channels + 2 returns with manual alpha compositing. RGB string built every frame. |

### Fix 5: MathsModule LED state → refs (2026-04-05)

**Problem:** 6 `useState` setters called inside `process()` at 60fps → full component re-render every frame → 13 `conns.some()` re-evaluated per render.

**After:** LED values written to `ledRefs.current` (ref, no render). `setInterval` at 100ms syncs refs to state only when values differ. Re-renders drop from 60/sec → ~10/sec max, and only when LEDs actually change.

**Measurable impact:** MathsModule re-renders: 60/sec → 0-10/sec. 13 × `conns.some()` evaluations: 780/sec → 0-130/sec.

### Fix 6: Pre-compute rotation matrix — WireframeModule (2026-04-05)

**Problem:** 3 sequential rotation functions (rotateX/Y/Z) each called cos+sin per vertex = 6 trig calls × 1200 vertices = 7200 trig ops/frame. Each rotation creates a new intermediate array.

**After:** `buildRotationMatrix(rx, ry, rz)` computes a single 3×3 matrix (6 trig calls total). `transformAndProject()` applies matrix + scale + projection in one pass — 9 multiplies + 6 adds per vertex, no intermediate arrays.

**TransformModule:** Already pre-computes cos/sin once per frame (6 calls). Cost is in `.map()` object allocation per point, not trig — addressed in fix #7.

**Measurable impact:** WireframeModule trig calls: 7200/frame → 6/frame. Intermediate array allocations: 3600/frame → 0.

### Fix 7: Dirty-flag caching for generators (2026-04-05)

**Problem:** Generators rebuild geometry every frame even when inputs haven't changed.

**Changes:**
- **WireframeModule**: `generateGeometry(shape, res)` cached by `shape:res` key. Only regenerates when shape or resolution changes. Rotation matrix still computed per frame (needed for animation), but base geometry (vertices/edges) reused.
- **RadialGenModule**: Full output cached by string key of all 16 parameters. Purely parametric — when no CV patched and knobs stable, `generateRadialPoints()` + `points()` completely skipped. Returns cached signal.
- **ModulatorGenModule**: Fixed O(n²) `Array.concat()` in concentric circle loop. Replaced with `push()` loops — linear allocation instead of copying entire array per iteration.

**Not cached (always animate):** LineGenModule (time-dependent always), GenLofi/GenHifi (only when animate=off, diminishing returns).

**Measurable impact:**
- WireframeModule: `generateGeometry()` calls: 60/sec → 0 when shape/res stable (sphere = 1200 vertices saved per skip)
- RadialGenModule: `generateRadialPoints()` + 1600 trig ops: 60/sec → 0 when params stable
- ModulatorGenModule concat: O(n²) → O(n) per frame. With 8 circles: ~8 array copies eliminated per frame

### Fix 9: Connection index for UI — useConnectedPorts hook (2026-04-05)

**Problem:** Every module called `conns.some(c => c.toModuleId === id && c.toPort === 'xxx')` per input port per render. MathsModule: 13 scans × full array. AttenuatorModule: 8 scans. Total across 42 modules: ~200 linear scans of the connections array per render cycle.

**After:**
- New `useConnectedPorts(moduleId)` hook in `usePatchRouting.jsx`. Returns `useMemo`'d `Set<portName>` — one pass through connections array, result cached until connections change.
- All 38 modules converted from `conns.some(...)` to `cp.has('portName')` — O(1) per port check.
- Modules that only used `routing` for connection checks now import `useConnectedPorts` only, reducing context subscription scope.
- MathsModule: removed `usePatchRouting` entirely (only needed connections).

**Files changed:** 38 module files + usePatchRouting.jsx

**Measurable impact:**
- Connection checks: ~200 linear scans/render → 42 Set builds (one per module, memoized) + O(1) per port
- MathsModule: 13 × O(connections) → 1 × O(connections) + 13 × O(1)
- Memory: Set created once per module per connection change, shared across all port checks

### Fix 10: Consolidate rAF loops — useCanvasLoop hook (2026-04-05)

**Problem:** 5 modules (Monitor, Scope, Output, Console, Life) each ran their own `requestAnimationFrame` loop + `ResizeObserver`. 5 independent rAF callbacks = 5 function calls per frame, 5 timestamp resolutions, 5 separate ResizeObservers.

**After:**
- New `useCanvasLoop(canvasRef, drawFn)` hook in `src/hooks/useCanvasLoop.js`. Module-level singleton: one `Set` of draw callbacks, one rAF loop. Auto-starts when first consumer mounts, auto-stops when last unmounts.
- ResizeObserver per canvas handled inside the hook.
- All 5 modules converted: MonitorModule, ScopeModule, OutputModule, ConsoleModule, LifeModule.
- Draw functions unchanged — same logic, just called from shared loop.

**Measurable impact:**
- rAF callbacks: 5/frame → 1/frame
- ResizeObserver setup: 5 separate effects → 5 within shared hook (same count but cleaner teardown)
- Guaranteed consistent execution order (Set iteration order = insertion order)
