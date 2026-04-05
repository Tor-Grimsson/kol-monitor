import { useRef, useState, useEffect, useCallback } from 'react'
import { ModuleRegistryProvider, useModuleRegistry } from './hooks/useModuleRegistry.jsx'
import { PatchRoutingProvider, usePatchRouting } from './hooks/usePatchRouting.jsx'
import { CasePowerProvider, useCasePower } from './hooks/useCasePower.jsx'
import { useRenderLoop } from './hooks/useRenderLoop'
import { useRackState } from './hooks/useRackState'
import { MODULE_DEFS } from './moduleRegistry'
import { ROW_WIDTH } from './modules/utility/eurorack'
import PatchCableOverlay from './modules/utility/PatchCableOverlay.jsx'
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

  useRenderLoop(modulesRef, connectionsRef, power, timingRef)

  const rackRef2 = useRef(rack)
  rackRef2.current = rack

  // Spacebar + drag to pan
  const spaceDown = useRef(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && !e.target.closest('input, textarea')) { e.preventDefault(); spaceDown.current = true; if (rackOuterRef.current) rackOuterRef.current.style.cursor = 'grab' }
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(z => Math.min(2, z + 0.1)) }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.5, z - 0.1)) }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') { e.preventDefault(); setZoom(1) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') { e.preventDefault(); setSidebarOpen(s => !s) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') { e.preventDefault(); const r = rackRef2.current; r.setEditMode(!r.editMode) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') { e.preventDefault(); toggleAll() }
    }
    const onKeyUp = (e) => { if (e.code === 'Space') { spaceDown.current = false; if (rackOuterRef.current) rackOuterRef.current.style.cursor = '' } }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

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

  return (
    <div className="min-h-screen bg-surface-primary flex relative" style={{ overflow: 'hidden' }}>
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
