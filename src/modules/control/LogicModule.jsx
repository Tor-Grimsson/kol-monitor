// LogicModule — boolean logic gates for control signals
// 4HP

import { useState, useRef } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Divider from '../../components/atoms/Divider'
import LogicSelect from '../controls/LogicSelect'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

const MODES = ['and', 'or', 'xor', 'not', 'nand', 'nor']

function logic(mode, a, b) {
  switch (mode) {
    case 'and':  return a && b
    case 'or':   return a || b
    case 'xor':  return a !== b
    case 'not':  return !a
    case 'nand': return !(a && b)
    case 'nor':  return !(a || b)
    default:     return false
  }
}

function LogicPanel({ mode, enabled, onToggle, onModeChange, id, aConnected, aInRef, bConnected, bInRef, outputRef }) {
  return (
    <Module label="Logic" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <LogicSelect value={mode} onChange={onModeChange} />
          <Divider className="pt-1" />
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
            <LabeledJack type="in" port="a" moduleId={id} active={aConnected} signalRef={aInRef} label="a" />
            <LabeledJack type="in" port="b" moduleId={id} active={bConnected} signalRef={bInRef} label="b" />
            <Divider variant="vertical" className="py-1.5" />
            <LabeledJack type="out" port="out" moduleId={id} signalRef={outputRef} label="out" />
          </div>
        </div>
      </div>
    </Module>
  )
}

export default function LogicModule({ id = 'logic1', preview }) {
  if (preview) return <LogicPanel mode="and" enabled={false} onToggle={() => {}} onModeChange={() => {}} id={id} aConnected={false} aInRef={{ current: null }} bConnected={false} bInRef={{ current: null }} outputRef={{ current: null }} />

  const [mode, setMode] = useState('and')
  const [enabled, setEnabled] = useState(true)
  const routing = usePatchRouting()

  const modeRef = useRef('and')
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  const aInRef = useRef(null)
  const bInRef = useRef(null)

  modeRef.current = mode
  enabledRef.current = enabled

  const conns = routing?.connections || []
  const aConnected = conns.some(c => c.toModuleId === id && c.toPort === 'a')
  const bConnected = conns.some(c => c.toModuleId === id && c.toPort === 'b')

  useModule({
    id,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs) => {
      if (!enabledRef.current) { outputRef.current = null; return { out: null } }
      aInRef.current = inputs.a
      bInRef.current = inputs.b

      const aHigh = readScalar(inputs.a) > 50
      const bHigh = readScalar(inputs.b) > 50
      const result = logic(modeRef.current, aHigh, bHigh)
      const out = scalar(result ? 100 : 0)
      outputRef.current = out
      return { out }
    },
  })

  return <LogicPanel mode={mode} enabled={enabled} onToggle={() => setEnabled(!enabled)} onModeChange={setMode} id={id} aConnected={aConnected} aInRef={aInRef} bConnected={bConnected} bInRef={bInRef} outputRef={outputRef} />
}
