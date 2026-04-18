// EnvelopeModule — ADSR envelope generator
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import Toggle from '../parametric/Toggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const STAGES = { IDLE: 0, ATTACK: 1, DECAY: 2, SUSTAIN: 3, RELEASE: 4 }

function EnvelopePanel({ attack, decay, sustain, release, cycle, enabled, onToggle, onAttackChange, onDecayChange, onSustainChange, onReleaseChange, onCycleChange, id, clkConnected, clkInRef, gateConnected, gateInRef, outRef }) {
  return (
    <Module label="Env" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        {/* Top row: CYC toggle + TRIG jack — children top-aligned */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
          <Toggle value={cycle} onChange={onCycleChange} label="cyc" padding={0} />
          <LabeledJack type="in" port="trig" moduleId={id} active={clkConnected} signalRef={clkInRef} label="trig" size="sm" />
        </div>
        <Knob value={attack} onChange={onAttackChange} label="A" />
        <Knob value={decay} onChange={onDecayChange} label="D" />
        <Knob value={sustain} onChange={onSustainChange} label="S" />
        <Knob value={release} onChange={onReleaseChange} label="R" />
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="gate" moduleId={id} active={gateConnected} signalRef={gateInRef} label="gate" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function EnvelopeModule({ id = 'env1', init, preview }) {
  if (preview) return <EnvelopePanel attack={10} decay={30} sustain={70} release={50} cycle={false} enabled={false} onToggle={() => {}} onAttackChange={() => {}} onDecayChange={() => {}} onSustainChange={() => {}} onReleaseChange={() => {}} onCycleChange={() => {}} id={id} clkConnected={false} clkInRef={{ current: null }} gateConnected={false} gateInRef={{ current: null }} outRef={{ current: null }} />

  const [attack, setAttack] = useState(init?.attack ?? 10)    // 0-100 maps to 0-2s
  const [decay, setDecay] = useState(init?.decay ?? 30)
  const [sustain, setSustain] = useState(init?.sustain ?? 70)
  const [release, setRelease] = useState(init?.release ?? 50)
  const [cycle, setCycle] = useState(init?.cycle ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const aRef = useRef(10)
  const dRef = useRef(30)
  const sRef = useRef(70)
  const rRef = useRef(50)
  const enabledRef = useRef(true)
  const cycleRef = useRef(false)
  const stageRef = useRef(STAGES.IDLE)
  const levelRef = useRef(0)
  const prevGateRef = useRef(false)
  const prevClkRef = useRef(false)
  const releaseStartLevelRef = useRef(0)
  const oneShotRef = useRef(false)
  const outRef = useRef(null)
  const gateInRef = useRef(null)
  const clkInRef = useRef(null)

  aRef.current = attack
  dRef.current = decay
  sRef.current = sustain
  rRef.current = release
  enabledRef.current = enabled
  cycleRef.current = cycle

  const gateConnected = cp.has('gate')
  const clkConnected = cp.has('trig')

  const saveStateRef = useRef({})
  saveStateRef.current = { attack, decay, sustain, release, cycle }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      gate: { type: 'scalar' },
      trig: { type: 'scalar' },
    },
    outputs: { out: { type: 'scalar' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      gateInRef.current = inputs.gate
      clkInRef.current = inputs.trig

      const gateOn = readScalar(inputs.gate) > 0
      const wasOn = prevGateRef.current
      prevGateRef.current = gateOn

      // Trigger: one-shot, kick into ATTACK on rising edge and auto-run A→D→R
      const trigHigh = readScalar(inputs.trig) > 0
      if (trigHigh && !prevClkRef.current) {
        stageRef.current = STAGES.ATTACK
        oneShotRef.current = true
      }
      prevClkRef.current = trigHigh

      // Cycle: start if idle
      if (cycleRef.current && stageRef.current === STAGES.IDLE) stageRef.current = STAGES.ATTACK

      // Gate transitions — gate takes over (clears one-shot flag so sustain can hold)
      if (gateOn && !wasOn) { stageRef.current = STAGES.ATTACK; oneShotRef.current = false }
      if (!gateOn && wasOn && stageRef.current !== STAGES.IDLE) {
        releaseStartLevelRef.current = levelRef.current
        stageRef.current = STAGES.RELEASE
      }

      // Time mapping: knob 0-100 → 0.005-2s
      const aTime = 0.005 + (aRef.current / 100) * 1.995
      const dTime = 0.005 + (dRef.current / 100) * 1.995
      const sLevel = sRef.current
      const rTime = 0.005 + (rRef.current / 100) * 1.995

      const stage = stageRef.current
      let level = levelRef.current

      if (stage === STAGES.ATTACK) {
        level += (dt / aTime) * 100
        if (level >= 100) { level = 100; stageRef.current = STAGES.DECAY }
      } else if (stage === STAGES.DECAY) {
        // In one-shot mode with sustain=0, D and R combine into a single long decay.
        // This is what makes "release hold the decay for a long time" visible when
        // there's no sustain to release from.
        const oneShot = oneShotRef.current || (cycleRef.current && !gateOn)
        const decayTime = (oneShot && sLevel <= 0) ? (dTime + rTime) : dTime
        level -= (dt / decayTime) * (100 - sLevel)
        if (level <= sLevel) {
          level = sLevel
          if (oneShot) {
            // sustain=0 case already fell through via combined time → go idle.
            // sustain>0 case: R decays from sustain to 0 over rTime.
            if (sLevel > 0) {
              releaseStartLevelRef.current = level
              stageRef.current = STAGES.RELEASE
            } else {
              stageRef.current = cycleRef.current ? STAGES.ATTACK : STAGES.IDLE
              oneShotRef.current = false
            }
          } else {
            stageRef.current = STAGES.SUSTAIN
          }
        }
      } else if (stage === STAGES.SUSTAIN) {
        level = sLevel
        if (cycleRef.current && !gateOn) {
          releaseStartLevelRef.current = level
          stageRef.current = STAGES.RELEASE
        }
      } else if (stage === STAGES.RELEASE) {
        // Linear — rTime = seconds to zero from whatever level release started at
        const start = releaseStartLevelRef.current || 1
        level -= (dt / rTime) * start
        if (level <= 0) {
          level = 0
          stageRef.current = cycleRef.current ? STAGES.ATTACK : STAGES.IDLE
          oneShotRef.current = false
        }
      }

      levelRef.current = level
      const out = scalar(level)
      outRef.current = out
      return { out }
    },
  })

  return <EnvelopePanel attack={attack} decay={decay} sustain={sustain} release={release} cycle={cycle} enabled={enabled} onToggle={() => setEnabled(!enabled)} onAttackChange={setAttack} onDecayChange={setDecay} onSustainChange={setSustain} onReleaseChange={setRelease} onCycleChange={setCycle} id={id} clkConnected={clkConnected} clkInRef={clkInRef} gateConnected={gateConnected} gateInRef={gateInRef} outRef={outRef} />
}
