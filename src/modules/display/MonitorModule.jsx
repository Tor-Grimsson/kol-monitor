// MonitorModule — Canvas2D display for any signal type
// 12HP, two channels (A/B), pass-through outputs, pen input for style

import { useRef, useEffect, useState } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import FlipToggle from '../controls/FlipToggle'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'

const BUF_LEN = 128

function MonitorPanel({ canvasRef, overlay, onOverlayChange, enabled, onToggle, id, aConnected, inputARef, bConnected, inputBRef, penConnected, penRef, outARef, outBRef }) {
  return (
    <Module label="Mon" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 4,
      }}>

        <canvas
          ref={canvasRef}
          width={160}
          height={100}
          style={{
            flex: 1,
            width: '100%',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="a" moduleId={id} active={aConnected} signalRef={inputARef} label="a" />
          <LabeledJack type="in" port="b" moduleId={id} active={bConnected} signalRef={inputBRef} label="b" />
          <LabeledJack type="in" port="pen" moduleId={id} active={penConnected} signalRef={penRef} label="pen" />
          <FlipToggle value={overlay} onChange={onOverlayChange} labelA="spl" labelB="ovr" />
          <LabeledJack type="out" port="a" moduleId={id} signalRef={outARef} label="a" />
          <LabeledJack type="out" port="b" moduleId={id} signalRef={outBRef} label="b" />
        </div>
      </div>
    </Module>
  )
}

export default function MonitorModule({ id = 'mon1', preview }) {
  if (preview) return <MonitorPanel canvasRef={{ current: null }} overlay={false} onOverlayChange={() => {}} enabled={false} onToggle={() => {}} id={id} aConnected={false} inputARef={{ current: null }} bConnected={false} inputBRef={{ current: null }} penConnected={false} penRef={{ current: null }} outARef={{ current: null }} outBRef={{ current: null }} />

  const canvasRef = useRef(null)
  const inputARef = useRef(null)
  const inputBRef = useRef(null)
  const penRef = useRef(null)
  const [overlay, setOverlay] = useState(false)
  const overlayRef = useRef(false)
  const [enabled, setEnabled] = useModuleEnabled()
  const enabledRef = useRef(true)
  overlayRef.current = overlay
  enabledRef.current = enabled
  const routing = usePatchRouting()

  const conns = routing?.connections || []
  const aConnected = conns.some(c => c.toModuleId === id && c.toPort === 'a')
  const bConnected = conns.some(c => c.toModuleId === id && c.toPort === 'b')
  const penConnected = conns.some(c => c.toModuleId === id && c.toPort === 'pen')

  const outARef = useRef(null)
  const outBRef = useRef(null)

  // Ring buffers for scalar scope traces
  const historyA = useRef(new Float32Array(BUF_LEN))
  const historyB = useRef(new Float32Array(BUF_LEN))
  const writeIdxRef = useRef(0)

  useModule({
    id,
    inputs: {
      a: { type: 'any' },
      b: { type: 'any' },
      pen: { type: 'pen' },
    },
    outputs: {
      a: { type: 'any' },
      b: { type: 'any' },
    },
    process: (inputs) => {
      if (!enabledRef.current) {
        inputARef.current = null; inputBRef.current = null
        outARef.current = null; outBRef.current = null; penRef.current = null
        return { a: null, b: null }
      }
      inputARef.current = inputs.a
      inputBRef.current = inputs.b
      penRef.current = inputs.pen
      outARef.current = inputs.a
      outBRef.current = inputs.b

      // Push scalar values into ring buffers
      const idx = writeIdxRef.current
      if (inputs.a && inputs.a.type === 'scalar') historyA.current[idx] = inputs.a.value
      else historyA.current[idx] = 0
      if (inputs.b && inputs.b.type === 'scalar') historyB.current[idx] = inputs.b.value
      else historyB.current[idx] = 0
      writeIdxRef.current = (idx + 1) % BUF_LEN

      return { a: inputs.a, b: inputs.b }
    },
  })

  // Resize canvas to match display size
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
  }, [])

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      if (!w || !h) { raf = requestAnimationFrame(draw); return }

      ctx.fillStyle = 'rgba(8,8,8,0.95)'
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1)
      }

      const hasB = inputBRef.current != null
      const wi = writeIdxRef.current
      const p = penRef.current
      const ovr = overlayRef.current

      if (hasB && !ovr) {
        // Split view
        const aw = Math.floor(w / 2)
        drawSignal(ctx, inputARef.current, 0, 0, aw, h, historyA.current, wi, BUF_LEN, p)
        ctx.fillStyle = 'rgba(40,40,40,0.5)'
        ctx.fillRect(aw, 0, 1, h)
        drawSignal(ctx, inputBRef.current, aw + 1, 0, Math.ceil(w / 2) - 1, h, historyB.current, wi, BUF_LEN, p)
      } else {
        // Overlay or single channel
        drawSignal(ctx, inputARef.current, 0, 0, w, h, historyA.current, wi, BUF_LEN, p)
        if (hasB) drawSignal(ctx, inputBRef.current, 0, 0, w, h, historyB.current, wi, BUF_LEN, p)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <MonitorPanel canvasRef={canvasRef} overlay={overlay} onOverlayChange={setOverlay} enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id} aConnected={aConnected} inputARef={inputARef} bConnected={bConnected} inputBRef={inputBRef} penConnected={penConnected} penRef={penRef} outARef={outARef} outBRef={outBRef} />
}
