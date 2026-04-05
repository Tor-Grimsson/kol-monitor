// OutputModule — composited multi-layer display
// 16HP, 4 layered inputs, background brightness, pen input for style

import { useRef, useEffect, useState } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Divider from '../../components/atoms/Divider'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'

const BUF_LEN = 128
const CHANNELS = ['a', 'b', 'c', 'd']

function OutputPanel({ canvasRef, bg, enabled, onToggle, onBgChange, id, connected, inputRefs, penConnected, penRef, bgConnected, bgInRef }) {
  return (
    <Module label="Out" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 4,
      }}>

        <canvas
          ref={canvasRef}
          width={240}
          height={140}
          style={{
            flex: 1,
            width: '100%',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 6 }}>
          <LabeledJack type="in" port="bg" moduleId={id} active={bgConnected} signalRef={bgInRef} label="cv" size="sm" />
          <Knob value={bg} onChange={onBgChange} label="bg" />
          <Divider variant="vertical" className="py-1.5" />
          {CHANNELS.map(ch => (
            <LabeledJack
              key={ch}
              type="in"
              port={ch}
              moduleId={id}
              active={connected[ch]}
              signalRef={{ get current() { return inputRefs.current[ch] } }}
              label={ch}
            />
          ))}
          <Divider variant="vertical" className="py-1.5" />
          <LabeledJack type="in" port="pen" moduleId={id} active={penConnected} signalRef={penRef} label="pen" size="sm" />
        </div>
      </div>
    </Module>
  )
}

export default function OutputModule({ id = 'out1', preview }) {
  if (preview) {
    const dummyInputRefs = { current: { a: null, b: null, c: null, d: null } }
    return <OutputPanel canvasRef={{ current: null }} bg={0} enabled={false} onToggle={() => {}} onBgChange={() => {}} id={id} connected={{ a: false, b: false, c: false, d: false }} inputRefs={dummyInputRefs} penConnected={false} penRef={{ current: null }} bgConnected={false} bgInRef={{ current: null }} />
  }

  const canvasRef = useRef(null)
  const [bg, setBg] = useState(0)
  const [enabled, setEnabled] = useModuleEnabled()
  const enabledRef = useRef(true)
  enabledRef.current = enabled
  const routing = usePatchRouting()

  const bgRef = useRef(0)
  bgRef.current = bg

  const inputRefs = useRef({ a: null, b: null, c: null, d: null })
  const penRef = useRef(null)
  const bgInRef = useRef(null)

  const historyRefs = useRef({
    a: new Float32Array(BUF_LEN),
    b: new Float32Array(BUF_LEN),
    c: new Float32Array(BUF_LEN),
    d: new Float32Array(BUF_LEN),
  })
  const writeIdxRef = useRef(0)

  const conns = routing?.connections || []
  const connected = {}
  for (const ch of CHANNELS) {
    connected[ch] = conns.some(c => c.toModuleId === id && c.toPort === ch)
  }
  const penConnected = conns.some(c => c.toModuleId === id && c.toPort === 'pen')
  const bgConnected = conns.some(c => c.toModuleId === id && c.toPort === 'bg')

  useModule({
    id,
    inputs: {
      a: { type: 'any' },
      b: { type: 'any' },
      c: { type: 'any' },
      d: { type: 'any' },
      pen: { type: 'pen' },
      bg: { type: 'scalar' },
    },
    outputs: {},
    process: (inputs) => {
      if (!enabledRef.current) {
        for (const ch of CHANNELS) inputRefs.current[ch] = null
        penRef.current = null
        return {}
      }
      penRef.current = inputs.pen
      bgInRef.current = inputs.bg
      const idx = writeIdxRef.current
      for (const ch of CHANNELS) {
        inputRefs.current[ch] = inputs[ch]
        if (inputs[ch] && inputs[ch].type === 'scalar') {
          historyRefs.current[ch][idx] = inputs[ch].value
        } else {
          historyRefs.current[ch][idx] = 0
        }
      }
      writeIdxRef.current = (idx + 1) % BUF_LEN
      return {}
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

      const bgVal = bgInRef.current?.type === 'scalar' ? bgInRef.current.value : bgRef.current
      const g = Math.round((bgVal / 100) * 255)
      ctx.fillStyle = `rgb(${g},${g},${g})`
      ctx.fillRect(0, 0, w, h)

      const wi = writeIdxRef.current
      const p = penRef.current
      for (const ch of CHANNELS) {
        const signal = inputRefs.current[ch]
        if (!signal) continue
        drawSignal(ctx, signal, 0, 0, w, h, historyRefs.current[ch], wi, BUF_LEN, p)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <OutputPanel canvasRef={canvasRef} bg={bg} enabled={enabled} onToggle={() => setEnabled(!enabled)} onBgChange={setBg} id={id} connected={connected} inputRefs={inputRefs} penConnected={penConnected} penRef={penRef} bgConnected={bgConnected} bgInRef={bgInRef} />
}
