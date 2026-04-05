// ConstantModule — test source, outputs a fixed scalar value
// 4HP 1U, one knob, one output jack

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import Knob from '../controls/Knob'

function ConstantPanel({ value, enabled, onToggle, onValueChange, id, outputRef }) {
  return (
    <Module label="Const" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '4px 0',
      }}>

        {/* Knob */}
        <Knob value={value} onChange={onValueChange} />

        {/* Output jack */}
        <JackSocket
          type="out"
          port="value"
          moduleId={id}
          signalRef={outputRef}
          label="out"
        />
      </div>
    </Module>
  )
}

export default function ConstantModule({ id = 'const1', preview }) {
  if (preview) return <ConstantPanel value={50} enabled={false} onToggle={() => {}} onValueChange={() => {}} id={id} outputRef={{ current: null }} />

  const [value, setValue] = useState(50)
  const [enabled, setEnabled] = useModuleEnabled()
  const valueRef = useRef(50)
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  valueRef.current = value
  enabledRef.current = enabled

  useModule({
    id,
    inputs: {},
    outputs: { value: { type: 'scalar' } },
    process: () => {
      if (!enabledRef.current) { outputRef.current = null; return { value: null } }
      const out = scalar(valueRef.current)
      outputRef.current = out
      return { value: out }
    },
  })

  return <ConstantPanel value={value} enabled={enabled} onToggle={() => setEnabled(!enabled)} onValueChange={setValue} id={id} outputRef={outputRef} />
}
