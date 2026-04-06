import { useRef, useCallback, useEffect, useState } from 'react'
import { CasePowerProvider } from '../hooks/useCasePower.jsx'
import { ModuleRegistryProvider } from '../hooks/useModuleRegistry.jsx'
import { PatchRoutingProvider } from '../hooks/usePatchRouting.jsx'
import { ModuleInitContext } from '../hooks/useModuleEnabled.js'
import { MODULE_DEFS } from '../moduleRegistry'
import { RackRow } from '../modules/utility/Case'
import { ROW_WIDTH, TOTAL_HP, hpToPx } from '../modules/utility/eurorack'

function CaseModuleSlot({ mod }) {
  const def = MODULE_DEFS[mod.type]
  if (!def) return null
  const Comp = def.component
  const u = def.u || 3
  const aspectDiv = u === 1 ? 12 : 4
  return (
    <div style={{
      width: hpToPx(mod.hp),
      aspectRatio: `${mod.hp * aspectDiv} / ${TOTAL_HP}`,
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <ModuleInitContext.Provider value={{ enabled: true }}>
        <Comp id={`case-${mod.id}`} init={{ enabled: true }} />
      </ModuleInitContext.Provider>
    </div>
  )
}

export default function CaseArea({ rows, zoom = 1, onZoomChange, lastInserted, onMoveModule }) {
  const setZoom = onZoomChange || (() => {})
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const caseRef = useRef(null)
  const spaceDown = useRef(false)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const handleWheel = useCallback((e) => {
    if (e.altKey) {
      e.preventDefault()
      setZoom(z => Math.min(2, Math.max(0.1, z + (e.deltaY > 0 ? -0.05 : 0.05))))
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
  }, [setZoom])

  const handlePointerDown = useCallback((e) => {
    if (!spaceDown.current) return
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y }
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
  }, [pan])

  const handlePointerMove = useCallback((e) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPan({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy })
  }, [])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
    if (containerRef.current) containerRef.current.style.cursor = spaceDown.current ? 'grab' : ''
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && !e.target.closest('input, textarea')) {
        e.preventDefault()
        spaceDown.current = true
        if (containerRef.current) containerRef.current.style.cursor = 'grab'
      }
      // Snap positions 1-9
      if (!e.target.closest('input, textarea') && !e.metaKey && !e.ctrlKey && '123456789'.includes(e.key)) {
        e.preventDefault()
        const el = containerRef.current
        if (!el) return
        const caseEl = caseRef.current
        if (!caseEl) return
        const cr = el.getBoundingClientRect()
        const rect = caseEl.getBoundingClientRect()
        const vw = cr.width
        const vh = cr.height
        const p = 48
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
        const dx = t.x - rect.left
        const dy = t.y - rect.top
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceDown.current = false
        dragging.current = false
        if (containerRef.current) containerRef.current.style.cursor = ''
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [rows, zoom])

  return (
    <CasePowerProvider>
      <ModuleRegistryProvider>
        <PatchRoutingProvider>
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'visible', position: 'relative' }}
          >
            <div ref={caseRef} style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            }}>
              {rows.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * zoom, transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
                  {rows.map((row, ri) => (
                    <div key={ri}>
                      <RackRow height={row.height}>
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          {row.modules.map(mod => (
                            <div
                              key={mod.id}
                              style={{
                                position: 'absolute',
                                left: (mod.offset || 0) * 16,
                                top: 0,
                                height: '100%',
                                transition: lastInserted === mod.id ? 'outline-color 0.5s' : undefined,
                                outline: lastInserted === mod.id ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                                outlineOffset: -2,
                                cursor: onMoveModule ? 'grab' : 'default',
                              }}
                              onPointerDown={onMoveModule ? (e) => {
                                e.stopPropagation()
                                const startX = e.clientX
                                const startOffset = mod.offset || 0
                                const onMove = (me) => {
                                  const dx = (me.clientX - startX) / zoom
                                  const newOffset = startOffset + Math.round(dx / 16)
                                  onMoveModule(ri, mod.id, newOffset * 2)
                                }
                                const onUp = () => {
                                  window.removeEventListener('pointermove', onMove)
                                  window.removeEventListener('pointerup', onUp)
                                }
                                window.addEventListener('pointermove', onMove)
                                window.addEventListener('pointerup', onUp)
                              } : undefined}
                            >
                              <CaseModuleSlot mod={mod} />
                            </div>
                          ))}
                        </div>
                      </RackRow>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PatchRoutingProvider>
      </ModuleRegistryProvider>
    </CasePowerProvider>
  )
}
