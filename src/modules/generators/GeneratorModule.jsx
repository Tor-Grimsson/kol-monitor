// GeneratorModule — procedural texture generator
// 12HP 3U. Gradient, pattern, wave, color algorithms.
// Outputs color + scalar signals.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, color, points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import IconButton from '../controls/IconButton'
import LabeledControl from '../controls/LabeledControl'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

// --- Algorithms ---

const MODES = ['gradient', 'pattern', 'wave', 'color']

const MODE_ITEMS = [
  { value: 'gradient', icon: 'gen-gradient', text: 'grad' },
  { value: 'pattern', icon: 'gen-pattern', text: 'ptrn' },
  { value: 'wave', icon: 'gen-wave', text: 'wave' },
  { value: 'color', icon: 'gen-color', text: 'clr' },
]

const SUB_ITEMS = {
  gradient: [
    { value: 'linear', icon: 'grad-lin', text: 'lin' },
    { value: 'radial', icon: 'grad-rad', text: 'rad' },
    { value: 'conic', icon: 'grad-con', text: 'con' },
  ],
  pattern: [
    { value: 'stripes', icon: 'ptrn-stripe', text: 'str' },
    { value: 'dots', icon: 'ptrn-dot', text: 'dot' },
    { value: 'checker', icon: 'ptrn-checker', text: 'chk' },
  ],
  wave: [
    { value: 'sin', icon: 'wave-sin', text: 'sin' },
    { value: 'saw', icon: 'wave-saw', text: 'saw' },
    { value: 'tri', icon: 'wave-tri', text: 'tri' },
    { value: 'sqr', icon: 'wave-sqr', text: 'sqr' },
  ],
  color: [],
}

const PARAM_DEFS = {
  gradient: [
    { key: 'p1', label: 'ang', min: 0, max: 100 },
    { key: 'p2', label: 'spd', min: 0, max: 100 },
  ],
  pattern: [
    { key: 'p1', label: 'spc', min: 0, max: 100 },
    { key: 'p2', label: 'ang', min: 0, max: 100 },
    { key: 'p3', label: 'dty', min: 0, max: 100 },
  ],
  wave: [
    { key: 'p1', label: 'frq', min: 0, max: 100 },
    { key: 'p2', label: 'spd', min: 0, max: 100 },
    { key: 'p3', label: 'ang', min: 0, max: 100 },
    { key: 'p4', label: 'pwm', min: 0, max: 100 },
  ],
  color: [
    { key: 'p1', label: 'h', min: 0, max: 100 },
    { key: 'p2', label: 's', min: 0, max: 100 },
    { key: 'p3', label: 'l', min: 0, max: 100 },
  ],
}

const GRID_SIZE = 16

// Compute brightness (0-1) at grid position (x, y are 0-1 normalized)
function sample(mode, subType, x, y, p1, p2, p3, p4, t) {
  switch (mode) {
    case 'gradient': {
      const angle = (p1 / 100) * Math.PI * 2
      const speed = p2 / 50
      const phase = t * speed
      switch (subType) {
        case 'linear': return Math.cos(angle) * x + Math.sin(angle) * y + phase * 0.1
        case 'radial': {
          const dx = x - 0.5, dy = y - 0.5
          return 1 - Math.sqrt(dx * dx + dy * dy) * 2 + Math.sin(phase) * 0.2
        }
        case 'conic': return ((Math.atan2(y - 0.5, x - 0.5) + Math.PI + phase) % (Math.PI * 2)) / (Math.PI * 2)
        default: return 0.5
      }
    }
    case 'pattern': {
      const spacing = 2 + (p1 / 100) * 14
      const angle = (p2 / 100) * Math.PI
      const duty = 0.1 + (p3 / 100) * 0.8
      const rx = Math.cos(angle) * x + Math.sin(angle) * y
      const ry = -Math.sin(angle) * x + Math.cos(angle) * y
      switch (subType) {
        case 'stripes': return Math.sin(rx * spacing + t * 0.5) > (duty - 0.5) * 2 ? 1 : 0
        case 'dots': return (Math.sin(rx * spacing + t * 0.3) * Math.sin(ry * spacing + t * 0.3)) > (duty - 0.5) ? 1 : 0
        case 'checker': return ((Math.floor(rx * spacing) + Math.floor(ry * spacing)) % 2 === 0) ? 1 : 0
        default: return 0.5
      }
    }
    case 'wave': {
      const freq = 1 + (p1 / 100) * 10
      const speed = p2 / 50
      const angle = (p3 / 100) * Math.PI
      const pwm = p4 / 100
      const rx = Math.cos(angle) * x + Math.sin(angle) * y
      const phase = rx * freq + t * speed
      switch (subType) {
        case 'sin': return (Math.sin(phase * Math.PI * 2) + 1) / 2
        case 'saw': return ((phase % 1) + 1) % 1
        case 'tri': return Math.abs(((phase % 1) * 2) - 1)
        case 'sqr': return ((phase % 1) > pwm) ? 1 : 0
        default: return 0.5
      }
    }
    case 'color': return 1 // color mode outputs uniform field
    default: return 0.5
  }
}

