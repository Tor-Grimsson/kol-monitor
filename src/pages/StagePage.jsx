// StagePage — one patch, at performance size.
//
// The rack shows you an instrument; the stage shows you what it makes. The
// video is the page: a fixed 100vw × 100vh canvas that everything else floats
// over. The patch lives in a draggable, scalable dock with no chrome of its
// own, and the parameters you mark live in a panel that opens from a button.
//
// It is a peer of RackViewport, not a mode of it: same hooks, same render loop,
// none of the pan / zoom / snap / workbench machinery. `/stage` sits under its
// OWN RackProvider in the router, so loading a stage never overwrites the rack.

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { usePatchRouting } from '../hooks/usePatchRouting.jsx'
import { useCasePower } from '../hooks/useCasePower.jsx'
import { useRack } from '../hooks/useRackContext.jsx'
import { useRenderLoop } from '../hooks/useRenderLoop'
import { RenderControlProvider } from '../hooks/useRenderControl'
import { stages, STAGE_KEYS, cvConnections, STAGE_OUT_ID } from '../data/stages'
import Button from '@kolkrabbi/kol-component/atoms/Button'
import Dropdown from '@kolkrabbi/kol-component/molecules/Dropdown'
import { SettingsRow, SettingsSwitch } from '@kolkrabbi/kol-component/organisms/SettingsPanel'
import ShellDrawer from '@kolkrabbi/kol-component/molecules/ShellDrawer'
import Divider from '@kolkrabbi/kol-component/atoms/Divider'
// deep import is legal since kol-framework 0.20.0 — the seam SettingsPage uses
import ThemeToggle from '@kolkrabbi/kol-framework/src/ThemeToggle.jsx'
import StageCanvas from '../stage/StageCanvas.jsx'
import StageParams from '../stage/StageParams.jsx'
import StageDock from '../stage/StageDock.jsx'
import StageBezel from '../stage/StageBezel.jsx'
import StageClock from '../stage/StageClock.jsx'
import PatchTableOverlay from '../overlays/PatchTableOverlay.jsx'
import PatchCableOverlay from '../modules/utility/PatchCableOverlay.jsx'
import LabeledJack from '../modules/parametric/LabeledJack'
import { usePanZoom } from '../stage/usePanZoom'
import { useNarrow } from '../hooks/useNarrow.js'
import Icon from '../icons/Icon'
import { useFloating } from '../stage/useFloating'
import { useDotGrid, DOT_GRID_SIZE, DOT_GRID_IMAGE } from '../hooks/useDotGrid.js'

// Keying the view on the stage is what resets the marks: `useState` seeds from
// the new stage's list on remount, so there is no reset effect to keep honest.
/* The CRT top-left, the clock module beside it, the patch beneath. These are
   the LOAD positions — everything moves freely after that. The board's SIZE is
   measured, not declared: the dock's width is whatever the stage's patch adds
   up to in HP, and the CRT's height falls out of its aspect. */
const AT = {
  bezel: { x: 0, y: 0 },
  clock: { x: 940, y: 0 },
  dock: { x: 0, y: 640 },
}

export default function StagePage() {
  const { stageName } = useParams()
  const key = stages[stageName] ? stageName : STAGE_KEYS[0]
  return <StageView key={key} stageKey={key} />
}

