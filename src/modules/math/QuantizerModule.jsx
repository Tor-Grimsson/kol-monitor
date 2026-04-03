// QuantizerModule — snap continuous signal to discrete steps
// 4HP

import { useState, useRef } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import Knob from '../controls/Knob'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

function QuantizerPanel({ steps, enabled, onToggle, onStepsChange, id, inConnected, inRef, outputRef }) {
  return (
    <Module label="Quant" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>

        <Knob value={steps} onChange={onStepsChange} min={2} max={16} label="steps" />

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

export default function QuantizerModule({ id = 'quant1', preview }) {
  if (preview) return <QuantizerPanel steps={8} enabled={false} onToggle={() => {}} onStepsChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} outputRef={{ current: null }} />

  const [steps, setSteps] = useState(8)
  const [enabled, setEnabled] = useState(true)
  const routing = usePatchRouting()

  const stepsRef = useRef(8)
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  const inRef = useRef(null)

  stepsRef.current = steps
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
      const step = 100 / stepsRef.current
      const out = scalar(Math.round(val / step) * step)
      outputRef.current = out
      return { out }
    },
  })

  return <QuantizerPanel steps={steps} enabled={enabled} onToggle={() => setEnabled(!enabled)} onStepsChange={setSteps} id={id} inConnected={inConnected} inRef={inRef} outputRef={outputRef} />
}
