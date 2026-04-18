// LFOModule — wave shape oscillator with sync input
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar } from '../../hooks/signals'
import { newClockSyncState, advanceClockSync } from '../../hooks/clockSync'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import IconSelect from '../parametric/IconSelect'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const SHAPES = ['sin', 'saw', 'tri', 'sqr']

// waveFn returns a bipolar value in [-1, +1]
function waveFn(phase, shape) {
  const p = phase % 1
  switch (shape) {
    case 'sin': return Math.sin(p * Math.PI * 2)
    case 'saw': return p * 2 - 1
    case 'tri': return p < 0.5 ? p * 4 - 1 : 3 - p * 4
    case 'sqr': return p < 0.5 ? 1 : -1
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
        <Knob value={offset} onChange={onOffsetChange} label="ofs" bipolar />
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={syncConnected} signalRef={syncInRef} label="clk" />
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
  const [offset, setOffset] = useState(init?.offset ?? 0)
  const [shape, setShape] = useState(init?.shape ?? 'sin')
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const rateRef = useRef(10)
  const depthRef = useRef(100)
  const offsetRef = useRef(0)
  const shapeRef = useRef('sin')
  const enabledRef = useRef(true)
  const syncRef = useRef(newClockSyncState())
  const outRef = useRef(null)
  const syncInRef = useRef(null)

  rateRef.current = rate
  depthRef.current = depth
  offsetRef.current = offset
  shapeRef.current = shape
  enabledRef.current = enabled

  const syncConnected = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { rate, depth, offset, shape }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { clk: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      syncInRef.current = inputs.clk

      // Hz: map knob 0-100 to 0.1-20 exponentially (perceptually linear across ~7.6 octaves)
      const hz = 0.1 * Math.pow(200, rateRef.current / 100)
      advanceClockSync(syncRef.current, inputs.clk, t, dt, hz)
      const phase = syncRef.current.phase

      // raw is bipolar [-1, 1]; depth scales amplitude; offset shifts DC
      const raw = waveFn(phase, shapeRef.current)
      const val = raw * depthRef.current + offsetRef.current
      const out = scalar(val)
      outRef.current = out
      return { out }
    },
  })

  return <LFOPanel rate={rate} depth={depth} offset={offset} shape={shape} enabled={enabled} onToggle={() => setEnabled(!enabled)} onRateChange={setRate} onDepthChange={setDepth} onOffsetChange={setOffset} onShapeChange={setShape} id={id} syncConnected={syncConnected} syncInRef={syncInRef} outRef={outRef} />
}