function StageView({ stageKey }) {
  const stage = stages[stageKey]
  const navigate = useNavigate()

  const registry = useModuleRegistry()
  const { modulesRef } = registry
  const routing = usePatchRouting()
  const { connectionsRef } = routing
  const { power, timingRef, allEnabled, toggleAll } = useCasePower()
  /* The monitor is a headless one-input module: registering it is what lets a
     cable land on it and what names it in the patch table. It consumes only —
     the picture is read from whatever is patched in, below. */
  useEffect(() => {
    // registry identity is stable — this registers once per stage view
    registry.register({ id: STAGE_OUT_ID, inputs: { in: { type: 'any' } }, outputs: {}, process: () => ({}) })
    return () => registry.unregister(STAGE_OUT_ID)
  }, [registry])

  /* what the screen shows = whatever is patched into the monitor's input */
  const monitorCable = routing.connections.find(c => c.toModuleId === STAGE_OUT_ID && c.toPort === 'in')
  const tap = monitorCable ? { module: monitorCable.fromModuleId, port: monitorCable.fromPort } : null
  const rack = useRack()

  const { controlRef } = useRenderLoop(modulesRef, connectionsRef, power, timingRef)

  const [dockOpen, setDockOpen] = useState(true)
  /* two pictures, two switches (user, 2026-09-02): the bezel's power button is the
     MONITOR's — it lights the CRT and nothing else; the background video has its
     own button in the bottom row. Neither starts or stops the case. */
  const [monitorOn, setMonitorOn] = useState(true)
  const [bgVideo, setBgVideo] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showPatchTable, setShowPatchTable] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  elapsedRef.current = elapsed

  /* the module layer is an infinite canvas, like the rack: space + drag pans,
     wheel pans, ⌥ + wheel zooms, `0` resets. The VIDEO never moves — it is the
     background, not part of the world (user, 2026-08-28). */
  const dotGrid = useDotGrid(true)
  const surfaceRef = useRef(null)
  /* the three objects laid out as one board, then zoomed to fit the window so
     the whole stage is in view on load (user, 2026-08-28) */
  const initialPan = useRef({ x: 40, y: 40 }).current
  const { zoom, pan, setZoom, setPan, onPointerDown } = usePanZoom(surfaceRef, initialPan)
  const boardRef = useRef(null)

  /* every object moves on its own — grab its body, no handle (user, 2026-08-28) */
  /* THE PHONE STAGE (2026-09-02): the video, the dock at a readable zoom, the faders,
     a Play button. The CRT bezel (900px) and the clock (300px) are desk objects —
     fitting them shrank the whole board to a 0.07 stamp at 390. */
  const narrow = useNarrow()
  const bezel = useFloating({ ...AT.bezel, scale: 1 })
  const clock = useFloating({ ...AT.clock, scale: 1 })
  const dock = useFloating({ ...AT.dock, scale: 1 })
  const [marks, setMarks] = useState(() => stage.cv || [])

  // A stage loads STOPPED. `toggleAll` is the case's own master switch (the
  // rack's `m`), so play arms every module in the patch through the path they
  // already listen on — no per-module enable to keep in sync.
  const playingRef = useRef(allEnabled)
  playingRef.current = allEnabled

  const rackRef = useRef(rack)
  rackRef.current = rack
  const toggleAllRef = useRef(toggleAll)
  toggleAllRef.current = toggleAll

  // Rows first, one frame ahead of the cables so the jacks exist to land on.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      rackRef.current.loadPreset(stage)
      // Modules mounting while the case is already on stay off — useModuleEnabled
      // only follows a CHANGE — so a stage swap comes back to a stopped case
      // rather than a stop button over a dead picture.
      if (playingRef.current) toggleAllRef.current()
    })
    return () => cancelAnimationFrame(id)
  }, [stage])

  // The marks ARE the patch's CV half: one cable per fader, regenerated whenever
  // the set changes. Cables drawn by hand in the dock do not survive a re-mark.
  const routingRef = useRef(routing)
  routingRef.current = routing
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      routingRef.current.loadPatch([
        ...stage.connections,
        ...cvConnections(marks),
        // the stage's own `tap` is just the monitor's LOAD cable now
        { fromModuleId: stage.tap.module, fromPort: stage.tap.port, toModuleId: STAGE_OUT_ID, toPort: 'in' },
      ])
    })
    return () => cancelAnimationFrame(id)
  }, [stage, marks])

  // the CRT's counter — 10/s is plenty for a readout and costs nothing
  useEffect(() => {
    if (!allEnabled) return
    const started = performance.now() / 1000 - elapsedRef.current
    const id = setInterval(() => setElapsed(performance.now() / 1000 - started), 100)
    return () => clearInterval(id)
  }, [allEnabled])

  /* Fit the board on load. Measured after layout, at zoom 1, off the objects'
     own boxes — the dock is as wide as the patch's HP and the CRT as tall as its
     aspect makes it, so neither is a number this file can know up front.
     Keyed on rack.rows as well as stage: the preset lands its rows on its OWN
     rAF, so a [stage]-only fit measured a half-built board once and never
     re-ran — first browser look (2026-09-01) found the whole stage at zoom
     0.16 against a phantom measurement. Rows landing = re-measure. */
  const rackRows = rack.rows
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = boardRef.current
      if (!el) return
      if (narrow) {
        /* the CRT and the dock (the clock is hidden), fitted to the WIDTH and
           pinned to the top — the height scrolls by pan, the bottom-right cluster
           stays clear (user, 2026-09-02: "where is the monitor, like on desktop") */
        let w = 0
        // HTMLElement only — the cable overlay is an <svg> and has no offsetLeft,
        // which turned the whole measurement into NaN and skipped the fit (2026-09-02)
        for (const child of el.children) { if (!(child instanceof HTMLElement)) continue; w = Math.max(w, child.offsetLeft + child.offsetWidth) }
        if (!w) return
        const pad = 12
        const fit = Math.min(1, (window.innerWidth - pad * 2) / w)
        setZoom(fit)
        setPan({ x: (window.innerWidth / fit - w) / 2, y: 64 / fit })
        return
      }
      let w = 0
      let h = 0
      for (const child of el.children) {
        if (!(child instanceof HTMLElement)) continue
        w = Math.max(w, child.offsetLeft + child.offsetWidth)
        h = Math.max(h, child.offsetTop + child.offsetHeight)
      }
      if (!w || !h) return
      const pad = 80
      const fit = Math.min(1, (window.innerWidth - pad * 2) / w, (window.innerHeight - pad * 2) / h)
      setZoom(fit)
      setPan({
        x: (window.innerWidth / fit - w) / 2,
        y: (window.innerHeight / fit - h) / 2,
      })
    })
    return () => cancelAnimationFrame(id)
  }, [stage, rackRows, narrow, setZoom, setPan])

  /* `h` hides the patch — the whole point is to get the modules off the picture.
     `,` opens THIS page's drawer instead of leaving for /settings. AppShell binds
     `,` globally (`settingsKey`, kol-shell 0.25.0) and it navigates; on a
     full-bleed performance view that throws away the picture, which is the case
     kol-shell 0.26.0's `useSettingsToggle` seam was cut for — fxr's `/editor`
     hit it first. CAPTURE phase + `stopImmediatePropagation` so the shell's
     window listener never sees it; the same preemption AppLayout uses for the
     ⌥-digit prefix. Matched on `e.code` too: ⌥+`,` is `≤` on macOS. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey) return
      if (e.target.closest('input, textarea, [contenteditable]')) return
      if (e.key === ',' || e.code === 'Comma') {
        e.preventDefault()
        e.stopImmediatePropagation()
        setSettingsOpen(v => !v)
        return
      }
      if (e.altKey) return
      if (e.key === 'h') { e.preventDefault(); setDockOpen(v => !v) }
      if (e.key === 'p') { e.preventDefault(); setShowPatchTable(v => !v) }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  return (
    <RenderControlProvider value={controlRef}>
      {/* fixed, not in flow: the video is the whole window, rail included — the
          rail carries its own z-index and paints over it */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#1f1f1f]">
        {bgVideo && <StageCanvas tap={tap} trails={stage.trails ?? 0} background="#1f1f1f" />}

        {/* one rung for the whole row — md, the MenuItem trigger's own h-8. Spans the
            bottom instead of shrink-to-fit: WebKit measures a DS icon-only button's
            intrinsic width as its glyph (22px, not the 32px rule) and squeezed the
            row; pointer-transparent so the empty run still pans (2026-09-02). */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-end gap-2 pointer-events-none *:pointer-events-auto">
          {narrow && <Button variant="grey" size="md" onClick={toggleAll}>{allEnabled ? 'Stop' : 'Play'}</Button>}
          <Button variant="grey" size="md" iconOnly={bgVideo ? 'video' : 'video-off'} iconComponent={Icon} aria-label="Background video" aria-pressed={bgVideo} onClick={() => setBgVideo(v => !v)} />
          {/* the rack's patch table (P) — cables by name, the sure path on a phone */}
          <Button variant="grey" size="md" iconOnly="list-02" iconComponent={Icon} aria-label="Patch table" aria-pressed={showPatchTable} onClick={() => setShowPatchTable(v => !v)} />
          {/* MenuItem's root is w-full — boxed so it takes the trigger's width, not the row's */}
          <div className="shrink-0"><StageParams marks={marks} onMarks={setMarks} rows={rack.rows} /></div>
          <Button variant="grey" size="md" iconOnly="settings-01" aria-label="Stage settings" onClick={() => setSettingsOpen(true)} />
        </div>

        {/* `ShellDrawer` directly, not `SettingsPanel`, for ONE reason: the
            organism hardcodes the scrim and the stage is a picture you are
            watching — dimming it to change a setting defeats the page (user,
            2026-08-28). `backdrop={false}` is ShellDrawer's own seam. The rows
            are still the organism's approved `SettingsRow` / `SettingsSwitch`.
            Worth a DS ask: SettingsPanel should forward `backdrop`. */}
        <PatchTableOverlay open={showPatchTable} rows={rack.rows} onClose={() => setShowPatchTable(false)} />

        {settingsOpen && (
          <ShellDrawer
            open
            side="right"
            width={380}
            backdrop={false}
            onClose={() => setSettingsOpen(false)}
            header={<span className="kol-helper-14 uppercase text-emphasis">Stage</span>}
          >
            <div className="flex flex-col gap-4">
            <Divider />
            <SettingsRow label="Stage" align="fill">
              <Dropdown
                options={STAGE_KEYS.map(k => ({ value: k, label: stages[k].label }))}
                value={stageKey}
                onChange={k => navigate(`/stage/${k}`)}
                variant="grey"
              />
            </SettingsRow>
            <SettingsRow label="Running">
              <SettingsSwitch on={allEnabled} onChange={toggleAll} label="Running" />
            </SettingsRow>
            <SettingsRow label="Modules" hint="H">
              <SettingsSwitch on={dockOpen} onChange={() => setDockOpen(v => !v)} label="Modules" />
            </SettingsRow>
            <SettingsRow label="Theme">
              <ThemeToggle fill="subtle" size="sm" />
            </SettingsRow>
            </div>
          </ShellDrawer>
        )}

        <div
          ref={surfaceRef}
          onPointerDown={onPointerDown}
          className="absolute inset-0 z-10 overflow-hidden"
          style={{ touchAction: 'none', ...(dotGrid ? {
            backgroundImage: DOT_GRID_IMAGE,
            backgroundSize: `${DOT_GRID_SIZE * zoom}px ${DOT_GRID_SIZE * zoom}px`,
            backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`,
          } : null) }}
        >
          <div ref={boardRef} className="relative w-max" style={{ zoom, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            {/* board level, not the dock: a cable runs from a module to the MONITOR,
                and the two are separate objects on this board (2026-09-02) */}
            <PatchCableOverlay containerRef={boardRef} />
            <div className="absolute cursor-grab" onPointerDown={bezel.onDrag} style={{ left: bezel.box.x, top: bezel.box.y }}>
              <StageBezel
                tally={monitorOn}
                onPower={() => setMonitorOn(v => !v)}
                style={{ width: 900 }}
                jack={<LabeledJack type="in" port="in" moduleId={STAGE_OUT_ID} active={!!monitorCable} label="in" />}
              >
                {monitorOn && <StageCanvas tap={tap} trails={stage.trails ?? 0} background="#1f1f1f" />}
              </StageBezel>
            </div>
            {!narrow && <div className="absolute cursor-grab" onPointerDown={clock.onDrag} style={{ left: clock.box.x, top: clock.box.y }}>
              <StageClock running={allEnabled} onToggle={toggleAll} onReset={() => setElapsed(0)} t={elapsed} />
            </div>}
            <div className="absolute" data-stage-dock style={{ left: dock.box.x, top: dock.box.y }}>
              <StageDock rows={rack.rows} open={dockOpen} onGrab={dock.onDrag} />
            </div>
          </div>
        </div>
      </div>
    </RenderControlProvider>
  )
}
