// ScaleOffsetModule — multiply and offset a signal
// 4HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

function ScaleOffsetPanel({ scale, offset, enabled, onToggle, onScaleChange, onOffsetChange, id, inConnected, inRef, outputRef }) {
  return (
    <Module label="S+O" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>

        <Knob value={scale} onChange={onScaleChange} min={0} max={200} label="scl" variant="row-right" />
        <Knob value={offset} onChange={onOffsetChange} min={0} max={100} label="ofs" variant="row-right" />

        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outputRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function ScaleOffsetModule({ id = 'sco1', preview }) {
  if (preview) return <ScaleOffsetPanel scale={100} offset={50} enabled={false} onToggle={() => {}} onScaleChange={() => {}} onOffsetChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} outputRef={{ current: null }} />

  const [scale, setScale] = useState(100)
  const [offset, setOffset] = useState(50)
  const [enabled, setEnabled] = useModuleEnabled()
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
