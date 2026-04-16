// RampModule — ramp/triangle generator with sync
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import { ModuleRow } from '../utility/ModuleLayout'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import IconSelect from '../controls/IconSelect'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const SHAPES = ['up', 'down', 'tri']

function RampPanel({ rate, shape, enabled, onToggle, onRateChange, onShapeChange, id, rateCvConn, rateCvRef, syncConnected, syncRef, outRef }) {
  return (
    <Module label="Ramp" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <IconSelect value={shape} onChange={onShapeChange} columns={3} items={[
          { value: 'up', icon: 'ramp-up' }, { value: 'down', icon: 'ramp-down' }, { value: 'tri', icon: 'ramp-tri' },
        ]} />
        <ModuleRow>
          <JackSocket type="in" port="rateCV" moduleId={id} active={rateCvConn} signalRef={rateCvRef} size="sm" />
          <Knob value={rate} onChange={onRateChange} label="rate" variant="row-right" />
        </ModuleRow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LabeledJack type="in" port="sync" moduleId={id} active={syncConnected} signalRef={syncRef} label="rst" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function RampModule({ id = 'ramp1', init, preview }) {
  if (preview) return <RampPanel rate={20} shape="up" enabled={false} onToggle={() => {}} onRateChange={() => {}} onShapeChange={() => {}} id={id} rateCvConn={false} rateCvRef={{ current: null }} syncConnected={false} syncRef={{ current: null }} outRef={{ current: null }} />

  const [rate, setRate] = useState(init?.rate ?? 20)
  const [shape, setShape] = useState(init?.shape ?? 'up')
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const rateRef = useRef(20)
  const shapeRef = useRef('up')
  const enabledRef = useRef(true)
  const phaseRef = useRef(0)
  const prevSyncRef = useRef(false)
  const outRef = useRef(null)
  const syncRef = useRef(null)
  const rateCvRef = useRef(null)

  rateRef.current = rate
  shapeRef.current = shape
  enabledRef.current = enabled

  const syncConnected = cp.has('sync')
  const rateCvConn = cp.has('rateCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { rate, shape }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { sync: { type: 'scalar' }, rateCV: { type: 'scalar', cv: 'offset' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      syncRef.current = inputs.sync
      rateCvRef.current = inputs.rateCV

      // Rising edge detection on sync
      const syncVal = readScalar(inputs.sync)
      const syncHigh = syncVal > 50
      if (syncHigh && !prevSyncRef.current) phaseRef.current = 0
      prevSyncRef.current = syncHigh

      // Hz: map knob 0-100 to 0.1-10
      const rateVal = readCv(inputs.rateCV, rateRef.current)
      const hz = 0.1 + (rateVal / 100) * 9.9
      phaseRef.current = (phaseRef.current + dt * hz) % 1

      const p = phaseRef.current
      let val
      switch (shapeRef.current) {
        case 'down': val = (1 - p) * 100; break
        case 'tri':  val = p < 0.5 ? p * 200 : (1 - p) * 200; break
        default:     val = p * 100; break
      }

      const out = scalar(val)
      outRef.current = out
      return { out }
    },
  })

  return <RampPanel rate={rate} shape={shape} enabled={enabled} onToggle={() => setEnabled(!enabled)} onRateChange={setRate} onShapeChange={setShape} id={id} rateCvConn={rateCvConn} rateCvRef={rateCvRef} syncConnected={syncConnected} syncRef={syncRef} outRef={outRef} />
}
