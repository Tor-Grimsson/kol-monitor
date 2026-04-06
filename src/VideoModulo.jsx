import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useNavHidden } from './components/AppLayout'
import usePersistedState from './hooks/usePersistedState'
import { ModuleRegistryProvider, useModuleRegistry } from './hooks/useModuleRegistry.jsx'
import { PatchRoutingProvider, usePatchRouting } from './hooks/usePatchRouting.jsx'
import { CasePowerProvider, useCasePower } from './hooks/useCasePower.jsx'
import { useRenderLoop } from './hooks/useRenderLoop'
import { RenderControlProvider } from './hooks/useRenderControl'
import { useRackState } from './hooks/useRackState'
import { MODULE_DEFS } from './moduleRegistry'
import { ROW_WIDTH } from './modules/utility/eurorack'
import PatchCableOverlay from './modules/utility/PatchCableOverlay.jsx'
import { useKeybindings } from './hooks/useKeybindings'
import RackView from './RackView.jsx'
import ModuloSidebar from './ModuloSidebar.jsx'
import Workbench from './Workbench.jsx'
import { patches } from './patches.js'
import ShortcutsOverlay from './ShortcutsOverlay.jsx'
import Icon from './icons/Icon.jsx'

const BASE_WIDTH = ROW_WIDTH + 52  // row + side panels (24+24) + padding (2+2)

