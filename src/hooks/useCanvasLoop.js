// Shared canvas draw loop — single rAF registry for all display modules
// Modules register a draw callback; one rAF drives them all.

import { useEffect, useRef } from 'react'

const drawCallbacks = new Set()
let rafId = null

function tick() {
  for (const cb of drawCallbacks) cb()
  rafId = requestAnimationFrame(tick)
}

function startLoop() {
  if (rafId == null) rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  if (rafId != null) { cancelAnimationFrame(rafId); rafId = null }
}

// Hook: registers a draw function and handles canvas resize
export function useCanvasLoop(canvasRef, drawFn, enabledRef) {
  const drawRef = useRef(drawFn)
  drawRef.current = drawFn

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width)
      canvas.height = Math.round(rect.height)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [canvasRef])

  // Register draw callback
  useEffect(() => {
    const cb = () => { if (!enabledRef || enabledRef.current) drawRef.current() }
    drawCallbacks.add(cb)
    startLoop()
    return () => {
      drawCallbacks.delete(cb)
      if (drawCallbacks.size === 0) stopLoop()
    }
  }, [])
}
