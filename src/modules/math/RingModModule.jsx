// RingModModule — ring modulator
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModuleBypass } from '../../hooks/useModuleBypass.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Divider from '../../components/atoms/Divider'
import Knob from '../controls/Knob'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function RingModPanel({ depth, enabled, onToggle, bypass, onBypass, onDepthChange, id, aConnected, aRef, bConnected, bRef, depthCvConn, depthCvRef, outRef }) {
  return (
    <Module label="Ring" enabled={enabled} onToggle={onToggle} u={1} bypass={bypass} onBypass={onBypass}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <JackSocket type="in" port="depthCV" moduleId={id} active={depthCvConn} signalRef={depthCvRef} size="sm" />
          <Knob value={depth} onChange={onDepthChange} label="depth" variant="row-right" />
        </div>
        <Divider />
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
          <LabeledJack type="in" port="a" moduleId={id} active={aConnected} signalRef={aRef} label="a" />
          <LabeledJack type="in" port="b" moduleId={id} active={bConnected} signalRef={bRef} label="b" />
          <Divider variant="vertical" className="py-1.5" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function RingModModule({ id = 'ring1', init, preview }) {
  if (preview) return <RingModPanel depth={100} enabled={false} onToggle={() => {}} onDepthChange={() => {}} id={id} aConnected={false} aRef={{ current: null }} bConnected={false} bRef={{ current: null }} depthCvConn={false} depthCvRef={{ current: null }} outRef={{ current: null }} />

  const [depth, setDepth] = useState(init?.depth ?? 100)
  const [enabled, setEnabled] = useModuleEnabled()
  const [bypass, setBypass] = useModuleBypass(init?.bypass ?? false)
  const cp = useConnectedPorts(id)

  const depthRef = useRef(100)
  const enabledRef = useRef(true)
  const outRef = useRef(null)
  const aRef = useRef(null)
  const bRef = useRef(null)
  const depthCvRef = useRef(null)

  depthRef.current = depth
  enabledRef.current = enabled

  const aConnected = cp.has('a')
  const bConnected = cp.has('b')
  const depthCvConn = cp.has('depthCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { depth, bypass }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' }, depthCV: { type: 'scalar', cv: 'attenuate' } },
    outputs: { out: { type: 'scalar' } },
    bypass: { in: 'a', out: 'out' },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      aRef.current = inputs.a
      bRef.current = inputs.b
      depthCvRef.current = inputs.depthCV

      const aVal = readScalar(inputs.a)
      const bVal = readScalar(inputs.b)
      const d = readCv(inputs.depthCV, depthRef.current, 'attenuate') / 100
      const wet = aVal * bVal / 100
      const out = scalar(aVal * (1 - d) + wet * d)
      outRef.current = out
      return { out }
    },
  })

  return <RingModPanel depth={depth} enabled={enabled} onToggle={() => setEnabled(!enabled)} bypass={bypass} onBypass={() => setBypass(!bypass)} onDepthChange={setDepth} id={id} aConnected={aConnected} aRef={aRef} bConnected={bConnected} bRef={bRef} depthCvConn={depthCvConn} depthCvRef={depthCvRef} outRef={outRef} />
}
