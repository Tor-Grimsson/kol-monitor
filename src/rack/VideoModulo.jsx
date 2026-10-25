import { useRef, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import usePersistedState from '../hooks/usePersistedState'
import { usePatchRouting } from '../hooks/usePatchRouting.jsx'
import { useCasePower } from '../hooks/useCasePower.jsx'
import { useRack } from '../hooks/useRackContext.jsx'
import { useKeybindings } from '../hooks/useKeybindings'
import { patches } from '../data/patches'
import { isSavedId, findSaved } from '../hooks/useLibraryStore'
import RackViewport from './RackViewport.jsx'
import ModuloSidebar from './ModuloSidebar.jsx'
import ModuleSearch from './ModuleSearch.jsx'
import PatchTableOverlay from '../overlays/PatchTableOverlay.jsx'
import { Icon } from '@kolkrabbi/kol-icons'
import Button from '../components/atoms/Button'
import IconToggle from '@kolkrabbi/kol-component/atoms/IconToggle'
import { Tooltip } from '@kolkrabbi/kol-component/utilities/Popover'

/* ADD MODULE IS THE SEARCH MODAL (user 2026-10-02: *"didnt we just make a search modal?"*) —
 * `ModuleSearch`, shared with Create, categories first (plan 14 W2). */

function VideoModuloInner() {
  const { presetName } = useParams()
  const routing = usePatchRouting()
  const { toggleAll } = useCasePower()
  const rack = useRack()
  const [zoom, setZoom] = usePersistedState('rack-zoom', 1)
  /* the rack's `H` Rail — over the rack on the right; the shell rail stays (plan 16 W5 reverses the 2026-08-27
     "never show together" ruling, so the sidebar no longer hides the nav) */
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewLocked, setViewLocked] = useState(false)
  const viewLockedRef = useRef(false)
  const [cableLocked, setCableLocked] = usePersistedState('rack-cableLocked', false)
  const [cableVisibility, setCableVisibility] = usePersistedState('rack-cableVis', 'trans')
  const [showLibrarySearch, setShowLibrarySearch] = useState(false)
  const [showPatchTable, setShowPatchTable] = useState(false)
  const [displayHidden, setDisplayHidden] = usePersistedState('rack-displayHidden', true)

  const rackRef2 = useRef(rack)
  rackRef2.current = rack

  useKeybindings({ setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef: rackRef2, toggleAll, setCableLocked, setCableVisibility, setDisplayHidden, setShowLibrarySearch, setShowPatchTable })

  // Load preset from URL param on mount, or init if bare /rack
  const presetLoadedRef = useRef(null)
  useEffect(() => {
    const key = presetName || '__init__'
    if (presetLoadedRef.current === key) return
    presetLoadedRef.current = key
    let p
    if (presetName === 'custom') {
      try { p = JSON.parse(sessionStorage.getItem('customPatch')) } catch {}
    } else if (isSavedId(presetName)) {
      p = findSaved(presetName)?.data // a saved patch from the library (plan 13 W7)
    } else if (presetName) {
      const key = presetName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      p = patches[key] || patches[presetName]
    } else {
      // Only load init if rack has no modules (fresh or after reset)
      const hasModules = rack.rows.some(r => r.modules.length > 0)
      if (hasModules) return
      p = patches.init
    }
    if (!p) return
    /* the loaded patch names the case, so Save keeps its name instead of "Untitled" */
    if (presetName && presetName !== 'custom') sessionStorage.setItem('caseName', JSON.stringify(p.name || presetName))
    requestAnimationFrame(() => {
      rack.loadPreset(p)
      if (p.connections) routing.loadPatch(p.connections)
    })
  }, [presetName, rack, routing])

  return (
    /* the rack root is not a PageShell — it reads the shell's page wash itself (kol-shell 0.11.0) */
    <div className="flex relative" style={{ '--kol-shell-page-wash': 'var(--kol-fg-04)', backgroundColor: 'var(--kol-shell-page-wash, var(--kol-surface-primary))', overflow: 'hidden', height: '100vh' }}>
      <ModuloSidebar
        open={sidebarOpen}
        rack={rack}
        routing={routing}
        zoom={zoom}
        onZoomChange={setZoom}
        onHide={() => setSidebarOpen(false)}
        cableVisibility={cableVisibility}
        onCableVisibility={setCableVisibility}
        cableLocked={cableLocked}
        onCableLocked={setCableLocked}
      />

      {!sidebarOpen && !displayHidden && (
        <Button variant="nav" size="sm" className="fixed z-50" style={{ left: 60, top: 16 }} onClick={() => setSidebarOpen(true)}>
          [Show]
        </Button>
      )}

      {!sidebarOpen && !displayHidden && <div className="fixed z-50 select-none" style={{ bottom: 16, left: 60, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, transition: 'left 0.15s' }}>
        <div className="kol-helper-12 text-fg-48" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          [Cables
          {/* the sidebar's pair (ModuloSidebar): lock is a toggle, visibility cycles three states */}
          <IconToggle size="sm" tone="danger" pressed={cableLocked} onChange={(v) => setCableLocked(v)} icon="unlock" iconOn="lock" label="Cable lock" iconComponent={Icon} />
          <Tooltip label="Cable visibility" triggerClassName="inline-flex shrink-0">
            <Button variant="nav" size="sm" iconOnly={cableVisibility === 'on' ? 'cable-on' : cableVisibility === 'off' ? 'cable-off' : 'cable-trans'} iconSize={14} aria-label="Cable visibility" onClick={() => setCableVisibility(v => v === 'on' ? 'off' : v === 'off' ? 'trans' : 'on')} />
          </Tooltip>]
        </div>
      </div>}

      <PatchTableOverlay open={showPatchTable} rows={rack.rows} onClose={() => setShowPatchTable(false)} />

      <ModuleSearch open={showLibrarySearch} onClose={() => setShowLibrarySearch(false)} rows={rack.rows} capacity={rack.caseHp} onAdd={rack.addModule} />

      {!displayHidden && <Button
        size="sm"
        className="fixed z-50"
        style={{ bottom: 16, right: 16 }}
        onClick={() => setViewLocked(v => { viewLockedRef.current = !v; return !v })}
      >
        [{viewLocked ? 'Locked' : 'Lock'}]
      </Button>}

      <RackViewport style={{ minHeight: '100vh' }} viewLockedRef={viewLockedRef} />
    </div>
  )
}

export default function VideoModulo() {
  return <VideoModuloInner />
}
