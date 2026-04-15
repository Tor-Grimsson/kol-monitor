// SequencerModule — 32-step sequencer with stepped faders, 3-state gates, pagination
// 16HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import IconSelect from '../controls/IconSelect'
import FlipToggle from '../controls/FlipToggle'
import LED from '../controls/LED'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const STEPS_PER_PAGE = 8
const TOTAL_PAGES = 4
const TOTAL_STEPS = STEPS_PER_PAGE * TOTAL_PAGES
const GATE_DURATION = 0.03
const NUM_STOPS = 10

function initSteps() {
  return Array.from({ length: TOTAL_STEPS }, () => Math.floor(Math.random() * NUM_STOPS))
}

function ledColor(gateVal, isActive) {
  if (isActive) return 'red'
  if (gateVal === 0) return 'green'
  if (gateVal === 1) return 'yellow'
  return 'red'
}

function StepGrid({ steps, gates, page, currentStep, onChange, onGateChange }) {
  const offset = page * STEPS_PER_PAGE
  const pageSteps = steps.slice(offset, offset + STEPS_PER_PAGE)

  const handleDrag = (idx, e) => {
    e.preventDefault()
    const globalIdx = offset + idx
    const startY = e.clientY
    const startVal = steps[globalIdx]

    const handleMove = (e) => {
      const delta = (startY - e.clientY) * 0.8
      const next = Math.round(Math.max(0, Math.min(NUM_STOPS - 1, startVal + delta / 10)))
      const newSteps = [...steps]
      newSteps[globalIdx] = next
      onChange(newSteps)
    }
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
      <div style={{ flex: 1, padding: '8px 0' }}>
        <div style={{ height: '100%', position: 'relative', padding: '0 4px' }}>
          {Array.from({ length: NUM_STOPS }).map((_, t) => (
            <div key={t} style={{
              position: 'absolute',
              bottom: `${((t + 1) / (NUM_STOPS + 1)) * 100}%`,
              left: 4, right: 4, height: 1,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }} />
          ))}
          <div style={{ position: 'relative', display: 'flex', height: '100%', justifyContent: 'space-evenly', zIndex: 1 }}>
            {pageSteps.map((val, i) => {
              const globalIdx = offset + i
              const norm = (val + 1) / (NUM_STOPS + 1)
              const isActive = globalIdx === currentStep
              return (
                <div key={i}
                  onPointerDown={(e) => handleDrag(i, e)}
                  style={{ width: 8, height: '100%', position: 'relative', cursor: 'ns-resize', touchAction: 'none' }}
                >
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                    backgroundColor: '#0a0a0a', borderRadius: 4,
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)', zIndex: 1,
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: `calc(${norm * 100}% - 8px)`,
                    left: -1, right: -1,
                    height: 16, borderRadius: 1,
                    backgroundColor: isActive ? '#e74c3c' : 'rgba(180,175,165,0.7)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)', zIndex: 2,
                  }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', padding: '0 4px' }}>
        {pageSteps.map((_, i) => {
          const globalIdx = offset + i
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <FlipToggle value={gates[globalIdx]} onChange={(v) => onGateChange(globalIdx, v)} positions={3} />
              <LED active={true} size="sm" color={ledColor(gates[globalIdx], globalIdx === currentStep)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SequencerPanel({ steps, gates, page, currentStep, length, enabled, onToggle, onStepsChange, onGateChange, onPageChange, onLengthChange, id, clockConnected, clockInRef, resetConnected, resetInRef, lenCvConnected, lenCvRef, gateOutRef, outRef }) {
  return (
    <Module label="Seq" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 2px', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <IconSelect value={page} onChange={onPageChange} columns={4} items={[
            { value: 0, icon: 'seq-a' },
            { value: 1, icon: 'seq-b' },
            { value: 2, icon: 'seq-c' },
            { value: 3, icon: 'seq-d' },
          ]} />
          <CvKnob port="lenCV" moduleId={id} active={lenCvConnected} signalRef={lenCvRef} value={length} onChange={onLengthChange} label={String(length)} variant="row-right" labelMinWidth={16} />
        </div>

        <Divider className="px-1 pt-2" />

        <StepGrid steps={steps} gates={gates} page={page} currentStep={currentStep} onChange={onStepsChange} onGateChange={onGateChange} />

        <Divider className="px-1 py-2" />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="clock" moduleId={id} active={clockConnected} signalRef={clockInRef} label="clk" />
          <LabeledJack type="in" port="reset" moduleId={id} active={resetConnected} signalRef={resetInRef} label="rst" />
          <LabeledJack type="out" port="gate" moduleId={id} signalRef={gateOutRef} label="gte" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function SequencerModule({ id = 'seq1', preview }) {
  if (preview) {
    return <SequencerPanel steps={new Array(TOTAL_STEPS).fill(5)} gates={new Array(TOTAL_STEPS).fill(0)} page={0} currentStep={0} length={8} enabled={false} onToggle={() => {}} onStepsChange={() => {}} onGateChange={() => {}} onPageChange={() => {}} onLengthChange={() => {}} id={id} clockConnected={false} clockInRef={{ current: null }} resetConnected={false} resetInRef={{ current: null }} lenCvConnected={false} lenCvRef={{ current: null }} gateOutRef={{ current: null }} outRef={{ current: null }} />
  }

  const [steps, setSteps] = useState(initSteps)
  const [gates, setGates] = useState(() => new Array(TOTAL_STEPS).fill(0)) // 0=on, 1=skip, 2=off
  const [currentStep, setCurrentStep] = useState(0)
  const [page, setPage] = useState(0)
  const [length, setLength] = useState(8)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const stepsRef = useRef(steps)
  const gatesRef = useRef(gates)
  const stepRef = useRef(0)
  const lengthRef = useRef(8)
  const lenCvRef = useRef(null)
  const prevClockRef = useRef(false)
  const prevResetRef = useRef(false)
  const gateTimerRef = useRef(0)
  const outRef = useRef(null)
  const gateOutRef = useRef(null)
  const clockInRef = useRef(null)
  const resetInRef = useRef(null)

  stepsRef.current = steps
  gatesRef.current = gates
  enabledRef.current = enabled
  lengthRef.current = length

  const clockConnected = cp.has('clock')
  const resetConnected = cp.has('reset')
  const lenCvConnected = cp.has('lenCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { steps, gates, page, length }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { clock: { type: 'scalar' }, reset: { type: 'scalar' }, lenCV: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' }, gate: { type: 'scalar' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; gateOutRef.current = null; return { out: null, gate: null } }
      clockInRef.current = inputs.clock
      resetInRef.current = inputs.reset
      lenCvRef.current = inputs.lenCV
      gateTimerRef.current = Math.max(0, gateTimerRef.current - dt)

      const len = inputs.lenCV
        ? Math.max(1, Math.min(32, Math.round(lengthRef.current + (readScalar(inputs.lenCV) - 50) / 100 * 31)))
        : lengthRef.current
      const clockHigh = readScalar(inputs.clock) > 50
      const resetHigh = readScalar(inputs.reset) > 50

      if (resetHigh && !prevResetRef.current) {
        stepRef.current = 0
        setCurrentStep(0)
      }
      if (clockHigh && !prevClockRef.current) {
        let next = (stepRef.current + 1) % len
        let safety = 0
        while (gatesRef.current[next] === 1 && safety < len) { next = (next + 1) % len; safety++ }
        stepRef.current = next
        setCurrentStep(next)
        if (gatesRef.current[next] === 0) gateTimerRef.current = GATE_DURATION
      }

      prevClockRef.current = clockHigh
      prevResetRef.current = resetHigh

      const stepGate = gatesRef.current[stepRef.current]
      const out = scalar(stepGate === 2 ? 0 : (stepsRef.current[stepRef.current] / (NUM_STOPS - 1)) * 100)
      const gate = scalar(gateTimerRef.current > 0 ? 100 : 0)
      outRef.current = out
      gateOutRef.current = gate
      return { out, gate }
    },
  })

  const handleGateChange = (idx, val) => {
    const newGates = [...gates]
    newGates[idx] = val
    setGates(newGates)
  }

  return <SequencerPanel steps={steps} gates={gates} page={page} currentStep={currentStep} length={length} enabled={enabled} onToggle={() => setEnabled(!enabled)} onStepsChange={setSteps} onGateChange={handleGateChange} onPageChange={setPage} onLengthChange={setLength} id={id} clockConnected={clockConnected} clockInRef={clockInRef} resetConnected={resetConnected} resetInRef={resetInRef} lenCvConnected={lenCvConnected} lenCvRef={lenCvRef} gateOutRef={gateOutRef} outRef={outRef} />
}
