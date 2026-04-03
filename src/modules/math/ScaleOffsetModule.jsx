// ScaleOffsetModule — multiply and offset a signal
// 4HP

import { useState, useRef } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import Knob from '../controls/Knob'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

function ScaleOffsetPanel({ scale, offset, enabled, onToggle, onScaleChange, onOffsetChange, id, inConnected, inRef, outputRef }) {
  return (
    <Module label="S+O" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>

        <Knob value={scale} onChange={onScaleChange} min={0} max={200} label="scl" />
        <Knob value={offset} onChange={onOffsetChange} min={0} max={100} label="ofs" />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <JackSocket type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
          </div>
          <div style={{ width: '80%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <JackSocket type="out" port="out" moduleId={id} signalRef={outputRef} label="out" />
          </div>
        </div>
      </div>
    </Module>
  )
}

export default function ScaleOffsetModule({ id = 'sco1', preview }) {
  if (preview) return <ScaleOffsetPanel scale={100} offset={50} enabled={false} onToggle={() => {}} onScaleChange={() => {}} onOffsetChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} outputRef={{ current: null }} />

  const [scale, setScale] = useState(100)
  const [offset, setOffset] = useState(50)
  const [enabled, setEnabled] = useState(true)
  const routing = usePatchRouting()

  const scaleRef = useRef(100)
  const offsetRef = useRef(50)
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  const inRef = useRef(null)

  scaleRef.current = scale
  offsetRef.current = offset
  enabledRef.current = enabled

  const conns = routing?.connections || []
  const inConnected = conns.some(c => c.toModuleId === id && c.toPort === 'in')

  useModule({
    id,
    inputs: { in: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs) => {
      if (!enabledRef.current) { outputRef.current = null; return { out: null } }
      inRef.current = inputs.in

      const val = readScalar(inputs.in)
      const out = scalar(val * (scaleRef.current / 100) + offsetRef.current - 50)
      outputRef.current = out
      return { out }
    },
  })

  return <ScaleOffsetPanel scale={scale} offset={offset} enabled={enabled} onToggle={() => setEnabled(!enabled)} onScaleChange={setScale} onOffsetChange={setOffset} id={id} inConnected={inConnected} inRef={inRef} outputRef={outputRef} />
}
