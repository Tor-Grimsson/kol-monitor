// VCAModule — dual voltage-controlled amplifier
// 8HP 1U. Two independent VCAs.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModuleBypass } from '../../hooks/useModuleBypass.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function VCAPanel({ enabled, onToggle, bypass, onBypass, id,
  in1Conn, in1Ref, cv1Conn, cv1Ref, out1Ref,
  in2Conn, in2Ref, cv2Conn, cv2Ref, out2Ref,
}) {
  const rowStyle = { display: 'flex', alignItems: 'stretch', gap: 8 }
  return (
    <Module label="VCA" enabled={enabled} onToggle={onToggle} u={1} bypass={bypass} onBypass={onBypass}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={rowStyle}>
            <LabeledJack type="in" port="in1" moduleId={id} active={in1Conn} signalRef={in1Ref} label="in" />
            <LabeledJack type="in" port="cv1" moduleId={id} active={cv1Conn} signalRef={cv1Ref} label="cv" />
            <Divider variant="vertical" className="py-1.5" />
            <LabeledJack type="out" port="out1" moduleId={id} signalRef={out1Ref} label="out" />
          </div>
          <Divider />
          <div style={rowStyle}>
            <LabeledJack type="in" port="in2" moduleId={id} active={in2Conn} signalRef={in2Ref} label="in" />
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

export default function VCAModule({ id = 'vca1', init, preview }) {
  if (preview) return <VCAPanel enabled={false} onToggle={() => {}} id={id}
    in1Conn={false} in1Ref={NULL_REF} cv1Conn={false} cv1Ref={NULL_REF} out1Ref={NULL_REF}
    in2Conn={false} in2Ref={NULL_REF} cv2Conn={false} cv2Ref={NULL_REF} out2Ref={NULL_REF}
  />

  const [enabled, setEnabled] = useModuleEnabled()
  const [bypass, setBypass] = useModuleBypass(init?.bypass ?? false)
  const enabledRef = useRef(true)
  const cp = useConnectedPorts(id)
  enabledRef.current = enabled

  const in1Ref = useRef(null), cv1Ref = useRef(null), out1Ref = useRef(null)
  const in2Ref = useRef(null), cv2Ref = useRef(null), out2Ref = useRef(null)

  const in1Conn = cp.has('in1')
  const cv1Conn = cp.has('cv1')
  const in2Conn = cp.has('in2')
  const cv2Conn = cp.has('cv2')

  const saveStateRef = useRef({})
  saveStateRef.current = { bypass }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in1: { type: 'scalar' }, cv1: { type: 'scalar', cv: 'offset' },
      in2: { type: 'scalar' }, cv2: { type: 'scalar', cv: 'offset' },
    },
    outputs: { out1: { type: 'scalar' }, out2: { type: 'scalar' } },
    bypass: [{ in: 'in1', out: 'out1' }, { in: 'in2', out: 'out2' }],
    process: (inputs) => {
      if (!enabledRef.current) {
        out1Ref.current = null; out2Ref.current = null
        return { out1: null, out2: null }
      }
      in1Ref.current = inputs.in1; cv1Ref.current = inputs.cv1
      in2Ref.current = inputs.in2; cv2Ref.current = inputs.cv2

      const o1 = scalar(readScalar(inputs.in1) * (readScalar(inputs.cv1) / 100))
      const o2 = scalar(readScalar(inputs.in2) * (readScalar(inputs.cv2) / 100))
      out1Ref.current = o1; out2Ref.current = o2
      return { out1: o1, out2: o2 }
    },
  })

  return <VCAPanel enabled={enabled} onToggle={() => setEnabled(!enabled)} bypass={bypass} onBypass={() => setBypass(!bypass)} id={id}
    in1Conn={in1Conn} in1Ref={in1Ref} cv1Conn={cv1Conn} cv1Ref={cv1Ref} out1Ref={out1Ref}
    in2Conn={in2Conn} in2Ref={in2Ref} cv2Conn={cv2Conn} cv2Ref={cv2Ref} out2Ref={out2Ref}
  />
}
