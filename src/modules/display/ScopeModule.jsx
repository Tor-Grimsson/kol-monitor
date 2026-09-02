// ScopeModule — 1U oscilloscope/monitor
// Canvas display with vertically stacked inputs, pass-through outputs

import { useRef, useState } from 'react'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../parametric/LabeledJack'
import Divider from '../../components/atoms/Divider'
import FlipToggle from '../parametric/FlipToggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'

const BUF_LEN = 128

function ScopePanel({ canvasRef, overlay, onOverlayChange, bipolar, onBipolarChange, enabled, onToggle, id, aConnected, inputARef, bConnected, inputBRef, penConnected, penRef, outARef, outBRef }) {
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
          style={{ flex: 1, minWidth: 0, height: '100%', borderRadius: 2, border: '1px solid var(--kol-fg-08)' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <JackSocket type="in" port="pen" moduleId={id} active={penConnected} signalRef={penRef} />
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <FlipToggle value={overlay} onChange={onOverlayChange} labelA="spl" labelB="ovr" />
            <FlipToggle value={!bipolar} onChange={(v) => onBipolarChange(!v)} labelA="uni" labelB="-/+" />
          </div>
        </div>
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }

export default function ScopeModule({ id = 'scope1', init, preview }) {
  if (preview) return <ScopePanel canvasRef={NULL_REF} overlay={false} onOverlayChange={() => {}} bipolar={false} onBipolarChange={() => {}} enabled={false} onToggle={() => {}} id={id} aConnected={false} inputARef={NULL_REF} bConnected={false} inputBRef={NULL_REF} penConnected={false} penRef={NULL_REF} outARef={NULL_REF} outBRef={NULL_REF} />

  const canvasRef = useRef(null)
  const [overlay, setOverlay] = useState(init?.overlay ?? false)
  const [bipolar, setBipolar] = useState(init?.bipolar ?? false)
  const overlayRef = useRef(false)
  const bipolarRef = useRef(false)
  const inputARef = useRef(null)
  const inputBRef = useRef(null)
  const penRef = useRef(null)
  const outARef = useRef(null)
  const outBRef = useRef(null)
  const [enabled, setEnabled] = useModuleEnabled()
  const enabledRef = useRef(true)
  overlayRef.current = overlay
  bipolarRef.current = bipolar
  enabledRef.current = enabled
  const cp = useConnectedPorts(id)

  const aConnected = cp.has('a')
  const bConnected = cp.has('b')
  const penConnected = cp.has('pen')

  const historyA = useRef(new Float32Array(BUF_LEN))
  const historyB = useRef(new Float32Array(BUF_LEN))
  const writeIdxRef = useRef(0)

  const saveStateRef = useRef({})
  saveStateRef.current = { overlay, bipolar }

  useModule({
    id,
    stateRef: saveStateRef,
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

  useCanvasLoop(canvasRef, () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    if (!w || !h) return

    ctx.fillStyle = 'rgba(8,8,8,0.95)'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)

    if (!enabledRef.current) return

    const hasB = inputBRef.current != null
    const wi = writeIdxRef.current
    const p = penRef.current
    const ovr = overlayRef.current
    const bip = bipolarRef.current

    if (hasB && !ovr) {
      const aw = Math.floor(w / 2)
      drawSignal(ctx, inputARef.current, 0, 0, aw, h, historyA.current, wi, BUF_LEN, p, bip)
      ctx.fillStyle = 'rgba(40,40,40,0.5)'
      ctx.fillRect(aw, 0, 1, h)
      drawSignal(ctx, inputBRef.current, aw + 1, 0, Math.ceil(w / 2) - 1, h, historyB.current, wi, BUF_LEN, p, bip)
    } else {
      drawSignal(ctx, inputARef.current, 0, 0, w, h, historyA.current, wi, BUF_LEN, p, bip)
      if (hasB) drawSignal(ctx, inputBRef.current, 0, 0, w, h, historyB.current, wi, BUF_LEN, p, bip)
    }
  })

  return <ScopePanel canvasRef={canvasRef} overlay={overlay} onOverlayChange={setOverlay} bipolar={bipolar} onBipolarChange={setBipolar} enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id} aConnected={aConnected} inputARef={inputARef} bConnected={bConnected} inputBRef={inputBRef} penConnected={penConnected} penRef={penRef} outARef={outARef} outBRef={outBRef} />
}
