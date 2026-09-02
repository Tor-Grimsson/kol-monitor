// usePanZoom — the rack's canvas gesture set, for the stage's module layer.
//
// Same bindings RackViewport carries: space + drag to pan, wheel/trackpad to
// pan, ⌥ + wheel to zoom, `+` / `-` / `0` on the zoom. The stage only pans the
// MODULES — the video is the background and never moves — so this is a separate
// hook rather than a lift out of RackViewport, whose pan is welded to the case's
// snap keys, transport space-tap and cable locks.
//
// ponytail: the gesture math is duplicated from RackViewport rather than
// extracted. Extract when a third surface needs it — refactoring the rack's
// viewport to serve the stage would put the app's core page at risk for a page
// that has no Case, no snap and no workbench.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTouchGestures } from '../hooks/useTouchGestures.js'

// 0.3 → 0.1 with touch (2026-09-01): the fit at 390 is ~0.19, and a pinch
// clamped to 0.3 could never return to it. `0` still resets to the fit.
const MIN_ZOOM = 0.1
const MAX_ZOOM = 2.5

export function usePanZoom(surfaceRef, initialPan = { x: 0, y: 0 }, initialZoom = 1) {
  const [zoom, setZoom] = useState(initialZoom)
  const [pan, setPan] = useState(initialPan)
  const panRef = useRef(pan)
  panRef.current = pan
  const spaceDown = useRef(false)

  // Two fingers pan + pinch (touch only) — the rack's gesture, same ÷zoom
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const onTouchPan = useCallback((dx, dy) => setPan(p => ({ x: p.x + dx / zoomRef.current, y: p.y + dy / zoomRef.current })), [])
  // Anchored on the fingers: the board sits at the surface's top-left and
  // translate rides inside the zoom, so a content point c paints at
  // (c + pan) · z — keep the point under the midpoint fixed across z0 → z1.
  // zoomRef is written EAGERLY here: a pinch fires one pointermove per finger,
  // two per frame, and a render-synced ref made the second step restart from
  // the stale zoom while the pan correction stacked — measured 537px of drift.
  const onTouchZoom = useCallback((f, mid) => {
    const z0 = zoomRef.current
    const z1 = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z0 * f))
    zoomRef.current = z1
    const r = surfaceRef.current.getBoundingClientRect()
    const mx = mid.x - r.left, my = mid.y - r.top
    setPan(p => ({ x: p.x + mx / z1 - mx / z0, y: p.y + my / z1 - my / z0 }))
    setZoom(z1)
  }, [surfaceRef])
  useTouchGestures(surfaceRef, { onPan: onTouchPan, onZoom: onTouchZoom })

  const onPointerDown = useCallback((e) => {
    if (!spaceDown.current || e.button !== 0) return
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY, ...panRef.current }
    const move = (ev) => setPan({ x: start.x + (ev.clientX - start.x), y: start.y + (ev.clientY - start.y) })
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [])

  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      if (e.altKey) setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * 0.002)))
      else setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [surfaceRef])

  useEffect(() => {
    const noInput = (e) => !e.target.closest('input, textarea')
    const down = (e) => {
      if (e.code === 'Space' && !e.repeat && noInput(e)) {
        e.preventDefault()
        spaceDown.current = true
        if (surfaceRef.current) surfaceRef.current.style.cursor = 'grab'
      }
      if (!noInput(e) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom(z => Math.min(MAX_ZOOM, z + 0.1)) }
      if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(MIN_ZOOM, z - 0.1)) }
      if (e.key === '0') { e.preventDefault(); setZoom(initialZoom); setPan(initialPan) }
    }
    const up = (e) => {
      if (e.code !== 'Space') return
      spaceDown.current = false
      if (surfaceRef.current) surfaceRef.current.style.cursor = ''
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [surfaceRef, initialPan, initialZoom])

  return { zoom, pan, setZoom, setPan, onPointerDown }
}