function VideoModuloInner() {
  const { presetName } = useParams()
  const { modulesRef } = useModuleRegistry()
  const routing = usePatchRouting()
  const { connectionsRef } = routing
  const rackRef = useRef(null)
  const rowRefs = useRef({})
  const rackOuterRef = useRef(null)
  const rack = useRackState()
  const { power, timingRef, toggleAll } = useCasePower()
  const [zoom, setZoom] = usePersistedState('rack-zoom', 1)
  const nav = useNavHidden()
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
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [displayHidden, setDisplayHidden] = usePersistedState('rack-displayHidden', true)
  routing.lockedRef.current = cableLocked
  routing.visibilityRef.current = cableVisibility

  const { controlRef } = useRenderLoop(modulesRef, connectionsRef, power, timingRef)

  // Load preset from URL param on mount
  const presetLoadedRef = useRef(false)
  useEffect(() => {
    if (!presetName || presetLoadedRef.current) return
    // Support kebab-case URLs: radial-showcase → radialShowcase
    let p
    if (presetName === 'custom') {
      try { p = JSON.parse(sessionStorage.getItem('customPatch')) } catch {}
    } else {
      const key = presetName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      p = patches[key] || patches[presetName]
    }
    if (!p) return
    presetLoadedRef.current = true
    requestAnimationFrame(() => {
      rack.loadPreset(p)
      if (p.connections) routing.loadPatch(p.connections)
    })
  }, [presetName, rack, routing])

  const rackRef2 = useRef(rack)
  rackRef2.current = rack

  // Snap to position 7 (top-left) on mount
  const initialSnapRef = useRef(false)
  useEffect(() => {
    if (initialSnapRef.current) return
    const el = rackRef.current
    if (!el) return
    initialSnapRef.current = true
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const p = 48
      const dx = (p + 24 - rect.left) / zoom
      const dy = (p - rect.top) / zoom
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    })
  })

  // Spacebar + drag to pan
  const spaceDown = useRef(false)
  const [panOffset, setPanOffset] = usePersistedState('rack-pan', { x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  useKeybindings({ rackOuterRef, rackRef, spaceDown, zoom, setZoom, setPanOffset, setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef: rackRef2, toggleAll, setCableLocked, setCableVisibility, setShowShortcuts, setDisplayHidden })

  const panOffsetRef = useRef(panOffset)
  panOffsetRef.current = panOffset

  const handlePanDown = useCallback((e) => {
    if (!spaceDown.current) return
    e.preventDefault()
    const el = rackOuterRef.current
    const po = panOffsetRef.current
    panStart.current = { x: e.clientX, y: e.clientY, ox: po.x, oy: po.y }
    el.style.cursor = 'grabbing'

    const onMove = (e) => {
      setPanOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      })
    }
    const onUp = () => {
      el.style.cursor = spaceDown.current ? 'grab' : ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  // Wheel/trackpad pans the canvas
  useEffect(() => {
    const el = rackOuterRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      if (viewLockedRef.current) return
      if (e.altKey) {
        setZoom(z => Math.min(2, Math.max(0.5, z - e.deltaY * 0.002)))
      } else {
        setPanOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <RenderControlProvider value={controlRef}>
    <div className="bg-surface-primary flex relative" style={{ overflow: 'hidden', height: '100vh' }}>
      {sidebarOpen && (
        <div className="sidebar-width flex-shrink-0 border-r border-fg-08 overflow-y-auto" style={{
          backgroundColor: 'var(--kol-bg-surface-primary, #0a0a0a)',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 40,
        }}>
          <ModuloSidebar
            rack={rack}
            routing={usePatchRouting()}
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
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed z-50 kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
          style={{ left: 60, top: 16, background: 'none', border: 'none', padding: 0 }}
        >
          [Show]
        </button>
      )}

      {/* Cable controls — bottom left (hidden when sidebar open or display hidden) */}
      {!sidebarOpen && !displayHidden && <div className="fixed z-50 select-none" style={{ bottom: 16, left: 60, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, transition: 'left 0.15s' }}>
        <div className="kol-helper-xs text-fg-48" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          [Cables
          <span onClick={() => setCableLocked(v => !v)} className="hover:text-fg-96 cursor-pointer" style={{ color: cableLocked ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <Icon name={cableLocked ? 'cable-lock' : 'cable-unlock'} size={14} />
          </span>
          <span onClick={() => setCableVisibility(v => v === 'on' ? 'off' : v === 'off' ? 'trans' : 'on')} className="hover:text-fg-96 cursor-pointer" style={{ color: cableVisibility === 'off' ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <Icon name={cableVisibility === 'on' ? 'cable-on' : cableVisibility === 'off' ? 'cable-off' : 'cable-trans'} size={14} />
          </span>]
        </div>
      </div>}

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

      {/* Lock — bottom right */}
      {!displayHidden && <button
        onClick={() => setViewLocked(v => { viewLockedRef.current = !v; return !v })}
        className="fixed z-50 kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
        style={{ bottom: 16, right: 16, background: 'none', border: 'none', padding: 0, color: viewLocked ? 'rgba(231,76,60,0.9)' : undefined }}
      >
        [{viewLocked ? 'Locked' : 'Lock'}]
      </button>}

      <div ref={rackOuterRef} onPointerDown={handlePanDown} className="flex-1 relative" style={{ minHeight: '100vh', overflow: 'hidden', display: 'grid', placeItems: 'center', marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0 }}>
        <div ref={rackRef} className="relative" style={{ zoom, width: BASE_WIDTH, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          <PatchCableOverlay containerRef={rackRef} cableVisibility={cableVisibility} cableLocked={cableLocked} onCableUnlock={() => setCableLocked(false)} />
          <RackView
            rows={rack.rows}
            editMode={rack.editMode}
            onSendToWorkbench={rack.sendToWorkbench}
            rowRefs={rowRefs}
          />
        </div>

        {rack.editMode && (
          <div style={{ position: 'fixed', bottom: 0, left: sidebarOpen ? 'calc(var(--sidebar-width) + 48px)' : 48, right: 0, zIndex: 50 }}>
            <Workbench
              modules={rack.workbench}
              onReturn={rack.returnFromWorkbench}
              onAddModule={(type) => {
                const def = MODULE_DEFS[type]
                if (!def) return
                const targetHeight = (def.u || 3) === 1 ? '1u' : '3u'
                const row = rack.rows.find(r => r.height === targetHeight)
                if (row) rack.addModule(type, row.id)
              }}
            />
          </div>
        )}
      </div>
    </div>
    </RenderControlProvider>
  )
}

export default function VideoModulo() {
  return (
    <ModuleRegistryProvider>
      <PatchRoutingProvider initialConnections={patches.ref.connections}>
        <CasePowerProvider>
          <VideoModuloInner />
        </CasePowerProvider>
      </PatchRoutingProvider>
    </ModuleRegistryProvider>
  )
}
