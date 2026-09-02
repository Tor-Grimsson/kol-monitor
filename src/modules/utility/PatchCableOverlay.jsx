// PatchCableOverlay — SVG catenary patch cables between jacks

import { useEffect, useRef, useState } from 'react'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

const WIRE_COLOR = 'var(--kol-ctl-cable)'

function getJackCenter(element, container) {
  if (!element || !container) return null
  const er = element.getBoundingClientRect()
  const cr = container.getBoundingClientRect()
  // CSS zoom scales getBoundingClientRect but SVG coords are in unzoomed space.
  // The zoom may sit on an ANCESTOR (the stage board zooms the whole dock), so
  // read the cumulative factor off the container itself: rendered ÷ layout
  // width. `style.zoom` alone was 1 on the stage and every cable shrank toward
  // the dock's corner at any zoom but 1 (2026-09-02).
  const zoom = (container.offsetWidth && cr.width / container.offsetWidth) || parseFloat(container.style.zoom) || 1
  return {
    x: (er.left + er.width / 2 - cr.left) / zoom + container.scrollLeft,
    y: (er.top + er.height / 2 - cr.top) / zoom,
  }
}

function catenaryPath(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  const sag = 30 + dist * 0.12
  const cp1x = x1 + dx * 0.3
  const cp1y = Math.max(y1, y2) + sag
  const cp2x = x2 - dx * 0.3
  const cp2y = Math.max(y1, y2) + sag
  return `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`
}

export default function PatchCableOverlay({ containerRef, cableVisibility = 'on', cableLocked = false, onCableUnlock }) {
  const routing = usePatchRouting()
  const svgRef = useRef(null)
  const [mousePos, setMousePos] = useState(null)
  const [, forceUpdate] = useState(0)
  const [altDown, setAltDown] = useState(false)
  const [hoveredCable, setHoveredCable] = useState(null)

  // Track alt key
  useEffect(() => {
    const down = (e) => { if (e.shiftKey) setAltDown(true) }
    const up = (e) => { if (e.key === 'Shift') { setAltDown(false); setHoveredCable(null) } }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Re-render after connections change (delayed so jacks register first)
  const conns = routing?.connections
  useEffect(() => {
    const id = requestAnimationFrame(() => forceUpdate(n => n + 1))
    return () => cancelAnimationFrame(id)
  }, [conns])

  // Track mouse + scroll for pending cable only. Existing cables are positioned in
  // content-space, which is scroll-invariant — the SVG scrolls with its container
  // naturally, so no re-render is needed during normal panning. We only need scroll
  // updates while the user is dragging a pending cable (mouse-pos → content-space
  // mapping depends on scrollLeft, and scroll without mousemove would otherwise
  // leave the cable tip stale).
  useEffect(() => {
    if (!routing?.pendingOutput) { setMousePos(null); return }
    const container = containerRef?.current
    const handleMove = (e) => {
      if (!container) return
      const cr = container.getBoundingClientRect()
      const zoom = parseFloat(container.style.zoom) || 1
      setMousePos({
        x: (e.clientX - cr.left) / zoom + container.scrollLeft,
        y: (e.clientY - cr.top) / zoom,
      })
    }
    const handleScroll = () => forceUpdate(n => n + 1)
    window.addEventListener('pointermove', handleMove)
    if (container) container.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      if (container) container.removeEventListener('scroll', handleScroll)
    }
  }, [routing?.pendingOutput, containerRef])

  if (!routing) return null

  const { connections, pendingOutput, jackRefs } = routing
  const container = containerRef?.current

  const cables = connections.map((conn, i) => {
    const fromEl = jackRefs.current[`${conn.fromModuleId}:out:${conn.fromPort}`]
    const toEl = jackRefs.current[`${conn.toModuleId}:in:${conn.toPort}`]
    const from = getJackCenter(fromEl, container)
    const to = getJackCenter(toEl, container)
    if (!from || !to) return null
    return { path: catenaryPath(from.x, from.y, to.x, to.y), color: WIRE_COLOR, conn }
  }).filter(Boolean)

  let pendingCable = null
  if (pendingOutput && mousePos) {
    const fromEl = jackRefs.current[`${pendingOutput.moduleId}:out:${pendingOutput.port}`]
    const from = getJackCenter(fromEl, container)
    if (from) {
      pendingCable = catenaryPath(from.x, from.y, mousePos.x, mousePos.y)
    }
  }

  const svgWidth = container ? container.scrollWidth : '100%'
  const svgHeight = container ? container.clientHeight : '100%'

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: svgWidth,
        height: svgHeight,
        pointerEvents: altDown ? 'auto' : 'none',
        overflow: 'visible',
        zIndex: altDown ? 50 : 10,
      }}
    >
      <defs>
        <filter id="vm-cable-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
        </filter>
      </defs>

      {cables.map((cable, i) => {
        const isHovered = hoveredCable === i
        const visible = cableVisibility !== 'off' || isHovered
        const opacity = isHovered ? 1 : cableVisibility === 'trans' ? 0.2 : cableVisibility === 'off' ? 0 : 1
        return (
          <g key={i} opacity={visible ? opacity : 0}>
            {/* Hit area — fat invisible stroke */}
            <path
              d={cable.path}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              strokeLinecap="round"
              style={{ cursor: altDown ? 'pointer' : 'default', pointerEvents: altDown ? 'stroke' : 'none' }}
              onMouseEnter={altDown ? () => setHoveredCable(i) : undefined}
              onMouseLeave={() => setHoveredCable(null)}
              onClick={altDown ? (e) => {
                e.stopPropagation()
                if (cableLocked && onCableUnlock) onCableUnlock()
              } : undefined}
              onDoubleClick={altDown ? (e) => {
                e.stopPropagation()
                routing?.removeConnection(cable.conn.toModuleId, cable.conn.toPort)
              } : undefined}
            />
            {/* Visible cable */}
            <path d={cable.path} fill="none" style={{ stroke: 'var(--kol-ctl-hw-shade)' }} strokeWidth="4" strokeLinecap="round" />
            <path d={cable.path} fill="none" style={{ stroke: isHovered ? 'var(--kol-color-ab-white)' : cable.color }} strokeWidth="2.5" strokeLinecap="round" filter="url(#vm-cable-shadow)" />
          </g>
        )
      })}

      {!cableLocked && pendingCable && (
        <path d={pendingCable} fill="none" style={{ stroke: 'color-mix(in srgb, var(--kol-ctl-led-red) 40%, transparent)' }} strokeWidth="2" strokeLinecap="round" strokeDasharray="6,4" />
      )}
    </svg>
  )
}
