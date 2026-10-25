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
import { stages, STAGE_KEYS, cvConnections, STAGE_OUT_ID, STAGE_CV_ID } from '../data/stages'
import { isSavedId, findSaved, addToLibrary } from '../hooks/useLibraryStore'
import { snapshotPatch } from '../hooks/usePatchFile'
import Button from '@kolkrabbi/kol-component/atoms/Button'
import Dropdown from '@kolkrabbi/kol-component/molecules/Dropdown'
import { LabeledControlSection, SettingsRow, SettingsSwitch } from '@kolkrabbi/kol-component/organisms/SettingsPanel'
import Rail, { useRailKey } from '@kolkrabbi/kol-component/molecules/Rail'
import { RailHeader } from '@kolkrabbi/kol-component/organisms/RailKit'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import StageCanvas from '../stage/StageCanvas.jsx'
import StageParams, { MarkList } from '../stage/StageParams.jsx'
import StageDock from '../stage/StageDock.jsx'
import StageBezel from '../stage/StageBezel.jsx'
import FpsChip from '../components/FpsChip.jsx'
import Workbench from '../rack/Workbench.jsx'
import { toggleTransport } from '../hooks/transport.js'
import PatchTableOverlay from '../overlays/PatchTableOverlay.jsx'
import PatchCableOverlay from '../modules/utility/PatchCableOverlay.jsx'
import LabeledJack from '../modules/parametric/LabeledJack'
import { usePanZoom } from '../stage/usePanZoom'
import { useNarrow } from '../hooks/useNarrow.js'
import { useFloating } from '../stage/useFloating'
import { useDotGrid, DOT_GRID_SIZE, DOT_GRID_IMAGE } from '../hooks/useDotGrid.js'

// Keying the view on the stage is what resets the marks: `useState` seeds from
// the new stage's list on remount, so there is no reset effect to keep honest.
/* The CRT top-left, the marked faders (the stage cv module) beside it, the patch beneath. These are
   the LOAD positions — everything moves freely after that. The board's SIZE is
   measured, not declared: the dock's width is whatever the stage's patch adds
   up to in HP, and the CRT's height falls out of its aspect. */
const AT = {
  bezel: { x: 0, y: 0 },
  cv: { x: 940, y: 0 },
  dock: { x: 0, y: 640 },
}

/* a shipped stage by key, or a SAVED one by its library id (plan 16 W7.1) — the same object either way */
export default function StagePage() {
  const { stageName } = useParams()
  const saved = isSavedId(stageName) ? findSaved(stageName) : null
  if (saved?.kind === 'stage') return <StageView key={saved.id} stageKey={saved.id} stage={saved.data} />
  const key = stages[stageName] ? stageName : STAGE_KEYS[0]
  return <StageView key={key} stageKey={key} stage={stages[key]} />
}

