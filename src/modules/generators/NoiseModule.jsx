// NoiseModule — noise tools: clock/pulse, pink/white noise, sample & hold, slew limiter
// 20HP 1U. Left-to-right signal flow with normalled connections.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import Divider from '../../components/atoms/Divider'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import FlipToggle from '../controls/FlipToggle'
import LED from '../controls/LED'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function NoisePanel({
  rate, slewTime, randomMode, trackMode, enabled, onToggle,
  onRateChange, onSlewTimeChange, onRandomModeChange, onTrackModeChange,
  id, clockPulse, randomActive,
  clkInConn, clkInRef, trigInConn, trigInRef, shInConn, shInRef, slewInConn, slewInRef,
  pinkRef, whiteRef, pulseRef, holdRef, slewRef,
}) {
  return (
    <Module label="Noise" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 16 }}>

        {/* Pulse Rate knob */}
        <Knob value={rate} onChange={onRateChange} label="pulse rate" />

        {/* Clock/Random + Noise outputs — bottom-aligned pair */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
              <FlipToggle value={randomMode} onChange={onRandomModeChange} labelA="clk" labelB="rnd" />
              <div style={{ position: 'absolute', left: -10, bottom: 12, transform: 'translateY(-50%)' }}>
                <LED active={clockPulse} color="yellow" />
              </div>
            </div>
            <LabeledJack type="out" port="pink" moduleId={id} signalRef={pinkRef} label="pink" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <LabeledJack type="out" port="pulse" moduleId={id} signalRef={pulseRef} label="pls" />
            <LabeledJack type="out" port="white" moduleId={id} signalRef={whiteRef} label="wht" />
          </div>
        </div>

        <Divider variant="vertical" />

        {/* S&H — bottom-aligned pair */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <LabeledJack type="in" port="trigIn" moduleId={id} active={trigInConn} signalRef={trigInRef} label="trig" />
            <LabeledJack type="in" port="shIn" moduleId={id} active={shInConn} signalRef={shInRef} label="in" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
              <FlipToggle value={trackMode} onChange={onTrackModeChange} labelA="smp" labelB="trk" />
              <div style={{ position: 'absolute', right: -10, bottom: 12, transform: 'translateY(-50%)' }}>
                <LED active={randomActive} color="white" />
              </div>
            </div>
            <LabeledJack type="out" port="hold" moduleId={id} signalRef={holdRef} label="hold" />
          </div>
        </div>

        <Divider variant="vertical" />

        {/* Slew in + out stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <LabeledJack type="in" port="slewIn" moduleId={id} active={slewInConn} signalRef={slewInRef} label="in" />
          <LabeledJack type="out" port="slew" moduleId={id} signalRef={slewRef} label="slew" />
        </div>

        {/* Slew Time knob */}
        <Knob value={slewTime} onChange={onSlewTimeChange} label="slew time" />

      </div>
    </Module>
  )
}

const NOOP = () => {}
const NULL_REF = { current: null }

