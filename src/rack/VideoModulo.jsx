import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { useNavHidden } from '@kolkrabbi/kol-shell'
import usePersistedState from '../hooks/usePersistedState'
import { usePatchRouting } from '../hooks/usePatchRouting.jsx'
import { useCasePower } from '../hooks/useCasePower.jsx'
import { useRack } from '../hooks/useRackContext.jsx'
import { useRailSlot } from '@kolkrabbi/kol-shell'
import { useKeybindings } from '../hooks/useKeybindings'
import { patches } from '../data/patches'
import { isSavedId, findSaved } from '../hooks/useLibraryStore'
import { ROW_WIDTH } from '../modules/utility/eurorack'
import RackViewport from './RackViewport.jsx'
import ModuloSidebar from './ModuloSidebar.jsx'
import RackRailPanel from './RackRailPanel.jsx'
import ModuleSearch from './ModuleSearch.jsx'
import PatchTableOverlay from '../overlays/PatchTableOverlay.jsx'
import { Icon } from '@kolkrabbi/kol-icons'
import Button from '../components/atoms/Button'
import IconToggle from '@kolkrabbi/kol-component/atoms/IconToggle'
import { Tooltip } from '@kolkrabbi/kol-component/utilities/Popover'

const BASE_WIDTH = ROW_WIDTH + 52

/* ADD MODULE IS THE SEARCH MODAL (user 2026-10-02: *"didnt we just make a search modal?"*) —
 * `ModuleSearch`, shared with Create, categories first (plan 14 W2). */

function VideoModuloInner() {
  const { presetName } = useParams()
  const routing = usePatchRouting()
  const { toggleAll } = useCasePower()
  const rack = useRack()
  const nav = useNavHidden()
  const rail = useRailSlot()
  const [zoom, setZoom] = usePersistedState('rack-zoom', 1)
  const [sidebarOpen, setSidebarOpenRaw] = useState(false)
  const sidebarOpenRef = useRef(false)
  const setSidebarOpen = useCallback((v) => {
    setSidebarOpenRaw(prev => {
      const val = typeof v === 'function' ? v(prev) : v
      sidebarOpenRef.current = val
      nav?.setNavHidden(val)
      return val
    })
  }, [nav])
  const [viewLocked, setViewLocked] = useState(false)
  const viewLockedRef = useRef(false)
  const [cableLocked, setCableLocked] = usePersistedState('rack-cableLocked', false)
  const [cableVisibility, setCableVisibility] = usePersistedState('rack-cableVis', 'trans')
  const [showLibrarySearch, setShowLibrarySearch] = useState(false)
  const [showPatchTable, setShowPatchTable] = useState(false)
  const [displayHidden, setDisplayHidden] = usePersistedState('rack-displayHidden', true)

  const rackRef2 = useRef(rack)
  rackRef2.current = rack
  const rackOuterRef = useRef(null)

  useKeybindings({ setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef: rackRef2, toggleAll, setCableLocked, setCableVisibility, setDisplayHidden, setShowLibrarySearch, setShowPatchTable })

  // Reset nav visibility when leaving rack
  const navRef = useRef(nav)
  navRef.current = nav
  useEffect(() => () => navRef.current?.setNavHidden(false), [])

  // Sidebar and rail are variants of one thing and never show together (user
  // ruling 2026-08-27). Forward sync lives in setSidebarOpen; this is the
  // reverse: the rail coming back on its own (`\` key, route change) closes
  // the sidebar. No loop — setSidebarOpen(false) writes navHidden=false, a no-op.
  const navHidden = nav?.navHidden
  useEffect(() => {
    if (navHidden === false && sidebarOpenRef.current) setSidebarOpen(false)
  }, [navHidden, setSidebarOpen])

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
    requestAnimationFrame(() => {
      rack.loadPreset(p)
      if (p.connections) routing.loadPatch(p.connections)
    })
  }, [presetName, rack, routing])

  return (
    /* the rack root is not a PageShell — it reads the shell's page wash itself (kol-shell 0.11.0) */
    <div className="flex relative" style={{ '--kol-shell-page-wash': 'var(--kol-fg-04)', backgroundColor: 'var(--kol-shell-page-wash, var(--kol-surface-primary))', overflow: 'hidden', height: '100vh' }}>
      {sidebarOpen && (
        <div className="sidebar-width flex-shrink-0 border-r border-fg-08 overflow-y-auto bg-surface-primary" style={{
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 40,
        }}>
          <ModuloSidebar
            rack={rack}
            routing={routing}
            zoom={zoom}
            onZoomChange={setZoom}
            onZoomFit={() => {
              const el = rackOuterRef.current
              if (el) setZoom(Math.min(2, Math.max(0.5, el.clientWidth / BASE_WIDTH)))
            }}
            onHide={() => setSidebarOpen(false)}
            cableVisibility={cableVisibility}
            onCableVisibility={setCableVisibility}
            cableLocked={cableLocked}
            onCableLocked={setCableLocked}
          />
        </div>
      )}

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

      {/* the module catalog, rendered here (inside RackProvider) but painted
        * inside the rail's opened width. The rail is outside this tree, so the
        * slot's node travels out through `useRailSlot` and the content goes
        * back in through the portal. */}
      {rail?.slot && createPortal(<RackRailPanel rack={rack} />, rail.slot)}


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

      <RackViewport style={{ minHeight: '100vh', marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0 }} viewLockedRef={viewLockedRef} />
    </div>
  )
}

export default function VideoModulo() {
  return <VideoModuloInner />
}
