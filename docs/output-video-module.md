# Video Recorder Module Plan

## Context

The modular video synth needs video export. Heavy patches drop below 60fps but users need frame-perfect high-res output. Two modes are required: **realtime** (captures at actual performance speed) and **offline** (steps frame-by-frame with fixed dt, guaranteeing target fps regardless of render cost).

## Architecture Overview

```
useRenderLoop (modified)
  ├── tick() — existing rAF loop, calls processFrame()
  ├── processFrame(dt, t) — extracted module evaluation logic
  └── controlRef — { stepFrame, pause, resume } for offline mode

RenderControlContext (new)
  └── Provides controlRef to RecorderModule

RecorderModule (new, 20HP, 3U, display category)
  ├── Same inputs as OutputModule (a, b, c, d, pen, bg)
  ├── Preview canvas (aspect-ratio accurate, in module panel)
  ├── Hidden recording canvas (target resolution, e.g. 3840x2160)
  ├── Realtime: draws + captures each frame via useCanvasLoop
  └── Offline: pause render loop → step frame-by-frame → resume
```

## Resolution Matrix

Short edge = resolution preset. Aspect ratio determines dimensions. Scale is always uniform (logicalW/logicalH matches aspect).

| Preset | 16:9 | 1:1 | 9:16 | 4:5 | 5:4 | 3:5 | 5:3 |
|--------|------|-----|------|-----|-----|-----|-----|
| 2160 | 3840x2160 | 2160x2160 | 2160x3840 | 2160x2700 | 2700x2160 | 2160x3600 | 3600x2160 |
| 1440 | 2560x1440 | 1440x1440 | 1440x2560 | 1440x1800 | 1800x1440 | 1440x2400 | 2400x1440 |
| 1080 | 1920x1080 | 1080x1080 | 1080x1920 | 1080x1350 | 1350x1080 | 1080x1800 | 1800x1080 |
| 720 | 1280x720 | 720x720 | 720x1280 | 720x900 | 900x720 | 720x1200 | 1200x720 |

## Implementation Steps

### Step 1: Refactor useRenderLoop.js

Extract module evaluation from `tick()` into `processFrame(dt, t)`:
- `processFrame` contains lines 85-171 (graph cache, module eval, buffer swap)
- `tick` calls `processFrame` then does timing/fps/scheduling
- Add `steppedT` ref for offline time accumulator
- Return `controlRef` with:
  - `stepFrame(dt)` — calls processFrame(dt, steppedT), increments steppedT
  - `pause()` — cancels rAF
  - `resume()` — resets lastFrameRef to 0 (prevents dt jump), restarts rAF

**File:** `src/hooks/useRenderLoop.js`

### Step 2: Create RenderControlContext

Minimal context, one file. Provides the controlRef from useRenderLoop to child modules.

**New file:** `src/hooks/useRenderControl.jsx`

```jsx
// createContext + Provider + useRenderControl hook
// value = controlRef from useRenderLoop
```

### Step 3: Wire context in VideoModulo.jsx

- Capture `controlRef` from `useRenderLoop` return value (line 53)
- Wrap children in `<RenderControlProvider value={controlRef}>`

**File:** `src/VideoModulo.jsx`

### Step 4: Build RecorderModule

**New file:** `src/modules/display/RecorderModule.jsx` — 20HP, 3U

**Inputs:** a, b, c, d, pen, bg (same as OutputModule, no outputs)

**Module state:**
- resolution: 1080 (720/1080/1440/2160)
- fps: 60 (30/60)
- aspect: '16:9' (1:1, 3:5, 4:5, 9:16, 16:9, 5:3, 5:4)
- mode: 'rt' (rt/offline)
- status: 'idle' (idle/recording/rendering/done)
- duration: 10 (seconds, for offline mode)
- progress: 0 (0-1)
- blobUrl: null (download link after recording)

**UI layout (vertical, top to bottom):**
```
┌──────────────────────────────────┐
│  Rec                        [●]  │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │                            │  │  ← preview canvas
│  │        PREVIEW             │  │    (CSS aspect-ratio matches selection)
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  [1080] [60] [16:9]             │  ← 3 Selector controls in a row
│  [10s]       [RT ◆ OFF]        │  ← duration knob + mode FlipToggle
│                                  │
│  [●REC] [■STOP]      [↓SAVE]   │  ← transport (IconButton or Toggle)
│  ████████████░░░░░░░ 65%        │  ← progress bar + percentage
│                                  │
│  ────────────────────────────── │
│  (a) (b) (c) (d) (pen) (bg)    │  ← input jacks (LabeledJack)
└──────────────────────────────────┘
```

