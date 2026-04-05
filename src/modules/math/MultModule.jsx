// MultModule — dual 1:4 passive signal splitter
// 8HP 1U. Two rows: in→4 out. Second input normalled from first.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import Module from '../utility/Module'
import { ModuleControls } from '../utility/ModuleLayout'
import JackSocket from '../utility/JackSocket'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

function MultPanel({ enabled, onToggle, id, in1Connected, in2Connected, in1Ref, in2Ref, out1aRef, out1bRef, out1cRef, out1dRef, out2aRef, out2bRef, out2cRef, out2dRef }) {
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }

  return (
    <Module label="Mult" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '100%',
      }}>
        <ModuleControls>
          <JackSocket type="in" port="in1" moduleId={id} active={in1Connected} signalRef={in1Ref} />
          <div style={rowStyle}>
            <JackSocket type="out" port="1a" moduleId={id} signalRef={out1aRef} />
            <JackSocket type="out" port="1b" moduleId={id} signalRef={out1bRef} />
            <JackSocket type="out" port="1c" moduleId={id} signalRef={out1cRef} />
            <JackSocket type="out" port="1d" moduleId={id} signalRef={out1dRef} />
          </div>
          <JackSocket type="in" port="in2" moduleId={id} active={in2Connected} signalRef={in2Ref} />
          <div style={rowStyle}>
            <JackSocket type="out" port="2a" moduleId={id} signalRef={out2aRef} />
            <JackSocket type="out" port="2b" moduleId={id} signalRef={out2bRef} />
            <JackSocket type="out" port="2c" moduleId={id} signalRef={out2cRef} />
            <JackSocket type="out" port="2d" moduleId={id} signalRef={out2dRef} />
          </div>
        </ModuleControls>
      </div>
    </Module>
  )
}

export default function MultModule({ id = 'mult1', preview }) {
  if (preview) return <MultPanel enabled={false} onToggle={() => {}} id={id} in1Connected={false} in2Connected={false} in1Ref={{ current: null }} in2Ref={{ current: null }} out1aRef={{ current: null }} out1bRef={{ current: null }} out1cRef={{ current: null }} out1dRef={{ current: null }} out2aRef={{ current: null }} out2bRef={{ current: null }} out2cRef={{ current: null }} out2dRef={{ current: null }} />

  const [enabled, setEnabled] = useModuleEnabled()
  const enabledRef = useRef(true)
  const routing = usePatchRouting()
  enabledRef.current = enabled

  const in1Ref = useRef(null)
  const in2Ref = useRef(null)
  const out1aRef = useRef(null)
  const out1bRef = useRef(null)
  const out1cRef = useRef(null)
  const out1dRef = useRef(null)
  const out2aRef = useRef(null)
  const out2bRef = useRef(null)
  const out2cRef = useRef(null)
  const out2dRef = useRef(null)

  const conns = routing?.connections || []
  const in1Connected = conns.some(c => c.toModuleId === id && c.toPort === 'in1')
  const in2Connected = conns.some(c => c.toModuleId === id && c.toPort === 'in2')

  useModule({
    id,
    inputs: { in1: { type: 'scalar' }, in2: { type: 'scalar' } },
    outputs: {
      '1a': { type: 'scalar' }, '1b': { type: 'scalar' }, '1c': { type: 'scalar' }, '1d': { type: 'scalar' },
      '2a': { type: 'scalar' }, '2b': { type: 'scalar' }, '2c': { type: 'scalar' }, '2d': { type: 'scalar' },
    },
    process: (inputs) => {
      if (!enabledRef.current) {
        out1aRef.current = null; out1bRef.current = null; out1cRef.current = null; out1dRef.current = null
        out2aRef.current = null; out2bRef.current = null; out2cRef.current = null; out2dRef.current = null
        return { '1a': null, '1b': null, '1c': null, '1d': null, '2a': null, '2b': null, '2c': null, '2d': null }
      }

      const sig1 = inputs.in1 || null
      in1Ref.current = sig1
      out1aRef.current = sig1; out1bRef.current = sig1; out1cRef.current = sig1; out1dRef.current = sig1

      // Normalled: in2 falls back to in1 if unpatched
      const sig2 = inputs.in2 || (in2Connected ? null : sig1)
      in2Ref.current = sig2
      out2aRef.current = sig2; out2bRef.current = sig2; out2cRef.current = sig2; out2dRef.current = sig2

      return { '1a': sig1, '1b': sig1, '1c': sig1, '1d': sig1, '2a': sig2, '2b': sig2, '2c': sig2, '2d': sig2 }
    },
  })

  return <MultPanel enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id} in1Connected={in1Connected} in2Connected={in2Connected} in1Ref={in1Ref} in2Ref={in2Ref} out1aRef={out1aRef} out1bRef={out1bRef} out1cRef={out1cRef} out1dRef={out1dRef} out2aRef={out2aRef} out2bRef={out2bRef} out2cRef={out2cRef} out2dRef={out2dRef} />
}
