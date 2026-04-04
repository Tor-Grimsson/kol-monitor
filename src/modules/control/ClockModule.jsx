// ClockModule — master tempo with multiple division outputs
// 4HP. Run/stop toggle, BPM knob, 6 division outputs (1, 1/2, 1/3, 1/4, 1/5, 1/6)

import { useState, useRef } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import FlipToggle from '../controls/FlipToggle'
import LED from '../controls/LED'

const GATE_DURATION = 0.03
const DIVS = [1, 2, 3, 4, 5, 6, 7, 8]

function ClockPanel({ bpm, running, clockPulse, enabled, onToggle, onBpmChange, onRunningChange, id, outRefs }) {
  return (
    <Module label="Clock" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <div style={{ position: 'relative' }}>
          <FlipToggle value={running} onChange={onRunningChange} labelA="run" labelB="stop" />
          <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)' }}>
            <LED active={clockPulse} color="yellow" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Knob value={bpm} onChange={onBpmChange} min={20} max={300} label="BPM" />
          <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>{bpm}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
          {DIVS.map(d => (
            <LabeledJack key={d} type="out" port={`d${d}`} moduleId={id} signalRef={outRefs[d]} label={d === 1 ? '1' : `1/${d}`} />
          ))}
        </div>
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }
const NULL_REFS = Object.fromEntries(DIVS.map(d => [d, NULL_REF]))

export default function ClockModule({ id = 'clk1', init, preview }) {
  if (preview) return <ClockPanel bpm={120} running={true} clockPulse={false} enabled={false} onToggle={() => {}} onBpmChange={() => {}} onRunningChange={() => {}} id={id} outRefs={NULL_REFS} />

  const [bpm, setBpm] = useState(init?.bpm ?? 120)
  const [running, setRunning] = useState(true)
  const [clockPulse, setClockPulse] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const enabledRef = useRef(true)
  const runningRef = useRef(true)
  const bpmRef = useRef(120)
  const phaseRef = useRef(0)
  const beatCountRef = useRef(0)
  const gateTimerRef = useRef(0)
  const divTimers = useRef(Object.fromEntries(DIVS.map(d => [d, 0])))
  const divCounts = useRef(Object.fromEntries(DIVS.map(d => [d, 0])))
  const outRefs = Object.fromEntries(DIVS.map(d => [d, useRef(null)]))

  bpmRef.current = bpm
  enabledRef.current = enabled
  runningRef.current = running

  const outputs = Object.fromEntries(DIVS.map(d => [`d${d}`, { type: 'scalar' }]))

  useModule({
    id,
    inputs: {},
    outputs,
    process: (inputs, dt) => {
      const result = Object.fromEntries(DIVS.map(d => [`d${d}`, null]))

      if (!enabledRef.current || !runningRef.current) {
        DIVS.forEach(d => { outRefs[d].current = null })
        setClockPulse(false)
        return result
      }

      phaseRef.current += dt * (bpmRef.current / 60)
      gateTimerRef.current = Math.max(0, gateTimerRef.current - dt)
      DIVS.forEach(d => { divTimers.current[d] = Math.max(0, divTimers.current[d] - dt) })

      if (phaseRef.current >= 1) {
        phaseRef.current -= 1
        beatCountRef.current++
        gateTimerRef.current = GATE_DURATION

        DIVS.forEach(d => {
          divCounts.current[d]++
          if (divCounts.current[d] >= d) {
            divCounts.current[d] = 0
            divTimers.current[d] = GATE_DURATION
          }
        })
      }

      setClockPulse(gateTimerRef.current > 0)

      DIVS.forEach(d => {
        const out = scalar(divTimers.current[d] > 0 ? 100 : 0)
        outRefs[d].current = out
        result[`d${d}`] = out
      })

      return result
    },
  })

  return <ClockPanel bpm={bpm} running={running} clockPulse={clockPulse} enabled={enabled} onToggle={() => setEnabled(!enabled)} onBpmChange={setBpm} onRunningChange={setRunning} id={id} outRefs={outRefs} />
}
