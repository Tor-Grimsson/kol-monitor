// WaveformModule — math function → points output
// 6HP

import { useState, useRef } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import IconSelect from '../controls/IconSelect'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

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

export default function WaveformModule({ id = 'wave1', preview }) {
  if (preview) return <WaveformPanel freq={20} amp={100} speed={50} shape="sin" enabled={false} onToggle={() => {}} onFreqChange={() => {}} onAmpChange={() => {}} onSpeedChange={() => {}} onShapeChange={() => {}} id={id} freqConn={false} freqInRef={{ current: null }} ampConn={false} ampInRef={{ current: null }} spdConn={false} spdInRef={{ current: null }} clkConn={false} clkInRef={{ current: null }} outRef={{ current: null }} />

  const [freq, setFreq] = useState(20)
  const [amp, setAmp] = useState(100)
  const [speed, setSpeed] = useState(50)
  const [shape, setShape] = useState('sin')
  const [enabled, setEnabled] = useState(true)
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  const freqRef = useRef(20)
  const ampRef = useRef(100)
  const speedRef = useRef(50)
  const shapeRef = useRef('sin')
  const phaseRef = useRef(0)
  const prevClkRef = useRef(false)
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

  const conns = routing?.connections || []
  const freqConn = conns.some(c => c.toModuleId === id && c.toPort === 'freq')
  const ampConn = conns.some(c => c.toModuleId === id && c.toPort === 'amp')
  const spdConn = conns.some(c => c.toModuleId === id && c.toPort === 'spd')
  const clkConn = conns.some(c => c.toModuleId === id && c.toPort === 'clk')

  useModule({
    id,
    inputs: {
      freq: { type: 'scalar' },
      amp: { type: 'scalar' },
      spd: { type: 'scalar' },
      clk: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      freqInRef.current = inputs.freq
      ampInRef.current = inputs.amp
      spdInRef.current = inputs.spd
      clkInRef.current = inputs.clk

      // Clock: reset phase on rising edge
      const clkHigh = readScalar(inputs.clk) > 50
      if (clkHigh && !prevClkRef.current) phaseRef.current = 0
      prevClkRef.current = clkHigh

      // CV modulates knob value: knob + (cv / 100) * knob range
      const f = inputs.freq
        ? 0.5 + (readScalar(inputs.freq) / 100) * 9.5
        : 0.5 + (freqRef.current / 100) * 9.5
      const a = inputs.amp
        ? readScalar(inputs.amp) / 100
        : ampRef.current / 100
      const rate = inputs.spd
        ? readScalar(inputs.spd) / 50
        : speedRef.current / 50

      phaseRef.current += dt * rate

      const pts = []
      for (let i = 0; i < RESOLUTION; i++) {
        const x = i / RESOLUTION
        const y = waveFn(x * f + phaseRef.current, shapeRef.current) * a
        pts.push({ x, y: 0.5 + y * 0.5 })
      }

      const out = points(pts)
      outRef.current = out
      return { out }
    },
  })

  return <WaveformPanel freq={freq} amp={amp} speed={speed} shape={shape} enabled={enabled} onToggle={() => setEnabled(!enabled)} onFreqChange={setFreq} onAmpChange={setAmp} onSpeedChange={setSpeed} onShapeChange={setShape} id={id} freqConn={freqConn} freqInRef={freqInRef} ampConn={ampConn} ampInRef={ampInRef} spdConn={spdConn} spdInRef={spdInRef} clkConn={clkConn} clkInRef={clkInRef} outRef={outRef} />
}
