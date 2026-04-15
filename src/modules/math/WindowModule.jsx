// WindowModule — clip input to a window, re-zero, offset
// 1U. out = (clamp(input, lo, hi) - lo) + ofs

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function WindowPanel({ lo, hi, ofs, enabled, onToggle, onLoChange, onHiChange, onOfsChange, id, inConnected, inRef, outputRef }) {
  return (
    <Module label="Window" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        height: '100%', padding: '10px 8px 0 8px', gap: 6,
      }}>
        {/* Knobs in a flex row */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Knob value={lo} onChange={onLoChange} label="lo" bipolar />
          <Knob value={hi} onChange={onHiChange} label="hi" bipolar />
          <Knob value={ofs} onChange={onOfsChange} label="ofs" bipolar />
        </div>

        {/* Jacks in a flex row below */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outputRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function WindowModule({ id = 'win1', init, preview }) {
  if (preview) return <WindowPanel lo={-100} hi={100} ofs={0} enabled={false} onToggle={() => {}} onLoChange={() => {}} onHiChange={() => {}} onOfsChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} outputRef={{ current: null }} />

  const [lo, setLo] = useState(init?.lo ?? -100)
  const [hi, setHi] = useState(init?.hi ?? 100)
  const [ofs, setOfs] = useState(init?.ofs ?? 0)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const loRef = useRef(-100)
  const hiRef = useRef(100)
  const ofsRef = useRef(0)
  const enabledRef = useRef(true)
  const outputRef = useRef(null)
  const inRef = useRef(null)

  loRef.current = lo
  hiRef.current = hi
  ofsRef.current = ofs
  enabledRef.current = enabled

  const inConnected = cp.has('in')

  const saveStateRef = useRef({})
  saveStateRef.current = { lo, hi, ofs }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { in: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs) => {
      if (!enabledRef.current) { outputRef.current = null; return { out: null } }
      inRef.current = inputs.in

      const val = readScalar(inputs.in)
      const l = loRef.current
      const h = hiRef.current
      // Normalize bounds so lo ≤ hi (allow inverted for UX forgiveness)
      const low = Math.min(l, h)
      const high = Math.max(l, h)
      const clipped = val < low ? low : val > high ? high : val
      const out = scalar((clipped - low) + ofsRef.current)
      outputRef.current = out
      return { out }
    },
  })

  return <WindowPanel lo={lo} hi={hi} ofs={ofs} enabled={enabled} onToggle={() => setEnabled(!enabled)} onLoChange={setLo} onHiChange={setHi} onOfsChange={setOfs} id={id} inConnected={inConnected} inRef={inRef} outputRef={outputRef} />
}
