// ScopeModule — 1U oscilloscope/monitor
// Canvas display with vertically stacked inputs, pass-through outputs

import { useRef, useEffect, useState } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Divider from '../../components/atoms/Divider'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'

const BUF_LEN = 128

function ScopePanel({ canvasRef, enabled, onToggle, id, aConnected, inputARef, bConnected, inputBRef, penConnected, penRef, outARef, outBRef }) {
  return (
    <Module label="Scope" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', height: '100%', gap: 6, alignItems: 'center' }}>
        <div className="px-1" style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          <LabeledJack type="in" port="a" moduleId={id} active={aConnected} signalRef={inputARef} label="a" labelPosition="left" />
          <LabeledJack type="in" port="b" moduleId={id} active={bConnected} signalRef={inputBRef} label="b" labelPosition="left" />
          <Divider className="pb-1" />
          <LabeledJack type="out" port="a" moduleId={id} signalRef={outARef} label="a" labelPosition="left" />
          <LabeledJack type="out" port="b" moduleId={id} signalRef={outBRef} label="b" labelPosition="left" />
        </div>
        <canvas
          ref={canvasRef}
          width={200}
          height={80}
          style={{ flex: 1, minWidth: 0, height: '100%', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <JackSocket type="in" port="pen" moduleId={id} active={penConnected} signalRef={penRef} size="sm" />
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }

export default function ScopeModule({ id = 'scope1', preview }) {
  if (preview) return <ScopePanel canvasRef={NULL_REF} enabled={false} onToggle={() => {}} id={id} aConnected={false} inputARef={NULL_REF} bConnected={false} inputBRef={NULL_REF} penConnected={false} penRef={NULL_REF} outARef={NULL_REF} outBRef={NULL_REF} />

  const canvasRef = useRef(null)
  const inputARef = useRef(null)
  const inputBRef = useRef(null)
  const penRef = useRef(null)
  const outARef = useRef(null)
  const outBRef = useRef(null)
  const [enabled, setEnabled] = useState(true)
  const enabledRef = useRef(true)
  enabledRef.current = enabled
  const routing = usePatchRouting()

  const conns = routing?.connections || []
  const aConnected = conns.some(c => c.toModuleId === id && c.toPort === 'a')
  const bConnected = conns.some(c => c.toModuleId === id && c.toPort === 'b')
  const penConnected = conns.some(c => c.toModuleId === id && c.toPort === 'pen')

  const historyA = useRef(new Float32Array(BUF_LEN))
  const historyB = useRef(new Float32Array(BUF_LEN))
  const writeIdxRef = useRef(0)

  useModule({
    id,
    inputs: { a: { type: 'any' }, b: { type: 'any' }, pen: { type: 'pen' } },
    outputs: { a: { type: 'any' }, b: { type: 'any' } },
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

      const idx = writeIdxRef.current
      historyA.current[idx] = inputs.a?.type === 'scalar' ? inputs.a.value : 0
      historyB.current[idx] = inputs.b?.type === 'scalar' ? inputs.b.value : 0
      writeIdxRef.current = (idx + 1) % BUF_LEN

      return { a: inputs.a, b: inputs.b }
    },
  })

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
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)

      const hasB = inputBRef.current != null
      const wi = writeIdxRef.current
      const p = penRef.current

      const aw = hasB ? Math.floor(w / 2) : w
      drawSignal(ctx, inputARef.current, 0, 0, aw, h, historyA.current, wi, BUF_LEN, p)

      if (hasB) {
        ctx.fillStyle = 'rgba(40,40,40,0.5)'
        ctx.fillRect(Math.floor(w / 2), 0, 1, h)
        drawSignal(ctx, inputBRef.current, Math.floor(w / 2) + 1, 0, Math.ceil(w / 2) - 1, h, historyB.current, wi, BUF_LEN, p)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <ScopePanel canvasRef={canvasRef} enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id} aConnected={aConnected} inputARef={inputARef} bConnected={bConnected} inputBRef={inputBRef} penConnected={penConnected} penRef={penRef} outARef={outARef} outBRef={outBRef} />
}
