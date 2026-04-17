// WaveformModule — math function → points output
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar, readCv } from '../../hooks/signals'
import { newClockSyncState, advanceClockSync } from '../../hooks/clockSync'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import IconSelect from '../parametric/IconSelect'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const SHAPES = ['sin', 'saw', 'tri', 'sqr']
const RESOLUTION = 64

function waveFn(x, shape) {
  const p = ((x % 1) + 1) % 1
  switch (shape) {
    case 'sin': return Math.sin(p * Math.PI * 2)
    case 'saw': return p * 2 - 1
    case 'tri': return p < 0.5 ? p * 4 - 1 : 3 - p * 4
    case 'sqr': return p < 0.5 ? 1 : -1
    default: return 0
  }
}

function WaveformPanel({ freq, amp, speed, shape, enabled, onToggle, onFreqChange, onAmpChange, onSpeedChange, onShapeChange, id, freqConn, freqInRef, ampConn, ampInRef, spdConn, spdInRef, clkConn, clkInRef, outRef }) {
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '0 2px' }

  return (
    <Module label="Wave" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <IconSelect value={shape} onChange={onShapeChange} columns={2} items={[
          { value: 'sin', icon: 'wave-sin' }, { value: 'saw', icon: 'wave-saw' },
          { value: 'tri', icon: 'wave-tri' }, { value: 'sqr', icon: 'wave-sqr' },
        ]} />
        <div style={rowStyle}>
          <LabeledJack type="in" port="freq" moduleId={id} active={freqConn} signalRef={freqInRef} label="in" size="sm" />
          <Knob value={freq} onChange={onFreqChange} label="frq" />
        </div>
        <div style={rowStyle}>
          <LabeledJack type="in" port="amp" moduleId={id} active={ampConn} signalRef={ampInRef} label="in" size="sm" />
          <Knob value={amp} onChange={onAmpChange} label="amp" />
        </div>
        <div style={rowStyle}>
          <LabeledJack type="in" port="spd" moduleId={id} active={spdConn} signalRef={spdInRef} label="in" size="sm" />
          <Knob value={speed} onChange={onSpeedChange} label="spd" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkInRef} label="clk" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function WaveformModule({ id = 'wave1', init, preview }) {
  if (preview) return <WaveformPanel freq={20} amp={100} speed={50} shape="sin" enabled={false} onToggle={() => {}} onFreqChange={() => {}} onAmpChange={() => {}} onSpeedChange={() => {}} onShapeChange={() => {}} id={id} freqConn={false} freqInRef={{ current: null }} ampConn={false} ampInRef={{ current: null }} spdConn={false} spdInRef={{ current: null }} clkConn={false} clkInRef={{ current: null }} outRef={{ current: null }} />

  const [freq, setFreq] = useState(init?.freq ?? 20)
  const [amp, setAmp] = useState(init?.amp ?? 100)
  const [speed, setSpeed] = useState(init?.speed ?? 50)
  const [shape, setShape] = useState(init?.shape ?? 'sin')
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const freqRef = useRef(20)
  const ampRef = useRef(100)
  const speedRef = useRef(50)
  const shapeRef = useRef('sin')
  const syncRef = useRef(newClockSyncState())
  const outRef = useRef(null)
  const freqInRef = useRef(null)
  const ampInRef = useRef(null)
  const spdInRef = useRef(null)
  const clkInRef = useRef(null)

  freqRef.current = freq
  ampRef.current = amp
  speedRef.current = speed
  enabledRef.current = enabled
  shapeRef.current = shape

  const freqConn = cp.has('freq')
  const ampConn = cp.has('amp')
  const spdConn = cp.has('spd')
  const clkConn = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { freq, amp, speed, shape }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      freq: { type: 'scalar', cv: 'offset' },
      amp: { type: 'scalar', cv: 'attenuate' },
      spd: { type: 'scalar', cv: 'offset' },
      clk: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      freqInRef.current = inputs.freq
      ampInRef.current = inputs.amp
      spdInRef.current = inputs.spd
      clkInRef.current = inputs.clk

      const f = 0.5 + (readCv(inputs.freq, freqRef.current) / 100) * 9.5
      const a = readCv(inputs.amp, ampRef.current, 'attenuate') / 100
      const rate = readCv(inputs.spd, speedRef.current) / 50

      // Sync advances phase at clock tempo once 2+ ticks received; otherwise at knob rate.
      advanceClockSync(syncRef.current, inputs.clk, t, dt, rate)
      const phase = syncRef.current.phase

      const pts = []
      for (let i = 0; i < RESOLUTION; i++) {
        const x = i / RESOLUTION
        const y = waveFn(x * f + phase, shapeRef.current) * a
        pts.push({ x, y: 0.5 + y * 0.5 })
      }

      const out = points(pts)
      outRef.current = out
      return { out }
    },
  })

  return <WaveformPanel freq={freq} amp={amp} speed={speed} shape={shape} enabled={enabled} onToggle={() => setEnabled(!enabled)} onFreqChange={setFreq} onAmpChange={setAmp} onSpeedChange={setSpeed} onShapeChange={setShape} id={id} freqConn={freqConn} freqInRef={freqInRef} ampConn={ampConn} ampInRef={ampInRef} spdConn={spdConn} spdInRef={spdInRef} clkConn={clkConn} clkInRef={clkInRef} outRef={outRef} />
}
