// ExpressionModule — dual expression generator
// 1U, 20HP. Two independent expressions share CV inputs a, b and a common clock.
// Each expression compiles to a function of (t, f, min=-100, max=100, { a, b }).

import { useState, useRef, useEffect } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import { compile } from '../../hooks/useExpressionValue'
import { newClockSyncState, measureClockRate } from '../../hooks/clockSync'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import TextInput from '../parametric/TextInput'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const BUS_KEYS = ['a', 'b']

function ExprPanel({ expr1, expr2, onExpr1Change, onExpr2Change, enabled, onToggle, id, aConn, aRef, bConn, bRef, clkConn, clkRef, clkInConn, clkInRef, out1Ref, out2Ref }) {
  return (
    <Module label="Expr" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', gap: 6, padding: '0 6px' }}>

        {/* Row 1: A | expr1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="a" moduleId={id} active={aConn} signalRef={aRef} label="a" labelPosition="left" />
          <TextInput value={expr1} onCommit={onExpr1Change} placeholder="wave(t)" style={{ flex: 1 }} />
        </div>

        <Divider />

        {/* Row 2: B | expr2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="b" moduleId={id} active={bConn} signalRef={bRef} label="b" labelPosition="left" />
          <TextInput value={expr2} onCommit={onExpr2Change} placeholder="sin(t*PI)*100" style={{ flex: 1 }} />
        </div>

        {/* Row 3: Clk / rst + outputs on the right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={clkInConn} signalRef={clkInRef} label="clk" labelPosition="left" />
          <LabeledJack type="in" port="rst" moduleId={id} active={clkConn} signalRef={clkRef} label="rst" labelPosition="left" />
          <LabeledJack type="out" port="out1" moduleId={id} signalRef={out1Ref} label="1" labelPosition="left" />
          <LabeledJack type="out" port="out2" moduleId={id} signalRef={out2Ref} label="2" labelPosition="left" />
        </div>

      </div>
    </Module>
  )
}

export default function ExpressionModule({ id = 'expr1', init, preview }) {
  if (preview) return <ExprPanel expr1="wave(t)" expr2="" onExpr1Change={() => {}} onExpr2Change={() => {}} enabled={false} onToggle={() => {}} id={id} aConn={false} aRef={{ current: null }} bConn={false} bRef={{ current: null }} clkConn={false} clkRef={{ current: null }} clkInConn={false} clkInRef={{ current: null }} out1Ref={{ current: null }} out2Ref={{ current: null }} />

  const [expr1, setExpr1] = useState(init?.expr1 ?? '')
  const [expr2, setExpr2] = useState(init?.expr2 ?? '')
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const fn1Ref = useRef(null)
  const fn2Ref = useRef(null)
  useEffect(() => { fn1Ref.current = compile(expr1, BUS_KEYS) }, [expr1])
  useEffect(() => { fn2Ref.current = compile(expr2, BUS_KEYS) }, [expr2])

  const enabledRef = useRef(true)
  const out1Ref = useRef(null)
  const out2Ref = useRef(null)
  const aRef = useRef(null)
  const bRef = useRef(null)
  const clkRef = useRef(null)  // rst jack signal ref
  const clkInRef = useRef(null)  // clk jack signal ref
  const tAccumRef = useRef(0)
  const frameRef = useRef(0)
  const prevClkRef = useRef(false)
  const syncRef = useRef(newClockSyncState())

  enabledRef.current = enabled

  const aConn = cp.has('a')
  const bConn = cp.has('b')
  const clkConn = cp.has('rst')
  const clkInConn = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { expr1, expr2 }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' }, rst: { type: 'scalar' }, clk: { type: 'scalar' } },
    outputs: { out1: { type: 'scalar' }, out2: { type: 'scalar' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { out1Ref.current = null; out2Ref.current = null; return { out1: null, out2: null } }

      aRef.current = inputs.a
      bRef.current = inputs.b
      clkRef.current = inputs.rst
      clkInRef.current = inputs.clk

      // Rst rising edge: zero accumulated t and frame count
      const rstHigh = readScalar(inputs.rst) > 0
      if (rstHigh && !prevClkRef.current) {
        tAccumRef.current = 0
        frameRef.current = 0
      }
      prevClkRef.current = rstHigh

      // t advances at 1 unit/sec free-running; when clk patched + ticking,
      // advances at 1 unit per clock period (tempo-locked expression time).
      const baseRate = measureClockRate(syncRef.current, inputs.clk, t, 1)
      tAccumRef.current += dt * baseRate
      const relT = tAccumRef.current
      const frame = frameRef.current++
      const bus = { a: readScalar(inputs.a), b: readScalar(inputs.b) }

      let o1 = null, o2 = null
      if (fn1Ref.current) {
        try { o1 = scalar(fn1Ref.current(relT, frame, -100, 100, bus)) } catch { /* silent */ }
      }
      if (fn2Ref.current) {
        try { o2 = scalar(fn2Ref.current(relT, frame, -100, 100, bus)) } catch { /* silent */ }
      }

      out1Ref.current = o1
      out2Ref.current = o2
      return { out1: o1, out2: o2 }
    },
  })

  return <ExprPanel expr1={expr1} expr2={expr2} onExpr1Change={setExpr1} onExpr2Change={setExpr2} enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id} aConn={aConn} aRef={aRef} bConn={bConn} bRef={bRef} clkConn={clkConn} clkRef={clkRef} clkInConn={clkInConn} clkInRef={clkInRef} out1Ref={out1Ref} out2Ref={out2Ref} />
}
