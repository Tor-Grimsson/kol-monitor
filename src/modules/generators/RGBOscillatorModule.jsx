// RGBOscillatorModule — 3-channel color vector output
// 8HP — per-channel osc toggle: on = rate oscillator, off = constant brightness

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { color, scalar, readScalar } from '../../hooks/signals'
import { newClockSyncState, advanceClockSync } from '../../hooks/clockSync'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import Toggle from '../parametric/Toggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function RGBOscillatorPanel({ rRate, gRate, bRate, rOsc, gOsc, bOsc, rScl, gScl, bScl, enabled, onToggle, onRRateChange, onGRateChange, onBRateChange, onROscChange, onGOscChange, onBOscChange, onRSclChange, onGSclChange, onBSclChange, id, rConn, rInRef, gConn, gInRef, bConn, bInRef, clkConn, clkRef, rOutRef, gOutRef, bOutRef, outRef }) {
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
            <Toggle size="sm" value={rScl} onChange={onRSclChange} label="scl" />
          </div>
          <LabeledJack type="in" port="r" moduleId={id} active={rConn} signalRef={rInRef} label="in" size="sm" />
          <Knob value={rRate} onChange={onRRateChange} label="R" />
          <LabeledJack type="out" port="r" moduleId={id} signalRef={rOutRef} label="out" size="sm" />
        </div>
        <div style={rowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Toggle size="sm" value={gOsc} onChange={onGOscChange} label="osc" />
            <Toggle size="sm" value={gScl} onChange={onGSclChange} label="scl" />
          </div>
          <LabeledJack type="in" port="g" moduleId={id} active={gConn} signalRef={gInRef} label="in" size="sm" />
          <Knob value={gRate} onChange={onGRateChange} label="G" />
          <LabeledJack type="out" port="g" moduleId={id} signalRef={gOutRef} label="out" size="sm" />
        </div>
        <div style={rowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Toggle size="sm" value={bOsc} onChange={onBOscChange} label="osc" />
            <Toggle size="sm" value={bScl} onChange={onBSclChange} label="scl" />
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

export default function RGBOscillatorModule({ id = 'rgb1', init, preview }) {
  if (preview) return <RGBOscillatorPanel rRate={30} gRate={50} bRate={70} rOsc={false} gOsc={false} bOsc={false} rScl={false} gScl={false} bScl={false} enabled={false} onToggle={() => {}} onRRateChange={() => {}} onGRateChange={() => {}} onBRateChange={() => {}} onROscChange={() => {}} onGOscChange={() => {}} onBOscChange={() => {}} onRSclChange={() => {}} onGSclChange={() => {}} onBSclChange={() => {}} id={id} rConn={false} rInRef={{ current: null }} gConn={false} gInRef={{ current: null }} bConn={false} bInRef={{ current: null }} clkConn={false} clkRef={{ current: null }} rOutRef={{ current: null }} gOutRef={{ current: null }} bOutRef={{ current: null }} outRef={{ current: null }} />

  const [rRate, setRRate] = useState(init?.rRate ?? 30)
  const [gRate, setGRate] = useState(init?.gRate ?? 50)
  const [bRate, setBRate] = useState(init?.bRate ?? 70)
  const [rOsc, setROsc] = useState(init?.rOsc ?? false)
  const [gOsc, setGOsc] = useState(init?.gOsc ?? false)
  const [bOsc, setBOsc] = useState(init?.bOsc ?? false)
  // Per-channel output mode. Default false = color signal (e.g. R emits color(r,0,0)).
  // Toggle "scl" to switch that channel to a scalar(channel*100) output.
  const [rScl, setRScl] = useState(init?.rScl ?? false)
  const [gScl, setGScl] = useState(init?.gScl ?? false)
  const [bScl, setBScl] = useState(init?.bScl ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const rOscRef = useRef(false)
  const gOscRef = useRef(false)
  const bOscRef = useRef(false)
  const rSclRef = useRef(false)
  const gSclRef = useRef(false)
  const bSclRef = useRef(false)
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
  const syncRRef = useRef(newClockSyncState())
  const syncGRef = useRef(newClockSyncState())
  const syncBRef = useRef(newClockSyncState())

  enabledRef.current = enabled
  rOscRef.current = rOsc
  gOscRef.current = gOsc
  bOscRef.current = bOsc
  rSclRef.current = rScl
  gSclRef.current = gScl
  bSclRef.current = bScl
  rRateRef.current = rRate
  gRateRef.current = gRate
  bRateRef.current = bRate

  const rConn = cp.has('r')
  const gConn = cp.has('g')
  const bConn = cp.has('b')
  const clkConn = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { rRate, gRate, bRate, rOsc, gOsc, bOsc, rScl, gScl, bScl }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      r: { type: 'scalar', cv: 'offset' },
      g: { type: 'scalar', cv: 'offset' },
      b: { type: 'scalar', cv: 'offset' },
      clk: { type: 'scalar' },
    },
    outputs: {
      r: { type: 'color' },
      g: { type: 'color' },
      b: { type: 'color' },
      out: { type: 'color' },
    },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; rOutRef.current = null; gOutRef.current = null; bOutRef.current = null; return { r: null, g: null, b: null, out: null } }
      rInRef.current = inputs.r
      gInRef.current = inputs.g
      bInRef.current = inputs.b
      clkRef.current = inputs.clk

      // Per-channel phase. When clk is patched + ticking, all 3 phases lock to clock period.
      // Otherwise each advances at its own knob rate.
      const rHz = 0.1 + (rRateRef.current / 100) * 9.9
      const gHz = 0.1 + (gRateRef.current / 100) * 9.9
      const bHz = 0.1 + (bRateRef.current / 100) * 9.9
      advanceClockSync(syncRRef.current, inputs.clk, t, dt, rHz)
      advanceClockSync(syncGRef.current, inputs.clk, t, dt, gHz)
      advanceClockSync(syncBRef.current, inputs.clk, t, dt, bHz)

      function ch(input, knob, oscOn, phase) {
        if (input) return readScalar(input) / 100
        if (!oscOn) return knob / 100
        return (Math.sin(phase * Math.PI * 2) + 1) / 2
      }

      const r = ch(inputs.r, rRateRef.current, rOscRef.current, syncRRef.current.phase)
      const g = ch(inputs.g, gRateRef.current, gOscRef.current, syncGRef.current.phase)
      const b = ch(inputs.b, bRateRef.current, bOscRef.current, syncBRef.current.phase)

      const rOut = rSclRef.current ? scalar(r * 100) : color(r, 0, 0)
      const gOut = gSclRef.current ? scalar(g * 100) : color(0, g, 0)
      const bOut = bSclRef.current ? scalar(b * 100) : color(0, 0, b)
      const out = color(r, g, b)

      rOutRef.current = rOut
      gOutRef.current = gOut
      bOutRef.current = bOut
      outRef.current = out
      return { r: rOut, g: gOut, b: bOut, out }
    },
  })

  return <RGBOscillatorPanel rRate={rRate} gRate={gRate} bRate={bRate} rOsc={rOsc} gOsc={gOsc} bOsc={bOsc} rScl={rScl} gScl={gScl} bScl={bScl} enabled={enabled} onToggle={() => setEnabled(!enabled)} onRRateChange={setRRate} onGRateChange={setGRate} onBRateChange={setBRate} onROscChange={setROsc} onGOscChange={setGOsc} onBOscChange={setBOsc} onRSclChange={setRScl} onGSclChange={setGScl} onBSclChange={setBScl} id={id} rConn={rConn} rInRef={rInRef} gConn={gConn} gInRef={gInRef} bConn={bConn} bInRef={bInRef} clkConn={clkConn} clkRef={clkRef} rOutRef={rOutRef} gOutRef={gOutRef} bOutRef={bOutRef} outRef={outRef} />
}
