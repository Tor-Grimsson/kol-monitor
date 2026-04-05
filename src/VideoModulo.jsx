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

const BASE_WIDTH = ROW_WIDTH + 52  // row + side panels (24+24) + padding (2+2)

function VideoModuloInner() {
  const { modulesRef } = useModuleRegistry()
  const { connectionsRef } = usePatchRouting()
  const rackRef = useRef(null)
  const rowRefs = useRef({})
  const rackOuterRef = useRef(null)
  const rack = useRackState()
  const { power, timingRef, toggleAll } = useCasePower()
  const [zoom, setZoom] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewLocked, setViewLocked] = useState(false)
  const viewLockedRef = useRef(false)

  useRenderLoop(modulesRef, connectionsRef, power, timingRef)

  const rackRef2 = useRef(rack)
  rackRef2.current = rack

  // Spacebar + drag to pan
  const spaceDown = useRef(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  useKeybindings({ rackOuterRef, rackRef, spaceDown, zoom, setZoom, setPanOffset, setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef: rackRef2, toggleAll })

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

      <button
        onClick={() => setViewLocked(v => { viewLockedRef.current = !v; return !v })}
        className="fixed bottom-3 left-3 z-50 kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
        style={{ background: 'none', border: 'none', padding: 0, color: viewLocked ? 'rgba(231,76,60,0.9)' : undefined }}
      >
        [{viewLocked ? 'Locked' : 'Lock'}]
      </button>

      <div ref={rackOuterRef} onPointerDown={handlePanDown} className="flex-1 relative" style={{ minHeight: '100vh', overflow: 'hidden', display: 'grid', placeItems: 'center', marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0 }}>
        <div ref={rackRef} className="relative" style={{ zoom, width: BASE_WIDTH, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          <PatchCableOverlay containerRef={rackRef} />
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
      <PatchRoutingProvider initialConnections={patches.ref}>
        <CasePowerProvider>
          <VideoModuloInner />
        </CasePowerProvider>
      </PatchRoutingProvider>
    </ModuleRegistryProvider>
  )
}
