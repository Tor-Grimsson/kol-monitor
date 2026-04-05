import { useRef, useState, useEffect, useCallback } from 'react'
import { ModuleRegistryProvider, useModuleRegistry } from './hooks/useModuleRegistry.jsx'
import { PatchRoutingProvider, usePatchRouting } from './hooks/usePatchRouting.jsx'
import { CasePowerProvider, useCasePower } from './hooks/useCasePower.jsx'
import { useRenderLoop } from './hooks/useRenderLoop'
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
  const { modulesRef } = useModuleRegistry()
  const routing = usePatchRouting()
  const { connectionsRef } = routing
  const rackRef = useRef(null)
  const rowRefs = useRef({})
  const rackOuterRef = useRef(null)
  const rack = useRackState()
  const { power, timingRef, toggleAll } = useCasePower()
  const [zoom, setZoom] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewLocked, setViewLocked] = useState(false)
  const viewLockedRef = useRef(false)
  const [cableLocked, setCableLocked] = useState(false)
  const [cableVisibility, setCableVisibility] = useState('trans') // 'on' | 'off' | 'trans'
  const [showShortcuts, setShowShortcuts] = useState(false)
  routing.lockedRef.current = cableLocked
  routing.visibilityRef.current = cableVisibility

  useRenderLoop(modulesRef, connectionsRef, power, timingRef)

  const rackRef2 = useRef(rack)
  rackRef2.current = rack

  // Spacebar + drag to pan
  const spaceDown = useRef(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  useKeybindings({ rackOuterRef, rackRef, spaceDown, zoom, setZoom, setPanOffset, setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef: rackRef2, toggleAll, setCableLocked, setCableVisibility, setShowShortcuts })

  const handlePanDown = useCallback((e) => {
    if (!spaceDown.current) return
    e.preventDefault()
    const el = rackOuterRef.current
    panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y }
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
  }, [panOffset])

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
          />
        </div>
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-50 kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          [Show]
        </button>
      )}

      {/* Cable controls — bottom left */}
      <div className="fixed bottom-3 left-3 z-50 select-none" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <div className="kol-helper-xs text-fg-48" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          [Cables
          <span onClick={() => setCableLocked(v => !v)} className="hover:text-fg-96 cursor-pointer" style={{ color: cableLocked ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <Icon name={cableLocked ? 'cable-lock' : 'cable-unlock'} size={14} />
          </span>
          <span onClick={() => setCableVisibility(v => v === 'on' ? 'off' : v === 'off' ? 'trans' : 'on')} className="hover:text-fg-96 cursor-pointer" style={{ color: cableVisibility === 'off' ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <Icon name={cableVisibility === 'on' ? 'cable-on' : cableVisibility === 'off' ? 'cable-off' : 'cable-trans'} size={14} />
          </span>]
        </div>
      </div>

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

      {/* Lock — bottom right */}
      <button
        onClick={() => setViewLocked(v => { viewLockedRef.current = !v; return !v })}
        className="fixed bottom-3 right-3 z-50 kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
        style={{ background: 'none', border: 'none', padding: 0, color: viewLocked ? 'rgba(231,76,60,0.9)' : undefined }}
      >
        [{viewLocked ? 'Locked' : 'Lock'}]
      </button>

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
          <div style={{ position: 'fixed', bottom: 0, left: sidebarOpen ? 'var(--sidebar-width)' : 0, right: 0, zIndex: 50 }}>
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
