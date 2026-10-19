// EnvelopeModule — ADSR envelope generator. The front is monitor's; the envelope math is the KOL's
// `createEnvelope()` (kol-hardware/signal), the same engine its EnvelopeGenerator and scopes draw.
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
import { createEnvelope } from '@kolkrabbi/kol-hardware/signal'

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
  const envRef = useRef(null)
  if (!envRef.current) envRef.current = createEnvelope()
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

      /* the KOL's envelope engine — monitor's stage machine, ported to kol-hardware/signal 2026-09-27 and
         consumed back (plan 14 8.5): one curve for the rack, the generator and every scope */
      const level = envRef.current.step(dt, { gate: readScalar(inputs.gate) > 0, trig: readScalar(inputs.trig) > 0 },
        { attack: aRef.current, decay: dRef.current, sustain: sRef.current, release: rRef.current, cycle: cycleRef.current })

      const out = scalar(level)
      outRef.current = out
      return { out }
    },
  })

  return <EnvelopePanel attack={attack} decay={decay} sustain={sustain} release={release} cycle={cycle} enabled={enabled} onToggle={() => setEnabled(!enabled)} onAttackChange={setAttack} onDecayChange={setDecay} onSustainChange={setSustain} onReleaseChange={setRelease} onCycleChange={setCycle} id={id} clkConnected={clkConnected} clkInRef={clkInRef} gateConnected={gateConnected} gateInRef={gateInRef} outRef={outRef} />
}
