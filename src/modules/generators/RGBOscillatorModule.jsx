// RGBOscillatorModule — 3-channel color vector output
// 8HP — per-channel osc toggle: on = rate oscillator, off = constant brightness

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { color, scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

function RGBOscillatorPanel({ rRate, gRate, bRate, rOsc, gOsc, bOsc, rClr, gClr, bClr, enabled, onToggle, onRRateChange, onGRateChange, onBRateChange, onROscChange, onGOscChange, onBOscChange, onRClrChange, onGClrChange, onBClrChange, id, rConn, rInRef, gConn, gInRef, bConn, bInRef, clkConn, clkRef, rOutRef, gOutRef, bOutRef, outRef }) {
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '0 2px' }

  return (
    <Module label="RGB" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <div style={rowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Toggle size="sm" value={rOsc} onChange={onROscChange} label="osc" />
            <Toggle size="sm" value={rClr} onChange={onRClrChange} label="clr" />
          </div>
          <LabeledJack type="in" port="r" moduleId={id} active={rConn} signalRef={rInRef} label="in" size="sm" />
          <Knob value={rRate} onChange={onRRateChange} label="R" />
          <LabeledJack type="out" port="r" moduleId={id} signalRef={rOutRef} label="out" size="sm" />
        </div>
        <div style={rowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Toggle size="sm" value={gOsc} onChange={onGOscChange} label="osc" />
            <Toggle size="sm" value={gClr} onChange={onGClrChange} label="clr" />
          </div>
          <LabeledJack type="in" port="g" moduleId={id} active={gConn} signalRef={gInRef} label="in" size="sm" />
          <Knob value={gRate} onChange={onGRateChange} label="G" />
          <LabeledJack type="out" port="g" moduleId={id} signalRef={gOutRef} label="out" size="sm" />
        </div>
        <div style={rowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Toggle size="sm" value={bOsc} onChange={onBOscChange} label="osc" />
            <Toggle size="sm" value={bClr} onChange={onBClrChange} label="clr" />
          </div>
          <LabeledJack type="in" port="b" moduleId={id} active={bConn} signalRef={bInRef} label="in" size="sm" />
          <Knob value={bRate} onChange={onBRateChange} label="B" />
          <LabeledJack type="out" port="b" moduleId={id} signalRef={bOutRef} label="out" size="sm" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkRef} label="clk" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="color" />
        </div>
      </div>
    </Module>
  )
}

export default function RGBOscillatorModule({ id = 'rgb1', preview }) {
  if (preview) return <RGBOscillatorPanel rRate={30} gRate={50} bRate={70} rOsc={false} gOsc={false} bOsc={false} rClr={false} gClr={false} bClr={false} enabled={false} onToggle={() => {}} onRRateChange={() => {}} onGRateChange={() => {}} onBRateChange={() => {}} onROscChange={() => {}} onGOscChange={() => {}} onBOscChange={() => {}} onRClrChange={() => {}} onGClrChange={() => {}} onBClrChange={() => {}} id={id} rConn={false} rInRef={{ current: null }} gConn={false} gInRef={{ current: null }} bConn={false} bInRef={{ current: null }} clkConn={false} clkRef={{ current: null }} rOutRef={{ current: null }} gOutRef={{ current: null }} bOutRef={{ current: null }} outRef={{ current: null }} />

  const [rRate, setRRate] = useState(30)
  const [gRate, setGRate] = useState(50)
  const [bRate, setBRate] = useState(70)
  const [rOsc, setROsc] = useState(true)
  const [gOsc, setGOsc] = useState(true)
  const [bOsc, setBOsc] = useState(true)
  const [rClr, setRClr] = useState(false)
  const [gClr, setGClr] = useState(false)
  const [bClr, setBClr] = useState(false)
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  const rOscRef = useRef(true)
  const gOscRef = useRef(true)
  const bOscRef = useRef(true)
  const rClrRef = useRef(false)
  const gClrRef = useRef(false)
  const bClrRef = useRef(false)
  const rRateRef = useRef(30)
  const gRateRef = useRef(50)
  const bRateRef = useRef(70)
  const outRef = useRef(null)
  const rOutRef = useRef(null)
  const gOutRef = useRef(null)
  const bOutRef = useRef(null)
  const rInRef = useRef(null)
  const gInRef = useRef(null)
  const bInRef = useRef(null)
  const clkRef = useRef(null)
  const prevClkRef = useRef(false)
  const phaseOffsetRef = useRef(0)

  enabledRef.current = enabled
  rOscRef.current = rOsc
  gOscRef.current = gOsc
  bOscRef.current = bOsc
  rClrRef.current = rClr
  gClrRef.current = gClr
  bClrRef.current = bClr
  rRateRef.current = rRate
  gRateRef.current = gRate
  bRateRef.current = bRate

  const conns = routing?.connections || []
  const rConn = conns.some(c => c.toModuleId === id && c.toPort === 'r')
  const gConn = conns.some(c => c.toModuleId === id && c.toPort === 'g')
  const bConn = conns.some(c => c.toModuleId === id && c.toPort === 'b')
  const clkConn = conns.some(c => c.toModuleId === id && c.toPort === 'clk')

  useModule({
    id,
    inputs: {
      r: { type: 'scalar' },
      g: { type: 'scalar' },
      b: { type: 'scalar' },
      clk: { type: 'scalar' },
    },
    outputs: {
      r: { type: 'scalar' },
      g: { type: 'scalar' },
      b: { type: 'scalar' },
      out: { type: 'color' },
    },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; rOutRef.current = null; gOutRef.current = null; bOutRef.current = null; return { r: null, g: null, b: null, out: null } }
      rInRef.current = inputs.r
      gInRef.current = inputs.g
      bInRef.current = inputs.b
      clkRef.current = inputs.clk

      // Clock sync: reset phase on rising edge
      const clkHigh = readScalar(inputs.clk) > 50
      if (clkHigh && !prevClkRef.current) {
        phaseOffsetRef.current = t
      }
      prevClkRef.current = clkHigh
      const pt = t - phaseOffsetRef.current

      function ch(input, knob, oscOn) {
        if (input) return readScalar(input) / 100
        if (!oscOn) return knob / 100
        return (Math.sin(pt * (0.1 + (knob / 100) * 9.9) * Math.PI * 2) + 1) / 2
      }

      const r = ch(inputs.r, rRateRef.current, rOscRef.current)
      const g = ch(inputs.g, gRateRef.current, gOscRef.current)
      const b = ch(inputs.b, bRateRef.current, bOscRef.current)

      const rOut = rClrRef.current ? color(r, 0, 0) : scalar(r * 100)
      const gOut = gClrRef.current ? color(0, g, 0) : scalar(g * 100)
      const bOut = bClrRef.current ? color(0, 0, b) : scalar(b * 100)
      const out = color(r, g, b)

      rOutRef.current = rOut
      gOutRef.current = gOut
      bOutRef.current = bOut
      outRef.current = out
      return { r: rOut, g: gOut, b: bOut, out }
    },
  })

  return <RGBOscillatorPanel rRate={rRate} gRate={gRate} bRate={bRate} rOsc={rOsc} gOsc={gOsc} bOsc={bOsc} rClr={rClr} gClr={gClr} bClr={bClr} enabled={enabled} onToggle={() => setEnabled(!enabled)} onRRateChange={setRRate} onGRateChange={setGRate} onBRateChange={setBRate} onROscChange={setROsc} onGOscChange={setGOsc} onBOscChange={setBOsc} onRClrChange={setRClr} onGClrChange={setGClr} onBClrChange={setBClr} id={id} rConn={rConn} rInRef={rInRef} gConn={gConn} gInRef={gInRef} bConn={bConn} bInRef={bInRef} clkConn={clkConn} clkRef={clkRef} rOutRef={rOutRef} gOutRef={gOutRef} bOutRef={bOutRef} outRef={outRef} />
}
