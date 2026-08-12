// RackViewport — the core rack canvas with pan, zoom, snap, cables, workbench
// Used by both VideoModulo (full page) and CreatePage (embedded)

import { useRef, useEffect, useCallback } from 'react'
import usePersistedState from '../hooks/usePersistedState'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { usePatchRouting } from '../hooks/usePatchRouting.jsx'
import { useCasePower } from '../hooks/useCasePower.jsx'
import { useRenderLoop } from '../hooks/useRenderLoop'
import { RenderControlProvider } from '../hooks/useRenderControl'
import { useRack } from '../hooks/useRackContext.jsx'
import { MODULE_DEFS } from '../modules/registry'
import { ROW_WIDTH } from '../modules/utility/eurorack'
import PatchCableOverlay from '../modules/utility/PatchCableOverlay.jsx'
import RackView from './RackView.jsx'
import Workbench from './Workbench.jsx'

const BASE_WIDTH = ROW_WIDTH + 52

export default function RackViewport({ style, onEditCase, editMode: editModeOverride, viewLockedRef: viewLockedRefProp, snapPadding = 48 }) {
  const { modulesRef } = useModuleRegistry()
  const routing = usePatchRouting()
  const { connectionsRef } = routing
  const rackRef = useRef(null)
  const rowRefs = useRef({})
  const rackOuterRef = useRef(null)
  const rack = useRack()
  const { power, timingRef } = useCasePower()
  const [zoom, setZoom] = usePersistedState('rack-zoom', 1)
  const localLockedRef = useRef(false)
  const viewLockedRef = viewLockedRefProp || localLockedRef
  const [cableLocked, setCableLocked] = usePersistedState('rack-cableLocked', false)
  const [cableVisibility, setCableVisibility] = usePersistedState('rack-cableVis', 'trans')
  routing.lockedRef.current = cableLocked
  routing.visibilityRef.current = cableVisibility

  const { controlRef } = useRenderLoop(modulesRef, connectionsRef, power, timingRef)

  // Spacebar + drag to pan; a clean tap (no drag, <250ms) toggles the transport
  const spaceDown = useRef(false)
  const spacePressAt = useRef(0)
  const spaceDragged = useRef(false)
  const [panOffset, setPanOffset] = usePersistedState('rack-pan', { x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const panOffsetRef = useRef(panOffset)
  panOffsetRef.current = panOffset

  const handlePanDown = useCallback((e) => {
    if (!spaceDown.current) return
    spaceDragged.current = true
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
      if (e.target.closest('[data-workbench]')) return
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

  // Keybindings: space pan, 1-9 snap, +/-/0 zoom
  useEffect(() => {
    const noInput = (e) => !e.target.closest('input, textarea')
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && noInput(e)) {
        e.preventDefault()
        spaceDown.current = true
        spacePressAt.current = performance.now()
        spaceDragged.current = false
        if (rackOuterRef.current) rackOuterRef.current.style.cursor = 'grab'
      }
      if (noInput(e) && !e.metaKey && !e.ctrlKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom(z => Math.min(2, z + 0.1)) }
        if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.5, z - 0.1)) }
        if (e.key === '0') { e.preventDefault(); setZoom(1) }
      }
      // Snap view: 7 8 9 = top, 4 5 6 = middle, 1 2 3 = bottom
      if (noInput(e) && !e.metaKey && !e.ctrlKey && '123456789'.includes(e.key)) {
        e.preventDefault()
        const el = rackRef.current
        const outer = rackOuterRef.current
        if (!el || !outer) return
        const rect = el.getBoundingClientRect()
        const cr = outer.getBoundingClientRect()
        const vw = cr.width
        const vh = cr.height
        const p = snapPadding
        const targets = {
          7: { x: cr.left + p, y: cr.top + p },
          8: { x: cr.left + (vw - rect.width) / 2, y: cr.top + p },
          9: { x: cr.left + vw - p - rect.width, y: cr.top + p },
          4: { x: cr.left + p, y: cr.top + (vh - rect.height) / 2 },
          5: { x: cr.left + (vw - rect.width) / 2, y: cr.top + (vh - rect.height) / 2 },
          6: { x: cr.left + vw - p - rect.width, y: cr.top + (vh - rect.height) / 2 },
          1: { x: cr.left + p, y: cr.top + vh - p - rect.height },
          2: { x: cr.left + (vw - rect.width) / 2, y: cr.top + vh - p - rect.height },
          3: { x: cr.left + vw - p - rect.width, y: cr.top + vh - p - rect.height },
        }
        const t = targets[e.key]
        const dx = (t.x - rect.left) / zoom
        const dy = (t.y - rect.top) / zoom
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      }
    }
    // Transport: a clean space tap toggles the patch's timing roots. Anything
    // driving a clk/trig/gate input is a clock regardless of module type, so
    // walk upstream from those drivers through every inbound cable to the
    // sources with no inputs patched — those are the masters; followers stop
    // by proxy. ponytail: rootless cycles are skipped; multiple roots all flip.
    const TEMPO_PORTS = new Set(['clk', 'trig', 'gate'])
    const toggleTransport = () => {
      const conns = connectionsRef.current
      const inbound = new Map()
      conns.forEach(c => {
        if (!inbound.has(c.toModuleId)) inbound.set(c.toModuleId, [])
        inbound.get(c.toModuleId).push(c.fromModuleId)
      })
      const roots = new Set()
      const seen = new Set()
      const visit = (id) => {
        if (seen.has(id)) return
        seen.add(id)
        const ins = inbound.get(id)
        if (!ins || ins.length === 0) { roots.add(id); return }
        ins.forEach(visit)
      }
      conns.forEach(c => { if (TEMPO_PORTS.has(c.toPort)) visit(c.fromModuleId) })
      roots.forEach(id => modulesRef.current.get(id)?.setEnabled?.(v => !v))
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        if (spaceDown.current && !spaceDragged.current && performance.now() - spacePressAt.current < 250) {
          toggleTransport()
        }
        spaceDown.current = false
        if (rackOuterRef.current) rackOuterRef.current.style.cursor = ''
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [zoom])

  // Snap to position 7 (top-left) on mount
  const initialSnapRef = useRef(false)
  useEffect(() => {
    if (initialSnapRef.current) return
    const el = rackRef.current
    const outer = rackOuterRef.current
    if (!el || !outer) return
    initialSnapRef.current = true
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const cr = outer.getBoundingClientRect()
      const p = snapPadding
      const dx = (cr.left + p - rect.left) / zoom
      const dy = (cr.top + p - rect.top) / zoom
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    }))
  })

  return (
    <RenderControlProvider value={controlRef}>
      <div
        ref={rackOuterRef}
        onPointerDown={handlePanDown}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'grid', placeItems: 'center', position: 'relative', ...style }}
      >
        <div ref={rackRef} className="relative" style={{ zoom, width: BASE_WIDTH, transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          <PatchCableOverlay containerRef={rackRef} cableVisibility={cableVisibility} cableLocked={cableLocked} onCableUnlock={() => setCableLocked(false)} />
          <RackView
            rows={rack.rows}
            editMode={editModeOverride !== undefined ? editModeOverride : rack.editMode}
            onSendToWorkbench={rack.sendToWorkbench}
            onSwapInRow={rack.swapInRow}
            onMoveToRow={rack.moveToRow}
            rowRefs={rowRefs}
          />
        </div>

        {(editModeOverride !== undefined ? editModeOverride : rack.editMode) && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
            <Workbench
              modules={rack.workbench}
              rows={rack.rows}
              onReturn={rack.returnFromWorkbench}
              onAddRow={rack.addRow}
              onRemoveRow={rack.removeRow}
              onSetRowHeight={rack.setRowHeight}
              onEditCase={onEditCase}
              onAddModule={(type, rowId) => {
                if (rowId) {
                  rack.addModule(type, rowId)
                } else {
                  const def = MODULE_DEFS[type]
                  if (!def) return
                  const targetHeight = (def.u || 3) === 1 ? '1u' : '3u'
                  const row = rack.rows.find(r => r.height === targetHeight)
                  if (row) rack.addModule(type, row.id)
                }
              }}
            />
          </div>
        )}
      </div>
    </RenderControlProvider>
  )
}
