// ComparatorModule — threshold comparator, outputs gate
// 4HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import { ModuleRow } from '../utility/ModuleLayout'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function ComparatorPanel({ threshold, enabled, onToggle, onThresholdChange, id, inConnected, inRef, thrCvConn, thrCvRef, outputRef }) {
  return (
    <Module label="Cmp" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <ModuleRow>
            <JackSocket type="in" port="thrCV" moduleId={id} active={thrCvConn} signalRef={thrCvRef} size="sm" />
            <Knob value={threshold} onChange={onThresholdChange} label="thr" variant="row-right" />
          </ModuleRow>
          <div style={{ display: 'flex', gap: 8 }}>
            <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
            <LabeledJack type="out" port="out" moduleId={id} signalRef={outputRef} label="out" />
          </div>
        </div>
      </div>
    </Module>
  )
}

export default function ComparatorModule({ id = 'cmp1', preview }) {
  if (preview) return <ComparatorPanel threshold={50} enabled={false} onToggle={() => {}} onThresholdChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} thrCvConn={false} thrCvRef={{ current: null }} outputRef={{ current: null }} />

  const [threshold, setThreshold] = useState(50)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const threshRef = useRef(50)
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  const inRef = useRef(null)
  const thrCvRef = useRef(null)

  threshRef.current = threshold
  enabledRef.current = enabled

  const inConnected = cp.has('in')
  const thrCvConn = cp.has('thrCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { threshold }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { in: { type: 'scalar' }, thrCV: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs) => {
      if (!enabledRef.current) { outputRef.current = null; return { out: null } }
      inRef.current = inputs.in
      thrCvRef.current = inputs.thrCV

      const thr = readCv(inputs.thrCV, threshRef.current)
      const out = scalar(readScalar(inputs.in) > thr ? 100 : 0)
      outputRef.current = out
      return { out }
    },
  })

  return <ComparatorPanel threshold={threshold} enabled={enabled} onToggle={() => setEnabled(!enabled)} onThresholdChange={setThreshold} id={id} inConnected={inConnected} inRef={inRef} thrCvConn={thrCvConn} thrCvRef={thrCvRef} outputRef={outputRef} />
}
