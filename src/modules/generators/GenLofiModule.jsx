// GeneratorModule — procedural texture generator
// 12HP 3U. Gradient, pattern, wave, color algorithms.
// Lofi grid-sampled output only.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import IconButton from '../controls/IconButton'
import LabeledControl from '../controls/LabeledControl'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

// --- Algorithms ---

const MODE_ITEMS = [
  { value: 'gradient', icon: 'gen-gradient', text: 'grad' },
  { value: 'pattern', icon: 'gen-pattern', text: 'ptrn' },
  { value: 'wave', icon: 'gen-wave', text: 'wave' },
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
    default: return 0.5
  }
}

function generateGrid(mode, subType, p1, p2, p3, p4, t) {
  const pts = []
  const edges = []
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const nx = gx / (GRID_SIZE - 1)
      const ny = gy / (GRID_SIZE - 1)
      const val = Math.max(0, Math.min(1, sample(mode, subType, nx, ny, p1, p2, p3, p4, t)))
      if (val < 0.01) continue
      const cx = 0.05 + nx * 0.9
      const cy = 0.05 + ny * 0.9
      const halfCell = (0.9 / GRID_SIZE) * 0.5
      const r = (halfCell * 0.8) * (0.3 + val * 0.7)
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
  tab, gradSub, patternSub, waveSub, p1, p2, p3, p4, animate, speed, enabled, onToggle, id,
  onTabChange, onGradSubChange, onPatternSubChange, onWaveSubChange,
  onP1Change, onP2Change, onP3Change, onP4Change,
  onAnimateChange, onSpeedChange,
  p1Conn, p1Ref, p2Conn, p2Ref, p3Conn, p3Ref, p4Conn, p4Ref,
  spdConn, spdCvRef, clkConn, clkCvRef,
  gradOutRef, patternOutRef, waveOutRef,
}) {
  const subs = SUB_ITEMS[tab] || []
  const activeSub = tab === 'gradient' ? gradSub : tab === 'pattern' ? patternSub : waveSub
  const onSubChange = tab === 'gradient' ? onGradSubChange : tab === 'pattern' ? onPatternSubChange : onWaveSubChange
  const params = PARAM_DEFS[tab] || []
  const changes = [onP1Change, onP2Change, onP3Change, onP4Change]
  const values = [p1, p2, p3, p4]
  const conns = [p1Conn, p2Conn, p3Conn, p4Conn]
  const refs = [p1Ref, p2Ref, p3Ref, p4Ref]

  return (
    <Module label="Gen Lofi" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 4, padding: '2px 4px' }}>

        {/* Mode tabs — all always run, tab selects sub-type view */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {MODE_ITEMS.map(item => (
            <LabeledControl key={item.value} label={item.text}>
              <IconButton icon={item.icon} title={item.value} active={tab === item.value} onClick={() => onTabChange(item.value)} />
            </LabeledControl>
          ))}
        </div>

        <Divider className="px-1" />

        {/* Sub-type selector for active tab */}
        {subs.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {subs.map(item => (
              <LabeledControl key={item.value} label={item.text}>
                <IconButton icon={item.icon} title={item.value} active={activeSub === item.value} onClick={() => onSubChange(item.value)} />
              </LabeledControl>
            ))}
          </div>
        )}

        <Divider className="px-1" />

        {/* Parameters — shared knobs */}
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
          {animate && <CvKnob port="spd" moduleId={id} active={spdConn} signalRef={spdCvRef} value={speed} onChange={onSpeedChange} label="rate" direction="vertical" />}
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Toggle value={animate} onChange={onAnimateChange} label="ani" size="sm" horizontal />
        </div>

        <Divider className="px-1" />

        {/* I/O — 1 input, 3 outputs */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkCvRef} label="clk" />
          <LabeledJack type="out" port="grad" moduleId={id} signalRef={gradOutRef} label="grad" />
          <LabeledJack type="out" port="ptrn" moduleId={id} signalRef={patternOutRef} label="ptrn" />
          <LabeledJack type="out" port="wave" moduleId={id} signalRef={waveOutRef} label="wave" />
        </div>
      </div>
    </Module>
  )
}

// --- Module ---

