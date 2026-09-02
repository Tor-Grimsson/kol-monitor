// ColorizerModule — Sandin-IP-style colorizer: grayscale scalar in, palette
// gradient color out. The luma-keyer half of the Sandin pair is deliberately
// NOT a module — Comparator + Switch already compose it (see 08-slit-echo-dev).
// 8HP 1U.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { color, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import Dropdown from '@kolkrabbi/kol-component/molecules/Dropdown'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

// Piecewise-linear gradient stops, t 0→1
const PALETTES = {
  heat: [[0, 0, 0], [0.9, 0.1, 0], [1, 0.8, 0], [1, 1, 1]],
  cool: [[0, 0, 0.2], [0, 0.4, 0.9], [0.2, 0.9, 1], [1, 1, 1]],
  neon: [[0.6, 0, 0.9], [1, 0, 0.5], [0, 1, 0.8], [1, 1, 0.2]],
  sunset: [[0.2, 0, 0.3], [0.9, 0.3, 0.1], [1, 0.7, 0.2], [1, 0.95, 0.7]],
  video: [[0, 0.15, 0], [0.1, 0.9, 0.2], [0.9, 1, 0.4], [1, 1, 1]],
  mono: [[0, 0, 0], [1, 1, 1]],
}
const PALETTE_NAMES = Object.keys(PALETTES)

function sampleGradient(stops, t) {
  const n = stops.length - 1
  const x = Math.min(0.9999, Math.max(0, t)) * n
  const i = Math.floor(x)
  const f = x - i
  const a = stops[i], b = stops[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

function ColorizerPanel({ palette, spread, ofs, enabled, onToggle, onPalette, onSpread, onOfs, id, inConn, inRef, outRef }) {
  return (
    <Module label="Colorize" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0', gap: 4,
      }}>
        <Dropdown size="xs" variant="grey" value={palette} options={PALETTE_NAMES.map((o) => ({ value: o, label: o }))} onChange={onPalette} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Knob value={spread} onChange={onSpread} label="sprd" />
          <Knob value={ofs} onChange={onOfs} label="ofs" />
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function ColorizerModule({ id = 'colorize1', init, preview }) {
  if (preview) return <ColorizerPanel palette="heat" spread={50} ofs={0} enabled={false} onToggle={() => {}} onPalette={() => {}} onSpread={() => {}} onOfs={() => {}} id={id} inConn={false} inRef={{ current: null }} outRef={{ current: null }} />

  const [palette, setPalette] = useState(init?.palette ?? 'heat')
  const [spread, setSpread] = useState(init?.spread ?? 50)
  const [ofs, setOfs] = useState(init?.ofs ?? 0)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const paletteRef = useRef('heat'); paletteRef.current = palette
  const spreadRef = useRef(50); spreadRef.current = spread
  const ofsRef = useRef(0); ofsRef.current = ofs
  const enabledRef = useRef(true); enabledRef.current = enabled
  const inRef = useRef(null)
  const outRef = useRef(null)

  const saveStateRef = useRef({})
  saveStateRef.current = { palette, spread, ofs }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { in: { type: 'scalar' } },
    outputs: { out: { type: 'color' } },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      // Map signed scalar [-100,100] → t [0,1]; spread gains around center, ofs shifts and wraps
      const v = inputs.in ? readScalar(inputs.in) : 0
      const base = (Math.max(-100, Math.min(100, v)) + 100) / 200
      let t = 0.5 + (base - 0.5) * (spreadRef.current / 50)
      t = t + ofsRef.current / 100
      t = t - Math.floor(t) // wrap for cycling
      const [r, g, b] = sampleGradient(PALETTES[paletteRef.current] || PALETTES.heat, t)
      const out = color(r, g, b)
      outRef.current = out
      return { out }
    },
  })

  return <ColorizerPanel palette={palette} spread={spread} ofs={ofs} enabled={enabled} onToggle={() => setEnabled(!enabled)} onPalette={setPalette} onSpread={setSpread} onOfs={setOfs} id={id} inConn={cp.has('in')} inRef={inRef} outRef={outRef} />
}
