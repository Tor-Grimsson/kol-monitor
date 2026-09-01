// ClockDividerModule — rotating clock divider
// 4HP. Clock input, 6 division outputs (1, 1/2, 1/3, 1/4, 1/5, 1/6), rotate + reset inputs.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../parametric/LabeledJack'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const GATE_DURATION = 0.03
const DIVS = [1, 2, 3, 4, 5, 6, 7, 8]
// Port-key strings hoisted (G9, fable-audit-2) — a clock is in every patch and
// was building 8 template strings + pair arrays per frame. The result OBJECT
// stays fresh each frame: the render loop double-buffers by reference, so a
// reused object would let cycle-delayed reads see current-frame values.
const PORTS = Object.fromEntries(DIVS.map(d => [d, `d${d}`]))

function ClockDividerPanel({ enabled, onToggle, id, inConn, inRef, rotConn, rotRef, rstConn, rstRef, outRefs }) {
  return (
    <Module label="Div" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
          {DIVS.map(d => (
            <LabeledJack key={d} type="out" port={`d${d}`} moduleId={id} signalRef={outRefs[d]} label={d === 1 ? '1' : `1/${d}`} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="rot" moduleId={id} active={rotConn} signalRef={rotRef} label="rot" />
          <LabeledJack type="in" port="rst" moduleId={id} active={rstConn} signalRef={rstRef} label="rst" />
        </div>
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }
const NULL_REFS = Object.fromEntries(DIVS.map(d => [d, NULL_REF]))

export default function ClockDividerModule({ id = 'cdiv1', preview }) {
  if (preview) return <ClockDividerPanel enabled={false} onToggle={() => {}} id={id} inConn={false} inRef={NULL_REF} rotConn={false} rotRef={NULL_REF} rstConn={false} rstRef={NULL_REF} outRefs={NULL_REFS} />

  const [enabled, setEnabled] = useModuleEnabled()
  const enabledRef = useRef(true)
  const cp = useConnectedPorts(id)

  const prevClkRef = useRef(false)
  const prevRotRef = useRef(false)
  const prevRstRef = useRef(false)
  const rotationRef = useRef(0)
  const divCounts = useRef(Object.fromEntries(DIVS.map(d => [d, 0])))
  const divTimers = useRef(Object.fromEntries(DIVS.map(d => [d, 0])))
  const inRef = useRef(null)
  const rotRef = useRef(null)
  const rstRef = useRef(null)
  const outRefs = Object.fromEntries(DIVS.map(d => [d, useRef(null)]))

  enabledRef.current = enabled

  const inConn = cp.has('in')
  const rotConn = cp.has('rot')
  const rstConn = cp.has('rst')

  const outputs = Object.fromEntries(DIVS.map(d => [`d${d}`, { type: 'scalar' }]))

  useModule({
    id,
    inputs: { in: { type: 'scalar' }, rot: { type: 'scalar', cv: 'offset' }, rst: { type: 'scalar' } },
    outputs,
    process: (inputs, dt) => {
      const result = {}
      DIVS.forEach(d => { result[PORTS[d]] = null })

      if (!enabledRef.current) {
        DIVS.forEach(d => { outRefs[d].current = null })
        return result
      }

      inRef.current = inputs.in
      rotRef.current = inputs.rot
      rstRef.current = inputs.rst

      // Rotate: shift division assignment on rising edge
      const rotHigh = readScalar(inputs.rot) > 0
      if (rotHigh && !prevRotRef.current) {
        rotationRef.current = (rotationRef.current + 1) % DIVS.length
      }
      prevRotRef.current = rotHigh

      // Reset: return to default assignment on rising edge
      const rstHigh = readScalar(inputs.rst) > 0
      if (rstHigh && !prevRstRef.current) {
        rotationRef.current = 0
        DIVS.forEach(d => { divCounts.current[d] = 0 })
      }
      prevRstRef.current = rstHigh

      // Decay gate timers
      DIVS.forEach(d => { divTimers.current[d] = Math.max(0, divTimers.current[d] - dt) })

      // Clock rising edge
      const clkHigh = readScalar(inputs.in) > 0
      if (clkHigh && !prevClkRef.current) {
        DIVS.forEach(d => {
          divCounts.current[d]++
          if (divCounts.current[d] >= d) {
            divCounts.current[d] = 0
            divTimers.current[d] = GATE_DURATION
          }
        })
      }
      prevClkRef.current = clkHigh

      // Output with rotation applied
      const rot = rotationRef.current
      DIVS.forEach((d, i) => {
        const rotatedDiv = DIVS[(i + rot) % DIVS.length]
        const out = scalar(divTimers.current[rotatedDiv] > 0 ? 100 : 0)
        outRefs[d].current = out
        result[PORTS[d]] = out
      })

      return result
    },
  })

  return <ClockDividerPanel enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id} inConn={inConn} inRef={inRef} rotConn={rotConn} rotRef={rotRef} rstConn={rstConn} rstRef={rstRef} outRefs={outRefs} />
}
