// SMX3Module — 3x3 signal matrix mixer to RGB color
// 12HP

import { useState, useRef } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar, color } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import Knob from '../controls/Knob'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

function clamp01(n) { return n < 0 ? 0 : n > 100 ? 100 : n }

function SMX3Panel({ k11, k12, k13, k21, k22, k23, k31, k32, k33, enabled, onToggle, onK11, onK12, onK13, onK21, onK22, onK23, onK31, onK32, onK33, id, aConnected, aRef, bConnected, bRef, cConnected, cRef, rOutRef, gOutRef, bOutRef, colorOutRef }) {
  const knobStyle = { display: 'flex', justifyContent: 'center', gap: 2 }

  return (
    <Module label="SMX-3" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>

        {/* Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <JackSocket type="in" port="a" moduleId={id} active={aConnected} signalRef={aRef} label="a" />
          <JackSocket type="in" port="b" moduleId={id} active={bConnected} signalRef={bRef} label="b" />
          <JackSocket type="in" port="c" moduleId={id} active={cConnected} signalRef={cRef} label="c" />
        </div>

        {/* 3x3 knob matrix */}
        <div style={knobStyle}>
          <Knob value={k11} onChange={onK11} label="Ra" />
          <Knob value={k12} onChange={onK12} label="Rb" />
          <Knob value={k13} onChange={onK13} label="Rc" />
        </div>
        <div style={knobStyle}>
          <Knob value={k21} onChange={onK21} label="Ga" />
          <Knob value={k22} onChange={onK22} label="Gb" />
          <Knob value={k23} onChange={onK23} label="Gc" />
        </div>
        <div style={knobStyle}>
          <Knob value={k31} onChange={onK31} label="Ba" />
          <Knob value={k32} onChange={onK32} label="Bb" />
          <Knob value={k33} onChange={onK33} label="Bc" />
        </div>

        {/* Outputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <JackSocket type="out" port="r" moduleId={id} signalRef={rOutRef} label="r" />
          <JackSocket type="out" port="g" moduleId={id} signalRef={gOutRef} label="g" />
          <JackSocket type="out" port="b" moduleId={id} signalRef={bOutRef} label="b" />
          <div style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <JackSocket type="out" port="out" moduleId={id} signalRef={colorOutRef} label="clr" />
        </div>
      </div>
    </Module>
  )
}

export default function SMX3Module({ id = 'smx1', preview }) {
  if (preview) return <SMX3Panel k11={50} k12={50} k13={50} k21={50} k22={50} k23={50} k31={50} k32={50} k33={50} enabled={false} onToggle={() => {}} onK11={() => {}} onK12={() => {}} onK13={() => {}} onK21={() => {}} onK22={() => {}} onK23={() => {}} onK31={() => {}} onK32={() => {}} onK33={() => {}} id={id} aConnected={false} aRef={{ current: null }} bConnected={false} bRef={{ current: null }} cConnected={false} cRef={{ current: null }} rOutRef={{ current: null }} gOutRef={{ current: null }} bOutRef={{ current: null }} colorOutRef={{ current: null }} />

  const [k11, setK11] = useState(50)
  const [k12, setK12] = useState(50)
  const [k13, setK13] = useState(50)
  const [k21, setK21] = useState(50)
  const [k22, setK22] = useState(50)
  const [k23, setK23] = useState(50)
  const [k31, setK31] = useState(50)
  const [k32, setK32] = useState(50)
  const [k33, setK33] = useState(50)
  const [enabled, setEnabled] = useState(true)
  const routing = usePatchRouting()

  const k11Ref = useRef(50); const k12Ref = useRef(50); const k13Ref = useRef(50)
  const k21Ref = useRef(50); const k22Ref = useRef(50); const k23Ref = useRef(50)
  const k31Ref = useRef(50); const k32Ref = useRef(50); const k33Ref = useRef(50)
  const enabledRef = useRef(true)
  const rOutRef = useRef(null)
  const gOutRef = useRef(null)
  const bOutRef = useRef(null)
  const colorOutRef = useRef(null)
  const aRef = useRef(null)
  const bRef = useRef(null)
  const cRef = useRef(null)

  k11Ref.current = k11; k12Ref.current = k12; k13Ref.current = k13
  k21Ref.current = k21; k22Ref.current = k22; k23Ref.current = k23
  k31Ref.current = k31; k32Ref.current = k32; k33Ref.current = k33
  enabledRef.current = enabled

  const conns = routing?.connections || []
  const aConnected = conns.some(c => c.toModuleId === id && c.toPort === 'a')
  const bConnected = conns.some(c => c.toModuleId === id && c.toPort === 'b')
  const cConnected = conns.some(c => c.toModuleId === id && c.toPort === 'c')

  useModule({
    id,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' }, c: { type: 'scalar' } },
    outputs: {
      r: { type: 'scalar' }, g: { type: 'scalar' }, b: { type: 'scalar' },
      out: { type: 'color' },
    },
    process: (inputs) => {
      if (!enabledRef.current) {
        rOutRef.current = null; gOutRef.current = null
        bOutRef.current = null; colorOutRef.current = null
        return { r: null, g: null, b: null, out: null }
      }
      aRef.current = inputs.a
      bRef.current = inputs.b
      cRef.current = inputs.c

      const aVal = readScalar(inputs.a)
      const bVal = readScalar(inputs.b)
      const cVal = readScalar(inputs.c)

      // Bipolar matrix: knob 50 = 0, 0 = -1, 100 = +1
      const rVal = clamp01(
        aVal * (k11Ref.current - 50) / 50 +
        bVal * (k12Ref.current - 50) / 50 +
        cVal * (k13Ref.current - 50) / 50
      )
      const gVal = clamp01(
        aVal * (k21Ref.current - 50) / 50 +
        bVal * (k22Ref.current - 50) / 50 +
        cVal * (k23Ref.current - 50) / 50
      )
      const bVal2 = clamp01(
        aVal * (k31Ref.current - 50) / 50 +
        bVal * (k32Ref.current - 50) / 50 +
        cVal * (k33Ref.current - 50) / 50
      )

      const rOut = scalar(rVal)
      const gOut = scalar(gVal)
      const bOut = scalar(bVal2)
      const colorOut = color(rVal / 100, gVal / 100, bVal2 / 100)

      rOutRef.current = rOut
      gOutRef.current = gOut
      bOutRef.current = bOut
      colorOutRef.current = colorOut
      return { r: rOut, g: gOut, b: bOut, out: colorOut }
    },
  })

  return <SMX3Panel k11={k11} k12={k12} k13={k13} k21={k21} k22={k22} k23={k23} k31={k31} k32={k32} k33={k33} enabled={enabled} onToggle={() => setEnabled(!enabled)} onK11={setK11} onK12={setK12} onK13={setK13} onK21={setK21} onK22={setK22} onK23={setK23} onK31={setK31} onK32={setK32} onK33={setK33} id={id} aConnected={aConnected} aRef={aRef} bConnected={bConnected} bRef={bRef} cConnected={cConnected} cRef={cRef} rOutRef={rOutRef} gOutRef={gOutRef} bOutRef={bOutRef} colorOutRef={colorOutRef} />
}