export default function GeneratorModule({ id = 'gen1', init, preview }) {
  if (preview) return <GeneratorPanel
    tab="gradient" gradSub="linear" patternSub="stripes" waveSub="sin" p1={50} p2={50} p3={50} p4={50} animate={true} speed={50}
    enabled={false} onToggle={() => {}} id={id}
    onTabChange={() => {}} onGradSubChange={() => {}} onPatternSubChange={() => {}} onWaveSubChange={() => {}}
    onP1Change={() => {}} onP2Change={() => {}} onP3Change={() => {}} onP4Change={() => {}}
    onAnimateChange={() => {}} onSpeedChange={() => {}}
    p1Conn={false} p1Ref={{ current: null }} p2Conn={false} p2Ref={{ current: null }}
    p3Conn={false} p3Ref={{ current: null }} p4Conn={false} p4Ref={{ current: null }}
    spdConn={false} spdCvRef={{ current: null }} clkConn={false} clkCvRef={{ current: null }}
    gradOutRef={{ current: null }} patternOutRef={{ current: null }} waveOutRef={{ current: null }}
  />

  const [tab, setTab] = useState(init?.tab ?? 'gradient')
  const [gradSub, setGradSub] = useState(init?.gradSub ?? 'linear')
  const [patternSub, setPatternSub] = useState(init?.patternSub ?? 'stripes')
  const [waveSub, setWaveSub] = useState(init?.waveSub ?? 'sin')
  const [p1, setP1] = useState(init?.p1 ?? 50)
  const [p2, setP2] = useState(init?.p2 ?? 50)
  const [p3, setP3] = useState(init?.p3 ?? 50)
  const [p4, setP4] = useState(init?.p4 ?? 50)
  const [animate, setAnimate] = useState(init?.animate ?? true)
  const [speed, setSpeed] = useState(init?.speed ?? 50)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const animateRef = useRef(true)
  const speedRef = useRef(50)
  const animTimeRef = useRef(0)
  const spdCvRef = useRef(null)
  const clkCvRef = useRef(null)
  const prevClkRef = useRef(false)
  const gradSubRef = useRef('linear')
  const patternSubRef = useRef('stripes')
  const waveSubRef = useRef('sin')
  const p1Ref = useRef(50)
  const p2Ref = useRef(50)
  const p3Ref = useRef(50)
  const p4Ref = useRef(50)
  const p1CvRef = useRef(null)
  const p2CvRef = useRef(null)
  const p3CvRef = useRef(null)
  const p4CvRef = useRef(null)
  const gradOutRef = useRef(null)
  const patternOutRef = useRef(null)
  const waveOutRef = useRef(null)

  enabledRef.current = enabled
  animateRef.current = animate
  speedRef.current = speed
  gradSubRef.current = gradSub
  patternSubRef.current = patternSub
  waveSubRef.current = waveSub
  p1Ref.current = p1
  p2Ref.current = p2
  p3Ref.current = p3
  p4Ref.current = p4

  const p1Conn = cp.has('p1')
  const p2Conn = cp.has('p2')
  const p3Conn = cp.has('p3')
  const p4Conn = cp.has('p4')
  const spdConn = cp.has('spd')
  const clkConn = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { tab, gradSub, patternSub, waveSub, p1, p2, p3, p4, animate, speed }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { p1: { type: 'scalar' }, p2: { type: 'scalar' }, p3: { type: 'scalar' }, p4: { type: 'scalar' }, spd: { type: 'scalar' }, clk: { type: 'scalar' } },
    outputs: { grad: { type: 'points' }, ptrn: { type: 'points' }, wave: { type: 'points' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) {
        gradOutRef.current = null; patternOutRef.current = null; waveOutRef.current = null
        return { grad: null, ptrn: null, wave: null }
      }
      p1CvRef.current = inputs.p1
      p2CvRef.current = inputs.p2
      p3CvRef.current = inputs.p3
      p4CvRef.current = inputs.p4

      const v1 = inputs.p1 ? readScalar(inputs.p1) : p1Ref.current
      const v2 = inputs.p2 ? readScalar(inputs.p2) : p2Ref.current
      const v3 = inputs.p3 ? readScalar(inputs.p3) : p3Ref.current
      const v4 = inputs.p4 ? readScalar(inputs.p4) : p4Ref.current

      spdCvRef.current = inputs.spd
      clkCvRef.current = inputs.clk
      const clkHigh = readScalar(inputs.clk) > 50
      if (clkHigh && !prevClkRef.current) animTimeRef.current = 0
      prevClkRef.current = clkHigh

      const vSpeed = inputs.spd ? readScalar(inputs.spd) : speedRef.current
      if (animateRef.current) animTimeRef.current += dt * (vSpeed / 50)
      const at = animTimeRef.current

      const makeOut = (mode, sub) => {
        const grid = generateGrid(mode, sub, v1, v2, v3, v4, at)
        const p = points(grid.pts, grid.edges)
        p.aspectFill = true; p.fill = false
        return p
      }

      const gOut = makeOut('gradient', gradSubRef.current)
      const pOut = makeOut('pattern', patternSubRef.current)
      const wOut = makeOut('wave', waveSubRef.current)
      gradOutRef.current = gOut
      patternOutRef.current = pOut
      waveOutRef.current = wOut

      return { grad: gOut, ptrn: pOut, wave: wOut }
    },
  })

  return <GeneratorPanel
    tab={tab} gradSub={gradSub} patternSub={patternSub} waveSub={waveSub}
    p1={p1} p2={p2} p3={p3} p4={p4} animate={animate} speed={speed}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onTabChange={setTab} onGradSubChange={setGradSub} onPatternSubChange={setPatternSub} onWaveSubChange={setWaveSub}
    onP1Change={setP1} onP2Change={setP2} onP3Change={setP3} onP4Change={setP4}
    onAnimateChange={setAnimate} onSpeedChange={setSpeed}
    spdConn={spdConn} spdCvRef={spdCvRef} clkConn={clkConn} clkCvRef={clkCvRef}
    p1Conn={p1Conn} p1Ref={p1CvRef} p2Conn={p2Conn} p2Ref={p2CvRef}
    p3Conn={p3Conn} p3Ref={p3CvRef} p4Conn={p4Conn} p4Ref={p4CvRef}
    gradOutRef={gradOutRef} patternOutRef={patternOutRef} waveOutRef={waveOutRef}
  />
}