export default function NoiseModule({ id = 'noise1', preview }) {
  if (preview) return <NoisePanel
    rate={50} slewTime={50} randomMode={false} trackMode={false} enabled={false}
    onToggle={NOOP} onRateChange={NOOP} onSlewTimeChange={NOOP} onRandomModeChange={NOOP} onTrackModeChange={NOOP}
    id={id} clockPulse={false} randomActive={false}
    clkInConn={false} clkInRef={NULL_REF} trigInConn={false} trigInRef={NULL_REF}
    shInConn={false} shInRef={NULL_REF} slewInConn={false} slewInRef={NULL_REF}
    pinkRef={NULL_REF} whiteRef={NULL_REF} pulseRef={NULL_REF} holdRef={NULL_REF} slewRef={NULL_REF}
  />

  const [rate, setRate] = useState(50)
  const [slewTime, setSlewTime] = useState(50)
  const [randomMode, setRandomMode] = useState(false)
  const [trackMode, setTrackMode] = useState(false)
  const [enabled, setEnabled] = useModuleEnabled()
  const [clockPulse, setClockPulse] = useState(false)
  const [randomActive, setRandomActive] = useState(false)
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const rateRef = useRef(50)
  const slewTimeRef = useRef(50)
  const randomModeRef = useRef(false)
  const trackModeRef = useRef(false)

  // Internal state
  const phaseRef = useRef(0)
  const gateRef = useRef(false)
  const prevGateRef = useRef(false)
  const pinkAccRef = useRef(50)
  const holdValRef = useRef(50)
  const slewValRef = useRef(50)
  const randomGateTimerRef = useRef(0)

  // Signal refs
  const clkInRef = useRef(null)
  const trigInRef = useRef(null)
  const shInRef = useRef(null)
  const slewInRef = useRef(null)
  const pinkRef = useRef(null)
  const whiteRef = useRef(null)
  const pulseRef = useRef(null)
  const holdRef = useRef(null)
  const slewRef = useRef(null)

  enabledRef.current = enabled
  rateRef.current = rate
  slewTimeRef.current = slewTime
  randomModeRef.current = randomMode
  trackModeRef.current = trackMode

  const clkInConn = cp.has('clkIn')
  const trigInConn = cp.has('trigIn')
  const shInConn = cp.has('shIn')
  const slewInConn = cp.has('slewIn')

  const saveStateRef = useRef({})
  saveStateRef.current = { rate, slewTime, randomMode, trackMode }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      clkIn: { type: 'scalar' },
      trigIn: { type: 'scalar' },
      shIn: { type: 'scalar' },
      slewIn: { type: 'scalar' },
    },
    outputs: {
      pink: { type: 'scalar' },
      white: { type: 'scalar' },
      pulse: { type: 'scalar' },
      hold: { type: 'scalar' },
      slew: { type: 'scalar' },
    },
    process: (inputs, dt) => {
      if (!enabledRef.current) {
        pinkRef.current = null; whiteRef.current = null; pulseRef.current = null
        holdRef.current = null; slewRef.current = null
        return { pink: null, white: null, pulse: null, hold: null, slew: null }
      }

      clkInRef.current = inputs.clkIn
      trigInRef.current = inputs.trigIn
      shInRef.current = inputs.shIn
      slewInRef.current = inputs.slewIn

      // --- Clock / Pulse ---
      const hz = 0.1 + (rateRef.current / 100) * 19.9
      phaseRef.current += dt * hz
      let gate = false

      if (randomModeRef.current) {
        randomGateTimerRef.current -= dt
        if (randomGateTimerRef.current <= 0) {
          randomGateTimerRef.current = (0.05 + Math.random() * 0.2) / (hz / 2)
          gate = Math.random() > 0.4
        } else {
          gate = gateRef.current
        }
        setRandomActive(gate)
      } else {
        if (phaseRef.current >= 1) {
          phaseRef.current -= 1
          gate = true
        } else {
          gate = phaseRef.current < 0.5
        }
      }

      // External clock overrides
      if (inputs.clkIn) {
        gate = readScalar(inputs.clkIn) > 50
      }

      gateRef.current = gate
      setClockPulse(gate)
      const pulseOut = scalar(gate ? 100 : 0)
      pulseRef.current = pulseOut

      // --- Noise ---
      const whiteVal = Math.random() * 100
      pinkAccRef.current = pinkAccRef.current * 0.9 + whiteVal * 0.1
      const pinkVal = pinkAccRef.current

      const whiteOut = scalar(whiteVal)
      const pinkOut = scalar(pinkVal)
      whiteRef.current = whiteOut
      pinkRef.current = pinkOut

      // --- Sample & Hold ---
      // Trigger: external trig input, or normalled from internal clock rising edge
      const trigSrc = inputs.trigIn ? readScalar(inputs.trigIn) > 50 : gate
      const trigRise = trigSrc && !prevGateRef.current
      prevGateRef.current = trigSrc

      // Signal input: external or normalled from white noise
      const shInput = inputs.shIn ? readScalar(inputs.shIn) : whiteVal

      if (trackModeRef.current) {
        // Track & hold: follow input while gate is high, hold when low
        if (trigSrc) holdValRef.current = shInput
      } else {
        // Sample & hold: capture on rising edge only
        if (trigRise) holdValRef.current = shInput
      }

      const holdOut = scalar(holdValRef.current)
      holdRef.current = holdOut

      // --- Slew ---
      // Input: external or normalled from hold output
      const slewInput = inputs.slewIn ? readScalar(inputs.slewIn) : holdValRef.current
      const slewRate = 0.01 + (1 - slewTimeRef.current / 100) * 0.99
      const slewAlpha = 1 - Math.exp(-slewRate * dt * 60)
      slewValRef.current += (slewInput - slewValRef.current) * slewAlpha

      const slewOut = scalar(slewValRef.current)
      slewRef.current = slewOut

      return { pink: pinkOut, white: whiteOut, pulse: pulseOut, hold: holdOut, slew: slewOut }
    },
  })

  return <NoisePanel
    rate={rate} slewTime={slewTime} randomMode={randomMode} trackMode={trackMode}
    enabled={enabled} onToggle={() => setEnabled(!enabled)}
    onRateChange={setRate} onSlewTimeChange={setSlewTime}
    onRandomModeChange={setRandomMode} onTrackModeChange={setTrackMode}
    id={id} clockPulse={clockPulse} randomActive={randomActive}
    clkInConn={clkInConn} clkInRef={clkInRef} trigInConn={trigInConn} trigInRef={trigInRef}
    shInConn={shInConn} shInRef={shInRef} slewInConn={slewInConn} slewInRef={slewInRef}
    pinkRef={pinkRef} whiteRef={whiteRef} pulseRef={pulseRef} holdRef={holdRef} slewRef={slewRef}
  />
}