function hslToRgb(h, s, l) {
  if (s === 0) return { r: l, g: l, b: l }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return { r: hue2rgb(p, q, h + 1/3), g: hue2rgb(p, q, h), b: hue2rgb(p, q, h - 1/3) }
}

function generateGrid(mode, subType, p1, p2, p3, p4, t, lofi) {
  const pts = []
  const edges = []
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const nx = gx / (GRID_SIZE - 1)
      const ny = gy / (GRID_SIZE - 1)
      const val = Math.max(0, Math.min(1, sample(mode, subType, nx, ny, p1, p2, p3, p4, t)))
      if (!lofi && val < 0.01) continue
      const cx = 0.05 + nx * 0.9
      const cy = 0.05 + ny * 0.9
      const halfCell = (0.9 / GRID_SIZE) * 0.5
      const r = lofi ? (halfCell * 0.8) * (0.3 + val * 0.7) : halfCell
      // 4 corners of a small quad per grid cell
      const base = pts.length
      pts.push({ x: cx - r, y: cy - r })
      pts.push({ x: cx + r, y: cy - r })
      pts.push({ x: cx + r, y: cy + r })
      pts.push({ x: cx - r, y: cy + r })
      edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
    }
  }
  return { pts, edges }
}

// --- UI ---

function GeneratorPanel({
  mode, subType, p1, p2, p3, p4, lofi, enabled, onToggle, id,
  onModeChange, onSubTypeChange, onP1Change, onP2Change, onP3Change, onP4Change, onLofiChange,
  p1Conn, p1Ref, p2Conn, p2Ref, p3Conn, p3Ref, p4Conn, p4Ref,
  pointsOutRef, colorOutRef, scalarOutRef,
}) {
  const params = PARAM_DEFS[mode] || []
  const subs = SUB_ITEMS[mode] || []
  const changes = [onP1Change, onP2Change, onP3Change, onP4Change]
  const values = [p1, p2, p3, p4]
  const conns = [p1Conn, p2Conn, p3Conn, p4Conn]
  const refs = [p1Ref, p2Ref, p3Ref, p4Ref]

  return (
    <Module label="Generator" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 4, padding: '2px 4px' }}>

        {/* Mode selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {MODE_ITEMS.map(item => (
            <LabeledControl key={item.value} label={item.text}>
              <IconButton icon={item.icon} active={mode === item.value} onClick={() => onModeChange(item.value)} />
            </LabeledControl>
          ))}
        </div>

        <Divider className="px-1" />

        {/* Sub-type selector */}
        {subs.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {subs.map(item => (
              <LabeledControl key={item.value} label={item.text}>
                <IconButton icon={item.icon} active={subType === item.value} onClick={() => onSubTypeChange(item.value)} />
              </LabeledControl>
            ))}
          </div>
        )}

        <Divider className="px-1" />

        {/* Parameters — horizontal row, CV above knob */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {params.map((param, i) => (
            <CvKnob
              key={param.key}
              port={`p${i + 1}`}
              moduleId={id}
              active={conns[i]}
              signalRef={refs[i]}
              value={values[i]}
              onChange={changes[i]}
              label={param.label}
              direction="vertical"
            />
          ))}
        </div>

        <Divider className="px-1" />

        {/* Outputs */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <Toggle value={lofi} onChange={onLofiChange} label="lofi" size="sm" horizontal />
          <LabeledJack type="out" port="color" moduleId={id} signalRef={colorOutRef} label="clr" />
          <LabeledJack type="out" port="scalar" moduleId={id} signalRef={scalarOutRef} label="val" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={pointsOutRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

// --- Module ---

export default function GeneratorModule({ id = 'gen1', init, preview }) {
  if (preview) return <GeneratorPanel
    mode="gradient" subType="linear" p1={50} p2={50} p3={50} p4={50} lofi={true}
    enabled={false} onToggle={() => {}} id={id}
    onModeChange={() => {}} onSubTypeChange={() => {}} onP1Change={() => {}} onP2Change={() => {}} onP3Change={() => {}} onP4Change={() => {}} onLofiChange={() => {}}
    p1Conn={false} p1Ref={{ current: null }} p2Conn={false} p2Ref={{ current: null }}
    p3Conn={false} p3Ref={{ current: null }} p4Conn={false} p4Ref={{ current: null }}
    pointsOutRef={{ current: null }} colorOutRef={{ current: null }} scalarOutRef={{ current: null }}
  />

  const [mode, setMode] = useState(init?.mode ?? 'gradient')
  const [subType, setSubType] = useState(init?.subType ?? 'linear')
  const [p1, setP1] = useState(init?.p1 ?? 50)
  const [p2, setP2] = useState(init?.p2 ?? 50)
  const [p3, setP3] = useState(init?.p3 ?? 50)
  const [p4, setP4] = useState(init?.p4 ?? 50)
  const [lofi, setLofi] = useState(init?.lofi ?? true)
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  const modeRef = useRef('gradient')
  const subTypeRef = useRef('linear')
  const p1Ref = useRef(50)
  const p2Ref = useRef(50)
  const p3Ref = useRef(50)
  const p4Ref = useRef(50)
  const lofiRef = useRef(true)
  const p1CvRef = useRef(null)
  const p2CvRef = useRef(null)
  const p3CvRef = useRef(null)
  const p4CvRef = useRef(null)
  const colorOutRef = useRef(null)
  const scalarOutRef = useRef(null)
  const pointsOutRef = useRef(null)

  enabledRef.current = enabled
  modeRef.current = mode
  subTypeRef.current = subType
  p1Ref.current = p1
  p2Ref.current = p2
  p3Ref.current = p3
  p4Ref.current = p4
  lofiRef.current = lofi

  const conns = routing?.connections || []
  const p1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p1')
  const p2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p2')
  const p3Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p3')
  const p4Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p4')

  const handleModeChange = (m) => {
    setMode(m)
    const subs = SUB_ITEMS[m]
    if (subs && subs.length > 0) setSubType(subs[0].value)
  }

  useModule({
    id,
    inputs: { p1: { type: 'scalar' }, p2: { type: 'scalar' }, p3: { type: 'scalar' }, p4: { type: 'scalar' } },
    outputs: { out: { type: 'points' }, color: { type: 'color' }, scalar: { type: 'scalar' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { pointsOutRef.current = null; colorOutRef.current = null; scalarOutRef.current = null; return { out: null, color: null, scalar: null } }
      p1CvRef.current = inputs.p1
      p2CvRef.current = inputs.p2
      p3CvRef.current = inputs.p3
      p4CvRef.current = inputs.p4

      const v1 = inputs.p1 ? readScalar(inputs.p1) : p1Ref.current
      const v2 = inputs.p2 ? readScalar(inputs.p2) : p2Ref.current
      const v3 = inputs.p3 ? readScalar(inputs.p3) : p3Ref.current
      const v4 = inputs.p4 ? readScalar(inputs.p4) : p4Ref.current

      const grid = generateGrid(modeRef.current, subTypeRef.current, v1, v2, v3, v4, t, lofiRef.current)
      const pOut = points(grid.pts, grid.edges)
      pOut.aspectFill = true
      pOut.fill = !lofiRef.current
      pOut.strokeWidth = lofiRef.current ? undefined : 1
      pointsOutRef.current = pOut

      // Color output for color mode
      let cOut = null
      if (modeRef.current === 'color') {
        const rgb = hslToRgb(v1 / 100, v2 / 100, v3 / 100)
        cOut = color(rgb.r, rgb.g, rgb.b)
      }
      colorOutRef.current = cOut

      // Scalar = average brightness of center sample
      const centerVal = sample(modeRef.current, subTypeRef.current, 0.5, 0.5, v1, v2, v3, v4, t)
      const sOut = scalar(Math.max(0, Math.min(100, centerVal * 100)))
      scalarOutRef.current = sOut

      return { out: pOut, color: cOut, scalar: sOut }
    },
  })

  return <GeneratorPanel
    mode={mode} subType={subType} p1={p1} p2={p2} p3={p3} p4={p4} lofi={lofi}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onModeChange={handleModeChange} onSubTypeChange={setSubType}
    onP1Change={setP1} onP2Change={setP2} onP3Change={setP3} onP4Change={setP4} onLofiChange={setLofi}
    p1Conn={p1Conn} p1Ref={p1CvRef} p2Conn={p2Conn} p2Ref={p2CvRef}
    p3Conn={p3Conn} p3Ref={p3CvRef} p4Conn={p4Conn} p4Ref={p4CvRef}
    pointsOutRef={pointsOutRef} colorOutRef={colorOutRef} scalarOutRef={scalarOutRef}
  />
}