function StageView({ stageKey, stage }) {
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
  /* the background video starts OFF (plan 16 W6.3): the stage's ground is the rack's — the page wash and the dot
     grid — and the video, when `V` turns it on, is the picture over it */
  const [bgVideo, setBgVideo] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showPatchTable, setShowPatchTable] = useState(false)
  const [showFps, setShowFps] = useState(false)
  const [gridOn, setGridOn] = useState(true)
  /* `B`: everything off the picture but the output — the CRT, the faders and the patch hide */
  const [outputOnly, setOutputOnly] = useState(false)

  /* the module layer is an infinite canvas, like the rack: space + drag pans,
     wheel pans, ⌥ + wheel zooms, `0` resets. The VIDEO never moves — it is the
     background, not part of the world (user, 2026-08-28). */
  const dotGrid = useDotGrid(true)
  const surfaceRef = useRef(null)
  /* the three objects laid out as one board, then zoomed to fit the window so
     the whole stage is in view on load (user, 2026-08-28) */
  const initialPan = useRef({ x: 40, y: 40 }).current
  const { zoom, pan, setZoom, setPan, onPointerDown } = usePanZoom(surfaceRef, initialPan, 1, () => toggleTransport(connectionsRef.current, modulesRef))
  const boardRef = useRef(null)

  /* every object moves on its own — grab its body, no handle (user, 2026-08-28) */
  /* THE PHONE STAGE (2026-09-02): the video, the dock at a readable zoom, the faders,
     a Play button. The CRT bezel (900px) and the clock (300px) are desk objects —
     fitting them shrank the whole board to a 0.07 stamp at 390. */
  const narrow = useNarrow()
  const bezel = useFloating({ ...AT.bezel, scale: 1 })
  const cv = useFloating({ ...AT.cv, scale: 1 })
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

  /* THE STAGE'S KEYS (plan 16 W6.2 + 6.8) — the rack's where they mean the same: `M` all modules, Space the transport
     (usePanZoom's clean tap), `F` fps, `P` patch table, `E` the bottom Rail; and the stage's own: `H` its settings Rail,
     `V` the background video, `G` the dots, `B` output only. `,` is the app's Settings again — the stage's settings are
     `H` (user 2026-10-24: "settings has, and shouldnt change"). */
  /* H · P · E are the rails' roles' keys (RailRolesOnMonitor 2026-10-25) */
  useRailKey('page', () => setSettingsOpen(v => !v))
  useRailKey('patch', () => setShowPatchTable(v => !v))
  useRailKey('bottom', () => { const r = rackRef.current; r.setEditMode(!r.editMode) })
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest('input, textarea, [contenteditable]')) return
      const act = {
        m: () => toggleAllRef.current(),
        f: () => setShowFps(v => !v),
        v: () => setBgVideo(v => !v),
        g: () => setGridOn(v => !v),
        b: () => setOutputOnly(v => !v),
      }[e.key.toLowerCase()]
      if (!act) return
      e.preventDefault()
      act()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* SAVE THE STAGE (plan 16 W7.1): the patch as the rack saves it, minus the stage's own cables (the faders' and the
     monitor's — regenerated from `cv` and `tap` on load), plus the stage's fields. The CRT's frame is its cover. */
  const saveStage = () => {
    const own = (c) => c.fromModuleId === STAGE_CV_ID || c.toModuleId === STAGE_OUT_ID
    const snap = snapshotPatch(rack, routing.connections.filter(c => !own(c)), modulesRef, `${stage.label} copy`)
    const data = { ...snap, label: snap.name, trails: stage.trails ?? 0, tap: tap ?? stage.tap, cv: marks }
    let thumb
    try { thumb = document.querySelector('[data-stage-screen] canvas')?.toDataURL('image/png') } catch { /* tainted or absent — no cover */ }
    const item = addToLibrary(data, { kind: 'stage', thumb })
    navigate(`/stage/${item.id}`)
  }

  // Delete on the stage's bottom Rail and menu: the module and its cables (plan 16 W1)
  const deleteModule = (id) => { routing.removeModuleConnections(id); rack.deleteModule(id) }

  return (
    <RenderControlProvider value={controlRef}>
      {/* fixed, not in flow: the video is the whole window, rail included — the
          rail carries its own z-index and paints over it */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden" style={{ backgroundColor: 'var(--kol-fg-04)' }}>
        {bgVideo && <StageCanvas tap={tap} trails={stage.trails ?? 0} background="#1f1f1f" />}

        {/* THE ROW IS KEYS NOW (plan 16 W6.8). A phone has no keyboard, so it keeps Play and the settings Rail. */}
        {narrow && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-end gap-2 pointer-events-none *:pointer-events-auto">
            <Button tone="grey" size="md" onClick={toggleAll}>{allEnabled ? 'Stop' : 'Play'}</Button>
            <Button tone="grey" size="md" iconOnly="settings-01" aria-label="Stage settings" onClick={() => setSettingsOpen(true)} />
          </div>
        )}

        <PatchTableOverlay open={showPatchTable} rows={rack.rows} onClose={() => setShowPatchTable(false)} />

        {/* THE STAGE'S SETTINGS (plan 16 W6.4) — the rail kit's app tier (plan 17 W3.2), over the picture, `H` */}
        <Rail role="page" open={settingsOpen} onClose={() => setSettingsOpen(false)} header={<RailHeader title="Stage" />}>
          <div className="flex flex-col gap-5">
          <SettingsRow label="Stage" align="fill">
            <Dropdown
              options={STAGE_KEYS.map(k => ({ value: k, label: stages[k].label }))}
              value={stages[stageKey] ? stageKey : undefined}
              onChange={k => navigate(`/stage/${k}`)}
              variant="grey"
            />
          </SettingsRow>
          <SettingsRow label="Save">
            <Button tone="grey" size="sm" onClick={saveStage}>Save to library</Button>
          </SettingsRow>
          <SettingsRow label="Running" hint="Space">
            <SettingsSwitch on={allEnabled} onChange={toggleAll} label="Running" />
          </SettingsRow>
          <SettingsRow label="Modules">
            <SettingsSwitch on={dockOpen} onChange={() => setDockOpen(v => !v)} label="Modules" />
          </SettingsRow>
          <SettingsRow label="Background video" hint="V">
            <SettingsSwitch on={bgVideo} onChange={() => setBgVideo(v => !v)} label="Background video" />
          </SettingsRow>
          <SettingsRow label="Grid dots" hint="G">
            <SettingsSwitch on={gridOn} onChange={() => setGridOn(v => !v)} label="Grid dots" />
          </SettingsRow>
          <SettingsRow label="Output only" hint="B">
            <SettingsSwitch on={outputOnly} onChange={() => setOutputOnly(v => !v)} label="Output only" />
          </SettingsRow>
          <SettingsRow label="Theme">
            <ThemeToggle fill="subtle" size="sm" />
          </SettingsRow>
          {/* Mark parameters — every CV input in the patch; a marked one gets a fader on the stage cv module */}
          <LabeledControlSection label="Mark parameters" divided>
            <MarkList marks={marks} onMarks={setMarks} rows={rack.rows} />
          </LabeledControlSection>
          </div>
        </Rail>

        <FpsChip show={showFps} />

        {/* the rack's bottom Rail, on the stage (plan 16 W6.4): `E` edits the stage's case */}
        <Workbench
          open={!!rack.editMode}
          onClose={() => rack.setEditMode(false)}
          modules={rack.workbench}
          rows={rack.rows}
          caseHp={rack.caseHp}
          onSetCaseHp={rack.setCaseHp}
          onAddModule={rack.addModule}
          onReturn={rack.returnFromWorkbench}
          onPark={rack.sendToWorkbench}
          onDelete={deleteModule}
          onAddRow={rack.addRow}
          onRemoveRow={rack.removeRow}
          onSetRowHeight={rack.setRowHeight}
        />

        <div
          ref={surfaceRef}
          onPointerDown={onPointerDown}
          className="absolute inset-0 z-10 overflow-hidden"
          style={{ touchAction: 'none', ...(dotGrid && gridOn ? {
            backgroundImage: DOT_GRID_IMAGE,
            backgroundSize: `${DOT_GRID_SIZE * zoom}px ${DOT_GRID_SIZE * zoom}px`,
            backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`,
          } : null) }}
        >
          <div ref={boardRef} className="relative w-max" style={{ zoom, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            {/* board level, not the dock: a cable runs from a module to the MONITOR,
                and the two are separate objects on this board (2026-09-02) */}
            <PatchCableOverlay containerRef={boardRef} />
            <div className={`absolute cursor-grab transition-opacity duration-200 ${outputOnly ? 'opacity-0 pointer-events-none' : ''}`} onPointerDown={bezel.onDrag} style={{ left: bezel.box.x, top: bezel.box.y }}>
              <StageBezel
                tally={monitorOn}
                onPower={() => setMonitorOn(v => !v)}
                style={{ width: 900 }}
                jack={<LabeledJack type="in" port="in" moduleId={STAGE_OUT_ID} active={!!monitorCable} label="in" />}
              >
                {monitorOn && <StageCanvas tap={tap} trails={stage.trails ?? 0} background="#1f1f1f" />}
              </StageBezel>
            </div>
            {!narrow && <div className={`absolute cursor-grab transition-opacity duration-200 ${outputOnly ? 'opacity-0 pointer-events-none' : ''}`} onPointerDown={cv.onDrag} style={{ left: cv.box.x, top: cv.box.y }}>
              <StageParams marks={marks} />
            </div>}
            <div className="absolute" data-stage-dock style={{ left: dock.box.x, top: dock.box.y }}>
              <StageDock rows={rack.rows} open={dockOpen && !outputOnly} onGrab={dock.onDrag} />
            </div>
          </div>
        </div>
      </div>
    </RenderControlProvider>
  )
}
