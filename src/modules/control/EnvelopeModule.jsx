// EnvelopeModule — ADSR envelope generator
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const STAGES = { IDLE: 0, ATTACK: 1, DECAY: 2, SUSTAIN: 3, RELEASE: 4 }

function EnvelopePanel({ attack, decay, sustain, release, cycle, enabled, onToggle, onAttackChange, onDecayChange, onSustainChange, onReleaseChange, onCycleChange, id, clkConnected, clkInRef, gateConnected, gateInRef, outRef }) {
  return (
    <Module label="Env" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Knob value={attack} onChange={onAttackChange} label="A" />
          <div style={{ position: 'absolute', left: '50%', marginLeft: -28, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Toggle value={cycle} onChange={onCycleChange} label="cyc" />
            <LabeledJack type="in" port="clk" moduleId={id} active={clkConnected} signalRef={clkInRef} label="clk" size="sm" />
          </div>
        </div>
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
  const clkConnected = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { attack, decay, sustain, release, cycle }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      gate: { type: 'scalar' },
      clk: { type: 'scalar' },
    },
    outputs: { out: { type: 'scalar' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      gateInRef.current = inputs.gate
      clkInRef.current = inputs.clk

      const gateOn = readScalar(inputs.gate) > 50
      const wasOn = prevGateRef.current
      prevGateRef.current = gateOn

      // Clock: retrigger on rising edge
      const clkHigh = readScalar(inputs.clk) > 50
      if (clkHigh && !prevClkRef.current) stageRef.current = STAGES.ATTACK
      prevClkRef.current = clkHigh

      // Cycle: start if idle
      if (cycleRef.current && stageRef.current === STAGES.IDLE) stageRef.current = STAGES.ATTACK

      // Gate transitions
      if (gateOn && !wasOn) stageRef.current = STAGES.ATTACK
      if (!gateOn && wasOn && stageRef.current !== STAGES.IDLE) stageRef.current = STAGES.RELEASE

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
        level -= (dt / dTime) * (100 - sLevel)
        if (level <= sLevel) { level = sLevel; stageRef.current = STAGES.SUSTAIN }
      } else if (stage === STAGES.SUSTAIN) {
        level = sLevel
        if (cycleRef.current && !gateOn) stageRef.current = STAGES.RELEASE
      } else if (stage === STAGES.RELEASE) {
        level -= (dt / rTime) * level
        if (level <= 0.5) { level = 0; stageRef.current = cycleRef.current ? STAGES.ATTACK : STAGES.IDLE }
      }

      levelRef.current = level
      const out = scalar(level)
      outRef.current = out
      return { out }
    },
  })

  return <EnvelopePanel attack={attack} decay={decay} sustain={sustain} release={release} cycle={cycle} enabled={enabled} onToggle={() => setEnabled(!enabled)} onAttackChange={setAttack} onDecayChange={setDecay} onSustainChange={setSustain} onReleaseChange={setRelease} onCycleChange={setCycle} id={id} clkConnected={clkConnected} clkInRef={clkInRef} gateConnected={gateConnected} gateInRef={gateInRef} outRef={outRef} />
}