**Recording canvas (hidden):**
- Created as DOM element, hidden via `visibility:hidden; position:absolute`
- Sized to target resolution via canvas.width/height attributes
- Used for `captureStream(0)` + MediaRecorder

**High-res drawing approach:**
- Compute logical dimensions matching aspect: `logicalW = 240`, `logicalH = 240 * aspectH / aspectW`
- Scale factor: `scale = targetWidth / logicalW` (uniform, since aspects match)
- `ctx.scale(scale, scale)` → call `drawSignal(ctx, signal, 0, 0, logicalW, logicalH, ...)` unchanged
- All pixel values (line widths, fonts, padding) scale proportionally via the transform

**Realtime recording flow:**
1. Create recording canvas at target resolution
2. `captureStream(0)` → MediaRecorder (VP9, high bitrate)
3. In useCanvasLoop draw callback: draw to recording canvas + `track.requestFrame()`
4. User presses STOP → recorder.stop() → blob → download URL

**Offline recording flow:**
1. Create recording canvas at target resolution
2. `captureStream(0)` → MediaRecorder (VP9, high bitrate)
3. `controlRef.pause()` — stop rAF render loop
4. Stepping loop (MessageChannel for zero-delay scheduling):
   a. `controlRef.stepFrame(1/fps)` — process all modules with fixed dt
   b. Draw to recording canvas (inputRefs updated by process)
   c. `track.requestFrame()` — synchronous canvas snapshot
   d. Every 10 frames: yield via rAF for progress bar update
5. `controlRef.resume()` — restart rAF render loop
6. recorder.stop() → blob → download URL

**Bitrate by resolution:**
- 2160: 50 Mbps
- 1440: 30 Mbps
- 1080: 15 Mbps
- 720: 8 Mbps

**Codec detection:**
- Check `MediaRecorder.isTypeSupported('video/webm;codecs=vp9')` → VP9
- Fallback to `'video/webm;codecs=vp8'` → VP8

**File naming:** `kol-{resolution}p-{fps}fps-{aspect}.webm`

### Step 5: Register module

**File:** `src/moduleRegistry.js`
- Import RecorderModule
- Add to MODULE_DEFS: `recorder: { component: RecorderModule, hp: 20, u: 3, category: 'display', label: 'Recorder', description: '...' }`

**File:** `src/hooks/useRackState.js`
- NOT added to default rows (users add via edit mode when needed)
- The output module isn't in default rows either — same pattern

### Step 6: Keyboard shortcut

**File:** `src/ShortcutsOverlay.jsx` + `src/hooks/useKeybindings.js`
- Add `R` for record toggle (starts/stops recording on the active recorder module)

## Key Reuse

| Existing | Reused For |
|----------|-----------|
| `drawSignal()` from `src/modules/display/drawSignal.js` | High-res canvas rendering, zero modifications |
| `useModule()` from `src/hooks/useModuleRegistry.jsx` | Module registration, process loop |
| `useCanvasLoop()` from `src/hooks/useCanvasLoop.js` | Preview canvas + realtime recording draw |
| `useModuleEnabled()` from `src/hooks/useModuleEnabled.js` | Power toggle |
| `useConnectedPorts()` from `src/hooks/usePatchRouting.jsx` | Jack active state |
| `LabeledJack`, `Knob`, `FlipToggle`, `Divider` | UI controls |
| OutputModule's process pattern | Signal storage + history ring buffer |
| `Selector` or `Dropdown` components | Resolution/FPS/aspect selection |

## Edge Cases

- **Resume after offline**: Reset `lastFrameRef` to 0 to prevent large dt jump
- **4K memory**: ~33MB GPU for canvas, stream chunks via `MediaRecorder.start(1000)` timeslice
- **Hidden canvas**: Use `visibility:hidden; position:absolute` (NOT `display:none`)
- **VP9 unavailable**: Fall back to VP8, display codec in status
- **Canvas loop during offline**: Continues running (harmless, shows last frame)
- **Clock/LFO modules in offline**: Work correctly because they use `dt`/`t` from process(), not wall clock

## Verification

1. Add RecorderModule to rack via edit mode
2. Patch generators → recorder inputs (same as patching to OutputModule)
3. Preview canvas shows correct aspect ratio and signal rendering
4. **Realtime test**: Set RT mode, press REC, let it run 5 seconds, press STOP, download WebM — verify plays correctly in browser
5. **Offline test**: Set Offline mode, 1080p, 60fps, 5 seconds duration — press REC, watch progress bar, download — verify smooth 60fps playback even with heavy patch
6. **Resolution test**: Record at 720p and 2160p — verify correct dimensions with `ffprobe` or browser video info
7. **Aspect test**: Record at 1:1 and 9:16 — verify correct dimensions
8. **Performance**: Run with Perf module showing <60fps, record offline — output should be smooth 60fps
