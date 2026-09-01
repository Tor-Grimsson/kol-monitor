// StageCanvas — the full-bleed screen. A bare canvas that taps one module's
// output port and hands it to `drawSignal`, the same renderer every display
// module uses. Not a blown-up display module: no 12HP aspect baked in, no
// panel chrome to hide, and the tap costs the render loop nothing — the loop
// already stashes each module's frame on its registry descriptor
// (`mod.lastOutputs`, useRenderLoop).
//
// Persistence is the partial-alpha clear-fill from ARCHITECTURE §1, not a
// shader. trails 0 = opaque wipe, 100 = never clears. Gamma-curved to match
// the Output/Recorder trails knob.

import { useRef } from 'react'
import { useCanvasLoop } from '../hooks/useCanvasLoop'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { readScalar } from '../hooks/signals'
import { drawSignal } from '../modules/display/drawSignal'

const BUF_LEN = 128

const rgbOf = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

export default function StageCanvas({ tap, trails = 0, background = '#000000' }) {
  const canvasRef = useRef(null)
  const { modulesRef } = useModuleRegistry()
  const historyRef = useRef(new Float32Array(BUF_LEN))
  const writeIdxRef = useRef(0)

  // Hot-path mirrors — the draw callback is registered once and must not close
  // over stale props (same rule modules follow for `process`).
  const tapRef = useRef(tap)
  tapRef.current = tap
  const trailsRef = useRef(trails)
  trailsRef.current = trails
  const bgRef = useRef(rgbOf(background))
  bgRef.current = rgbOf(background)
  // Clear-fill string cached by (bg, trails) — it was a template + Math.pow
  // per frame for a value that only changes on a knob (G2, fable-audit-2)
  const fillRef = useRef({ bg: '', trails: -1, style: '' })

  useCanvasLoop(canvasRef, () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.globalAlpha = 1
    const fc = fillRef.current
    if (fc.bg !== bgRef.current || fc.trails !== trailsRef.current) {
      fc.bg = bgRef.current
      fc.trails = trailsRef.current
      const a = 1 - Math.pow(Math.max(0, Math.min(100, fc.trails)) / 100, 0.3)
      fc.style = `rgba(${fc.bg},${a})`
    }
    ctx.fillStyle = fc.style
    ctx.fillRect(0, 0, w, h)

    const t = tapRef.current
    const mod = t && modulesRef.current.get(t.module)
    // A disabled module is skipped by the render loop before `process`, so its
    // lastOutputs is the frame it stopped on — check the ref, not the buffer.
    if (!mod || (mod.enabledRef && !mod.enabledRef.current)) return
    const signal = mod.lastOutputs?.[t.port]
    if (!signal) return

    if (signal.type === 'scalar') {
      historyRef.current[writeIdxRef.current] = readScalar(signal)
      writeIdxRef.current = (writeIdxRef.current + 1) % BUF_LEN
    }

    drawSignal(ctx, signal, 0, 0, w, h, historyRef.current, writeIdxRef.current, BUF_LEN, null, true)
  })

  return (
    <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
  )
}
