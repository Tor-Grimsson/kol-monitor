// LogicModule — boolean logic gates for control signals
// 4HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Divider from '../../components/atoms/Divider'
import IconSelect from '../parametric/IconSelect'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

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
          <IconSelect value={mode} onChange={onModeChange} columns={3} items={[
            { value: 'and', icon: 'logic-and' }, { value: 'or', icon: 'logic-or' }, { value: 'xor', icon: 'logic-xor' },
            { value: 'not', icon: 'logic-not' }, { value: 'nand', icon: 'logic-nand' }, { value: 'nor', icon: 'logic-nor' },
          ]} />
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

export default function LogicModule({ id = 'logic1', init, preview }) {
  if (preview) return <LogicPanel mode="and" enabled={false} onToggle={() => {}} onModeChange={() => {}} id={id} aConnected={false} aInRef={{ current: null }} bConnected={false} bInRef={{ current: null }} outputRef={{ current: null }} />

  const [mode, setMode] = useState(init?.mode ?? 'and')
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const modeRef = useRef('and')
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  const aInRef = useRef(null)
  const bInRef = useRef(null)

  modeRef.current = mode
  enabledRef.current = enabled

  const aConnected = cp.has('a')
  const bConnected = cp.has('b')

  const saveStateRef = useRef({})
  saveStateRef.current = { mode }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs) => {
      if (!enabledRef.current) { outputRef.current = null; return { out: null } }
      aInRef.current = inputs.a
      bInRef.current = inputs.b

      const aHigh = readScalar(inputs.a) > 0
      const bHigh = readScalar(inputs.b) > 0
      const result = logic(modeRef.current, aHigh, bHigh)
      const out = scalar(result ? 100 : 0)
      outputRef.current = out
      return { out }
    },
  })

  return <LogicPanel mode={mode} enabled={enabled} onToggle={() => setEnabled(!enabled)} onModeChange={setMode} id={id} aConnected={aConnected} aInRef={aInRef} bConnected={bConnected} bInRef={bInRef} outputRef={outputRef} />
}
