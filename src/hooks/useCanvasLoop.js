// Shared canvas draw loop — single rAF registry for all display modules
// Modules register a draw callback; one rAF drives them all.
// A single shared ResizeObserver services every registered canvas.

import { useEffect, useRef } from 'react'

const drawCallbacks = new Set()
let rafId = null
let pageHidden = false

// One observer for all canvases across the app.
// Dispatches to the resize handler attached via element.__kolResize.
const sharedResizeObserver = typeof ResizeObserver !== 'undefined'
  ? new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cb = entry.target.__kolResize
        if (cb) cb(entry)
      }
    })
  : null

function tick() {
  if (!pageHidden) for (const cb of drawCallbacks) cb()
  rafId = requestAnimationFrame(tick)
}

function startLoop() {
  if (rafId == null) rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  if (rafId != null) { cancelAnimationFrame(rafId); rafId = null }
}

// Pause rAF when the tab is hidden; resume on visibility restore.
// Avoids queued callback bursts and respects battery/CPU while backgrounded.
if (typeof document !== 'undefined') {
  const onVisibility = () => {
    pageHidden = document.visibilityState === 'hidden'
    if (!pageHidden && drawCallbacks.size > 0) startLoop()
    else if (pageHidden) stopLoop()
  }
  document.addEventListener('visibilitychange', onVisibility)
  pageHidden = document.visibilityState === 'hidden'
}

// Hook: registers a draw function and handles canvas resize
export function useCanvasLoop(canvasRef, drawFn, enabledRef) {
  const drawRef = useRef(drawFn)
  drawRef.current = drawFn

  // Resize: one entry in the shared observer per canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sharedResizeObserver) return
    canvas.__kolResize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width)
      canvas.height = Math.round(rect.height)
    }
    sharedResizeObserver.observe(canvas)
    return () => {
      sharedResizeObserver.unobserve(canvas)
      delete canvas.__kolResize
    }
  }, [canvasRef])

  // Register draw callback
  useEffect(() => {
    const cb = () => { if (!enabledRef || enabledRef.current) drawRef.current() }
    drawCallbacks.add(cb)
    if (!pageHidden) startLoop()
    return () => {
      drawCallbacks.delete(cb)
      if (drawCallbacks.size === 0) stopLoop()
    }
  }, [])
}
