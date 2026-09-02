// SampleHoldModule — sample & hold with slew
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function SampleHoldPanel({ smooth, enabled, onToggle, onSmoothChange, id, inConnected, inRef, trigConnected, trigRef, outRef }) {
  return (
    <Module label="S&H" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <Knob value={smooth} onChange={onSmoothChange} label="slew" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
          <LabeledJack type="in" port="trig" moduleId={id} active={trigConnected} signalRef={trigRef} label="trig" />
          <div className="bg-fg-08" style={{ width: 1, height: 16 }} />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function SampleHoldModule({ id = 'sh1', init, preview }) {
  if (preview) return <SampleHoldPanel smooth={0} enabled={false} onToggle={() => {}} onSmoothChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} trigConnected={false} trigRef={{ current: null }} outRef={{ current: null }} />

  const [smooth, setSmooth] = useState(init?.smooth ?? 0)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const smoothRef = useRef(0)
  const enabledRef = useRef(true)
  const prevTrigRef = useRef(false)
  const heldRef = useRef(0)
  const currentRef = useRef(0)
  const outRef = useRef(null)
  const inRef = useRef(null)
  const trigRef = useRef(null)

  smoothRef.current = smooth
  enabledRef.current = enabled

  const inConnected = cp.has('in')
  const trigConnected = cp.has('trig')

  const saveStateRef = useRef({})
  saveStateRef.current = { smooth }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { in: { type: 'scalar' }, trig: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      trigRef.current = inputs.trig

      // Rising edge detection on trig
      const trigVal = readScalar(inputs.trig)
      const trigHigh = trigVal > 50
      if (trigHigh && !prevTrigRef.current) {
        heldRef.current = readScalar(inputs.in)
      }
      prevTrigRef.current = trigHigh

      // Slew toward held value
      const target = heldRef.current
      const sm = smoothRef.current
      if (sm === 0) {
        currentRef.current = target
      } else {
        const rate = dt * (10 - sm / 10)
        const diff = target - currentRef.current
        currentRef.current += diff * Math.min(1, rate)
      }

      const out = scalar(currentRef.current)
      outRef.current = out
      return { out }
    },
  })

  return <SampleHoldPanel smooth={smooth} enabled={enabled} onToggle={() => setEnabled(!enabled)} onSmoothChange={setSmooth} id={id} inConnected={inConnected} inRef={inRef} trigConnected={trigConnected} trigRef={trigRef} outRef={outRef} />
}
