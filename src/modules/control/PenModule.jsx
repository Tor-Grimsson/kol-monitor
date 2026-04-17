// PenModule — visual style control for drawn signals
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { pen, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import IconSelect from '../parametric/IconSelect'
import Toggle from '../parametric/Toggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const CAPS = ['round', 'square', 'butt']

function PenPanel({ thickness, dash, gap, opacity, cap, lofi, fill, enabled, onToggle, onThicknessChange, onDashChange, onGapChange, onOpacityChange, onCapChange, onLofiChange, onFillChange, id, thkConn, thkInRef, dshConn, dshInRef, gapConn, gapInRef, opConn, opInRef, colorConn, colorInRef, outRef }) {
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '0 2px' }

  return (
    <Module label="Pen" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>

        <IconSelect value={cap} onChange={onCapChange} columns={3} items={[
          { value: 'round', icon: 'cap-round' }, { value: 'square', icon: 'cap-square' }, { value: 'butt', icon: 'cap-butt' },
        ]} />

        <div style={rowStyle}>
          <LabeledJack type="in" port="tk" moduleId={id} active={thkConn} signalRef={thkInRef} label="in" size="sm" />
          <Knob value={thickness} onChange={onThicknessChange} label="thk" />
        </div>
        <div style={rowStyle}>
          <LabeledJack type="in" port="ds" moduleId={id} active={dshConn} signalRef={dshInRef} label="in" size="sm" />
          <Knob value={dash} onChange={onDashChange} label="dsh" />
        </div>
        <div style={rowStyle}>
          <LabeledJack type="in" port="gp" moduleId={id} active={gapConn} signalRef={gapInRef} label="in" size="sm" />
          <Knob value={gap} onChange={onGapChange} label="gap" />
        </div>
        <div style={rowStyle}>
          <LabeledJack type="in" port="op" moduleId={id} active={opConn} signalRef={opInRef} label="in" size="sm" />
          <Knob value={opacity} onChange={onOpacityChange} label="op" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
          <Knob value={lofi} onChange={onLofiChange} label="lofi" />
          <Toggle value={fill} onChange={onFillChange} label="FILL" size="sm" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="clr" moduleId={id} active={colorConn} signalRef={colorInRef} label="color" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function PenModule({ id = 'pen1', init, preview }) {
  if (preview) return <PenPanel thickness={15} dash={0} gap={0} opacity={100} cap="round" lofi={0} fill={false} enabled={false} onToggle={() => {}} onThicknessChange={() => {}} onDashChange={() => {}} onGapChange={() => {}} onOpacityChange={() => {}} onCapChange={() => {}} onLofiChange={() => {}} onFillChange={() => {}} id={id} thkConn={false} thkInRef={{ current: null }} dshConn={false} dshInRef={{ current: null }} gapConn={false} gapInRef={{ current: null }} opConn={false} opInRef={{ current: null }} colorConn={false} colorInRef={{ current: null }} outRef={{ current: null }} />

  const [thickness, setThickness] = useState(init?.thickness ?? 15)  // 0-100 maps to 0.5-10
  const [dash, setDash] = useState(init?.dash ?? 0)
  const [gap, setGap] = useState(init?.gap ?? 0)
  const [opacity, setOpacity] = useState(init?.opacity ?? 100)
  const [cap, setCap] = useState(init?.cap ?? 'round')
  const [lofi, setLofi] = useState(init?.lofi ?? 0)
  const [fill, setFill] = useState(init?.fill ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const thkRef = useRef(15)
  const dshRef = useRef(0)
  const gapRef = useRef(0)
  const opRef = useRef(100)
  const capRef = useRef('round')
  const lofiRef = useRef(0)
  const fillRef = useRef(false)
  const outRef = useRef(null)
  const thkInRef = useRef(null)
  const dshInRef = useRef(null)
  const gapInRef = useRef(null)
  const opInRef = useRef(null)
  const colorInRef = useRef(null)

  enabledRef.current = enabled
  thkRef.current = thickness
  dshRef.current = dash
  gapRef.current = gap
  opRef.current = opacity
  capRef.current = cap
  lofiRef.current = lofi
  fillRef.current = fill

  const thkConn = cp.has('tk')
  const dshConn = cp.has('ds')
  const gapConn = cp.has('gp')
  const opConn = cp.has('op')
  const colorConn = cp.has('clr')

  const saveStateRef = useRef({})
  saveStateRef.current = { thickness, dash, gap, opacity, cap, lofi, fill }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      tk: { type: 'scalar', cv: 'offset' },
      ds: { type: 'scalar', cv: 'offset' },
      gp: { type: 'scalar', cv: 'offset' },
      op: { type: 'scalar', cv: 'offset' },
      clr: { type: 'color' },
    },
    outputs: { out: { type: 'pen' } },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      thkInRef.current = inputs.tk
      dshInRef.current = inputs.ds
      gapInRef.current = inputs.gp
      opInRef.current = inputs.op
      colorInRef.current = inputs.clr

      const t = readCv(inputs.tk, thkRef.current)
      const d = readCv(inputs.ds, dshRef.current)
      const g = readCv(inputs.gp, gapRef.current)
      const o = readCv(inputs.op, opRef.current)

      const out = pen({
        thickness: 0.5 + (t / 100) * 9.5,
        dash: (d / 100) * 20,
        gap: (g / 100) * 20,
        opacity: o,
        cap: capRef.current,
        lofi: lofiRef.current,
        color: inputs.clr?.type === 'color' ? inputs.clr.value : null,
        fill: fillRef.current,
      })
      outRef.current = out
      return { out }
    },
  })

  return <PenPanel thickness={thickness} dash={dash} gap={gap} opacity={opacity} cap={cap} lofi={lofi} fill={fill} enabled={enabled} onToggle={() => setEnabled(!enabled)} onThicknessChange={setThickness} onDashChange={setDash} onGapChange={setGap} onOpacityChange={setOpacity} onCapChange={setCap} onLofiChange={setLofi} onFillChange={setFill} id={id} thkConn={thkConn} thkInRef={thkInRef} dshConn={dshConn} dshInRef={dshInRef} gapConn={gapConn} gapInRef={gapInRef} opConn={opConn} opInRef={opInRef} colorConn={colorConn} colorInRef={colorInRef} outRef={outRef} />
}
