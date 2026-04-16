// SwitchModule — dual CV-controlled A/B signal switch
// 8HP 1U. Two independent switches.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function SwitchPanel({ enabled, onToggle, id,
  a1Conn, a1Ref, b1Conn, b1Ref, cv1Conn, cv1Ref, out1Ref,
  a2Conn, a2Ref, b2Conn, b2Ref, cv2Conn, cv2Ref, out2Ref,
}) {
  const rowStyle = { display: 'flex', alignItems: 'stretch', gap: 8 }
  return (
    <Module label="Switch" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={rowStyle}>
            <LabeledJack type="in" port="a1" moduleId={id} active={a1Conn} signalRef={a1Ref} label="a" />
            <LabeledJack type="in" port="b1" moduleId={id} active={b1Conn} signalRef={b1Ref} label="b" />
            <LabeledJack type="in" port="cv1" moduleId={id} active={cv1Conn} signalRef={cv1Ref} label="cv" />
            <Divider variant="vertical" className="py-1.5" />
            <LabeledJack type="out" port="out1" moduleId={id} signalRef={out1Ref} label="out" />
          </div>
          <Divider />
          <div style={rowStyle}>
            <LabeledJack type="in" port="a2" moduleId={id} active={a2Conn} signalRef={a2Ref} label="a" />
            <LabeledJack type="in" port="b2" moduleId={id} active={b2Conn} signalRef={b2Ref} label="b" />
            <LabeledJack type="in" port="cv2" moduleId={id} active={cv2Conn} signalRef={cv2Ref} label="cv" />
            <Divider variant="vertical" className="py-1.5" />
            <LabeledJack type="out" port="out2" moduleId={id} signalRef={out2Ref} label="out" />
          </div>
        </div>
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }

export default function SwitchModule({ id = 'sw1', preview }) {
  if (preview) return <SwitchPanel enabled={false} onToggle={() => {}} id={id}
    a1Conn={false} a1Ref={NULL_REF} b1Conn={false} b1Ref={NULL_REF} cv1Conn={false} cv1Ref={NULL_REF} out1Ref={NULL_REF}
    a2Conn={false} a2Ref={NULL_REF} b2Conn={false} b2Ref={NULL_REF} cv2Conn={false} cv2Ref={NULL_REF} out2Ref={NULL_REF}
  />

  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)
  const enabledRef = useRef(true)
  enabledRef.current = enabled

  const a1Ref = useRef(null), b1Ref = useRef(null), cv1Ref = useRef(null), out1Ref = useRef(null)
  const a2Ref = useRef(null), b2Ref = useRef(null), cv2Ref = useRef(null), out2Ref = useRef(null)

  const a1Conn = cp.has('a1')
  const b1Conn = cp.has('b1')
  const cv1Conn = cp.has('cv1')
  const a2Conn = cp.has('a2')
  const b2Conn = cp.has('b2')
  const cv2Conn = cp.has('cv2')

  useModule({
    id,
    inputs: {
      a1: { type: 'any' }, b1: { type: 'any' }, cv1: { type: 'scalar', cv: 'offset' },
      a2: { type: 'any' }, b2: { type: 'any' }, cv2: { type: 'scalar', cv: 'offset' },
    },
    outputs: { out1: { type: 'any' }, out2: { type: 'any' } },
    process: (inputs) => {
      if (!enabledRef.current) {
        out1Ref.current = null; out2Ref.current = null
        return { out1: null, out2: null }
      }
      a1Ref.current = inputs.a1; b1Ref.current = inputs.b1; cv1Ref.current = inputs.cv1
      a2Ref.current = inputs.a2; b2Ref.current = inputs.b2; cv2Ref.current = inputs.cv2

      const o1 = readScalar(inputs.cv1) > 0 ? inputs.b1 : inputs.a1
      const o2 = readScalar(inputs.cv2) > 0 ? inputs.b2 : inputs.a2
      out1Ref.current = o1; out2Ref.current = o2
      return { out1: o1 || null, out2: o2 || null }
    },
  })

  return <SwitchPanel enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    a1Conn={a1Conn} a1Ref={a1Ref} b1Conn={b1Conn} b1Ref={b1Ref} cv1Conn={cv1Conn} cv1Ref={cv1Ref} out1Ref={out1Ref}
    a2Conn={a2Conn} a2Ref={a2Ref} b2Conn={b2Conn} b2Ref={b2Ref} cv2Conn={cv2Conn} cv2Ref={cv2Ref} out2Ref={out2Ref}
  />
}
