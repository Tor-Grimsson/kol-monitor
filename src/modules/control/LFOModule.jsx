// LFOModule — wave shape oscillator with sync input
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import IconSelect from '../controls/IconSelect'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const SHAPES = ['sin', 'saw', 'tri', 'sqr']

function waveFn(phase, shape) {
  const p = phase % 1
  switch (shape) {
    case 'sin': return (Math.sin(p * Math.PI * 2) + 1) / 2
    case 'saw': return p
    case 'tri': return p < 0.5 ? p * 2 : 2 - p * 2
    case 'sqr': return p < 0.5 ? 1 : 0
    default: return 0
  }
}

function LFOPanel({ rate, depth, offset, shape, enabled, onToggle, onRateChange, onDepthChange, onOffsetChange, onShapeChange, id, syncConnected, syncInRef, outRef }) {
  return (
    <Module label="LFO" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <IconSelect value={shape} onChange={onShapeChange} columns={2} items={[
          { value: 'sin', icon: 'wave-sin' }, { value: 'saw', icon: 'wave-saw' },
          { value: 'tri', icon: 'wave-tri' }, { value: 'sqr', icon: 'wave-sqr' },
        ]} />
        <Knob value={rate} onChange={onRateChange} label="rate" />
        <Knob value={depth} onChange={onDepthChange} label="dep" />
        <Knob value={offset} onChange={onOffsetChange} label="ofs" />
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="sync" moduleId={id} active={syncConnected} signalRef={syncInRef} label="sync" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function LFOModule({ id = 'lfo1', init, preview }) {
  if (preview) return <LFOPanel rate={10} depth={100} offset={50} shape="sin" enabled={false} onToggle={() => {}} onRateChange={() => {}} onDepthChange={() => {}} onOffsetChange={() => {}} onShapeChange={() => {}} id={id} syncConnected={false} syncInRef={{ current: null }} outRef={{ current: null }} />

  const [rate, setRate] = useState(init?.rate ?? 10)     // maps to 0.1-20 Hz
  const [depth, setDepth] = useState(init?.depth ?? 100)
  const [offset, setOffset] = useState(init?.offset ?? 50)
  const [shape, setShape] = useState(init?.shape ?? 'sin')
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const rateRef = useRef(10)
  const depthRef = useRef(100)
  const offsetRef = useRef(50)
  const shapeRef = useRef('sin')
  const enabledRef = useRef(true)
  const phaseRef = useRef(0)
  const prevSyncRef = useRef(false)
  const outRef = useRef(null)
  const syncInRef = useRef(null)

  rateRef.current = rate
  depthRef.current = depth
  offsetRef.current = offset
  shapeRef.current = shape
  enabledRef.current = enabled

  const syncConnected = cp.has('sync')

  const saveStateRef = useRef({})
  saveStateRef.current = { rate, depth, offset, shape }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { sync: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      syncInRef.current = inputs.sync

      // Rising edge detection on sync
      const syncVal = readScalar(inputs.sync)
      const syncHigh = syncVal > 50
      if (syncHigh && !prevSyncRef.current) phaseRef.current = 0
      prevSyncRef.current = syncHigh

      // Hz: map knob 0-100 to 0.1-20
      const hz = 0.1 + (rateRef.current / 100) * 19.9
      phaseRef.current += dt * hz

      const raw = waveFn(phaseRef.current, shapeRef.current)
      const val = raw * depthRef.current + (100 - depthRef.current) * (offsetRef.current / 100)
      const out = scalar(val)
      outRef.current = out
      return { out }
    },
  })

  return <LFOPanel rate={rate} depth={depth} offset={offset} shape={shape} enabled={enabled} onToggle={() => setEnabled(!enabled)} onRateChange={setRate} onDepthChange={setDepth} onOffsetChange={setOffset} onShapeChange={setShape} id={id} syncConnected={syncConnected} syncInRef={syncInRef} outRef={outRef} />
}
