// QuantizerModule — snap continuous signal to discrete steps
// 4HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function QuantizerPanel({ steps, enabled, onToggle, onStepsChange, id, inConnected, inRef, outputRef }) {
  return (
    <Module label="Quant" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>

        <Knob value={steps} onChange={onStepsChange} min={2} max={16} label="steps" />

        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outputRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function QuantizerModule({ id = 'quant1', init, preview }) {
  if (preview) return <QuantizerPanel steps={8} enabled={false} onToggle={() => {}} onStepsChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} outputRef={{ current: null }} />

  const [steps, setSteps] = useState(init?.steps ?? 8)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const stepsRef = useRef(8)
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  const inRef = useRef(null)

  stepsRef.current = steps
  enabledRef.current = enabled

  const inConnected = cp.has('in')

  const saveStateRef = useRef({})
  saveStateRef.current = { steps }

  useModule({
    id,
    stateRef: saveStateRef,
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
