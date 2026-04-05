// Generator2Module — procedural texture generator v2
// 12HP 3U. Each algorithm generates its own geometry directly.
// Gradient, pattern, wave, color — proper spatial output.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, color, points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Knob from '../controls/Knob'
import IconButton from '../controls/IconButton'
import LabeledControl from '../controls/LabeledControl'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

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
  color: [
    { value: 'mono', icon: 'clr-mono', text: 'mono' },
    { value: 'comp', icon: 'clr-comp', text: 'comp' },
    { value: 'anl', icon: 'clr-anl', text: 'anl' },
    { value: 'tri', icon: 'clr-tri', text: 'tri' },
  ],
}

const PARAM_DEFS = {
  gradient: [
    { key: 'p1', label: 'ang' },
    { key: 'p2', label: 'spd' },
  ],
  pattern: [
    { key: 'p1', label: 'spc' },
    { key: 'p2', label: 'ang' },
    { key: 'p3', label: 'dty' },
  ],
  wave: [
    { key: 'p1', label: 'frq' },
    { key: 'p2', label: 'spd' },
    { key: 'p3', label: 'ang' },
    { key: 'p4', label: 'pwm' },
  ],
  color: [
    { key: 'p1', label: 'h' },
    { key: 'p2', label: 's' },
    { key: 'p3', label: 'l' },
  ],
}

// --- Geometry generators — each algorithm produces its own shapes ---

function quad(pts, edges, x1, y1, x2, y2) {
  const base = pts.length
  pts.push({ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 })
  edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
}

function generateGradient(subType, p1, p2, t, oscillate) {
  const pts = []
  const edges = []
  const angle = (p1 / 100) * Math.PI * 2
  // SPD knob (p2) directly sets phase position, animation time adds on top
  const phase = (p2 / 100) + (oscillate ? Math.sin(t) : t)
  const steps = 16

  switch (subType) {
    case 'linear': {
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      for (let i = 0; i < steps; i++) {
        const n = i / steps
        const brightness = ((n + phase) % 1 + 1) % 1
        const size = 0.02 + brightness * 0.04
        const cx = 0.5 + dx * (n - 0.5) * 0.8
        const cy = 0.5 + dy * (n - 0.5) * 0.8
        quad(pts, edges, cx - size, cy - size, cx + size, cy + size)
      }
      break
    }
    case 'radial': {
      const rings = 8
      const segsPerRing = 12
      const spread = 0.1 + (p1 / 100) * 0.4
      for (let r = 0; r < rings; r++) {
        const radius = (r + 1) / rings * spread
        const brightness = ((r / rings + phase) % 1 + 1) % 1
        const size = 0.02 + brightness * 0.03
        for (let s = 0; s < segsPerRing; s++) {
          const a = (s / segsPerRing) * Math.PI * 2 + angle
          const cx = 0.5 + Math.cos(a) * radius
          const cy = 0.5 + Math.sin(a) * radius
          quad(pts, edges, cx - size, cy - size, cx + size, cy + size)
        }
      }
      break
    }
    case 'conic': {
      const segs = 24
      const radius = 0.35
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2
        const brightness = ((a / (Math.PI * 2) + phase) % 1 + 1) % 1
        const r = radius * (0.5 + brightness * 0.5)
        const cx = 0.5 + Math.cos(a) * r
        const cy = 0.5 + Math.sin(a) * r
        const size = 0.01 + brightness * 0.02
        quad(pts, edges, cx - size, cy - size, cx + size, cy + size)
      }
      break
    }
  }
  return { pts, edges }
}

function generatePattern(subType, p1, p2, p3, t, animate, speed) {
  const pts = []
  const edges = []
  const count = Math.max(1, Math.round(1 + (p1 / 100) * 15))
  const angle = (p2 / 100) * Math.PI
  const duty = 0.1 + (p3 / 100) * 0.8
  const margin = 0.02
  const cellSize = (1 - margin * 2) / count
  const rawOff = animate ? t * (speed / 50) * cellSize : 0
  const off = rawOff % cellSize
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  switch (subType) {
    case 'stripes': {
      const stripeW = cellSize * duty
      for (let i = -1; i <= count; i++) {
        const n = margin + (i + 0.5) * cellSize
        const cx = 0.5 + cos * (n - 0.5) + cos * off
        const cy = 0.5 + sin * (n - 0.5) + sin * off
        const hw = stripeW / 2
        const hl = 0.72
        const base = pts.length
        pts.push(
          { x: cx - sin * hl - cos * hw, y: cy + cos * hl - sin * hw },
          { x: cx + sin * hl - cos * hw, y: cy - cos * hl - sin * hw },
          { x: cx + sin * hl + cos * hw, y: cy - cos * hl + sin * hw },
          { x: cx - sin * hl + cos * hw, y: cy + cos * hl + sin * hw },
        )
        edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
      }
      break
    }
    case 'dots': {
      const dotR = cellSize * duty * 0.4
      const segs = 8
      for (let gy = -1; gy <= count; gy++) {
        for (let gx = -1; gx <= count; gx++) {
          const cx = margin + (gx + 0.5) * cellSize + cos * off
          const cy = margin + (gy + 0.5) * cellSize + sin * off
          const base = pts.length
          for (let s = 0; s < segs; s++) {
            const a = (s / segs) * Math.PI * 2
            pts.push({ x: cx + Math.cos(a) * dotR, y: cy + Math.sin(a) * dotR })
          }
          for (let s = 0; s < segs; s++) edges.push([base + s, base + (s + 1) % segs])
        }
      }
      break
    }
    case 'checker': {
      const tileSize = cellSize * duty
      const pad = (cellSize - tileSize) / 2
      for (let gy = -1; gy <= count; gy++) {
        for (let gx = -1; gx <= count; gx++) {
          if ((gx + gy) % 2 !== 0) continue
          const cx = margin + (gx + 0.5) * cellSize + off
          const cy = margin + (gy + 0.5) * cellSize + off
          // Rotated quad
          const hr = tileSize / 2
          const base = pts.length
          pts.push(
            { x: cx + cos * (-hr) - sin * (-hr), y: cy + sin * (-hr) + cos * (-hr) },
            { x: cx + cos * (hr) - sin * (-hr), y: cy + sin * (hr) + cos * (-hr) },
            { x: cx + cos * (hr) - sin * (hr), y: cy + sin * (hr) + cos * (hr) },
            { x: cx + cos * (-hr) - sin * (hr), y: cy + sin * (-hr) + cos * (hr) },
          )
          edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
        }
      }
      break
    }
  }
  return { pts, edges }
}

function generateWave(subType, p1, p2, p3, p4, t, ampVal, dutyVal, ofsVal) {
  const pts = []
  const edges = []
  const waveFreq = 1 + (p1 / 100) * 6
  const speed = p2 / 50
  const angle = (p3 / 100) * Math.PI
  const pwm = p4 / 100
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const count = Math.max(1, Math.round(1 + (p1 / 100) * 7))
  const range = 1.5
  const res = 128
  const cellW = range / count
  const stripeW = cellW * (0.1 + (dutyVal / 100) * 0.54)
  const amp = (ampVal / 100) * stripeW * 1.28
  const ofsAmount = ((ofsVal - 50) / 50) * cellW

  const waveOffset = (n) => {
    const phase = n * waveFreq + t * speed
    switch (subType) {
      case 'sin': return Math.sin(phase * Math.PI * 2) * amp * 0.5
      case 'saw': return (((phase % 1) + 1) % 1 - 0.5) * amp
      case 'tri': return (Math.abs(((((phase % 1) + 1) % 1) * 2) - 1) - 0.5) * amp
      case 'sqr': return ((((phase % 1) + 1) % 1) > pwm ? -0.5 : 0.5) * amp
      default: return 0
    }
  }

  for (let s = -2; s < count + 2; s++) {
    const base = pts.length
    const center = s * cellW - range / 2
    const isOdd = Math.abs(s) % 2 === 1
    const acrossShift = isOdd ? ofsAmount : 0
    const left = center - stripeW / 2 + acrossShift
    const right = center + stripeW / 2 + acrossShift

    // Right wave edge (forward)
    for (let i = 0; i < res; i++) {
      const n = i / (res - 1)
      const along = (n - 0.5) * range
      const across = right + waveOffset(n + s * 0.1)
      pts.push({ x: 0.5 + cos * along - sin * across, y: 0.5 + sin * along + cos * across })
    }
    // Left wave edge (reverse)
    for (let i = res - 1; i >= 0; i--) {
      const n = i / (res - 1)
      const along = (n - 0.5) * range
      const across = left + waveOffset(n + s * 0.1 + 0.5)
      pts.push({ x: 0.5 + cos * along - sin * across, y: 0.5 + sin * along + cos * across })
    }
    // Close the stripe
    const total = pts.length - base
    for (let i = 0; i < total; i++) edges.push([base + i, base + (i + 1) % total])
  }

  return { pts, edges }
}

function generateColor(p1, p2, p3) {
  // Single filled quad covering the area
  const pts = []
  const edges = []
  quad(pts, edges, 0.05, 0.05, 0.95, 0.95)
  return { pts, edges }
}

function generate(mode, subType, p1, p2, p3, p4, t, animate, speed, oscillate, ampVal, dutyVal, ofsVal) {
  switch (mode) {
    case 'gradient': return generateGradient(subType, p1, p2, t, oscillate)
    case 'pattern': return generatePattern(subType, p1, p2, p3, t, animate, speed)
    case 'wave': return generateWave(subType, p1, p2, p3, p4, t, ampVal, dutyVal, ofsVal)
    case 'color': return generateColor(p1, p2, p3)
    default: return { pts: [], edges: [] }
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

// --- UI ---

function Generator2Panel({
  mode, subType, p1, p2, p3, p4, amp, duty, offset, animate, speed, lfoOn, lfoFreq, oscillate, enabled, onToggle, id,
  onModeChange, onSubTypeChange, onP1Change, onP2Change, onP3Change, onP4Change, onAmpChange, onDutyChange, onOffsetChange,
  onAnimateChange, onSpeedChange, onLfoOnChange, onLfoFreqChange, onOscillateChange,
  p1Conn, p1Ref, p2Conn, p2Ref, p3Conn, p3Ref, p4Conn, p4Ref,
  spdConn, spdRef, clkConn, clkRef, ampConn, ampCvRef, dtyConn, dtyCvRef, ofsConn, ofsCvRef,
  pointsOutRef, colorOutRef, scalarOutRef, lfoOutRef,
}) {
  const params = (PARAM_DEFS[mode] || []).filter(p => {
    if (p.key === 'p4' && subType !== 'sqr') return false
    if (p.key === 'p2' && p.label === 'spd' && !animate) return false
    return true
  })
  const subs = SUB_ITEMS[mode] || []
  const paramMap = {
    p1: { value: p1, onChange: onP1Change, conn: p1Conn, ref: p1Ref },
    p2: { value: p2, onChange: onP2Change, conn: p2Conn, ref: p2Ref },
    p3: { value: p3, onChange: onP3Change, conn: p3Conn, ref: p3Ref },
    p4: { value: p4, onChange: onP4Change, conn: p4Conn, ref: p4Ref },
  }

  return (
    <Module label="Generator 2" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 4, padding: '2px 4px' }}>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {MODE_ITEMS.map(item => (
            <LabeledControl key={item.value} label={item.text}>
              <IconButton icon={item.icon} active={mode === item.value} onClick={() => onModeChange(item.value)} />
            </LabeledControl>
          ))}
        </div>

        <Divider className="px-1" />

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

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {params.map(param => {
            const m = paramMap[param.key]
            return (
              <CvKnob
                key={param.key}
                port={param.key}
                moduleId={id}
                active={m.conn}
                signalRef={m.ref}
                value={m.value}
                onChange={m.onChange}
                label={param.label}
                direction="vertical"
              />
            )
          })}
          {mode === 'wave' && <CvKnob port="dty" moduleId={id} active={dtyConn} signalRef={dtyCvRef} value={duty} onChange={onDutyChange} label="dty" direction="vertical" />}
          {mode === 'wave' && <CvKnob port="ofs" moduleId={id} active={ofsConn} signalRef={ofsCvRef} value={offset} onChange={onOffsetChange} label="ofs" direction="vertical" bipolar />}
          {mode === 'wave' && <CvKnob port="amp" moduleId={id} active={ampConn} signalRef={ampCvRef} value={amp} onChange={onAmpChange} label="amp" direction="vertical" />}
          {lfoOn && <Knob value={lfoFreq} onChange={onLfoFreqChange} label="frq" />}
          {animate && <CvKnob port="spd" moduleId={id} active={spdConn} signalRef={spdRef} value={speed} onChange={onSpeedChange} label="rate" direction="vertical" />}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Toggle value={animate} onChange={onAnimateChange} label="ani" size="sm" horizontal />
          <Toggle value={lfoOn} onChange={onLfoOnChange} label="lfo" size="sm" horizontal />
          {mode === 'gradient' && <Toggle value={oscillate} onChange={onOscillateChange} label="dir" size="sm" horizontal />}
        </div>

        <Divider className="px-1" />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkRef} label="clk" />
          <LabeledJack type="out" port="color" moduleId={id} signalRef={colorOutRef} label="clr" />
          <LabeledJack type="out" port="scalar" moduleId={id} signalRef={scalarOutRef} label="val" />
          <LabeledJack type="out" port="lfo" moduleId={id} signalRef={lfoOutRef} label="lfo" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={pointsOutRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

// --- Module ---

export default function Generator2Module({ id = 'gen2_1', init, preview }) {
  if (preview) return <Generator2Panel
    mode="pattern" subType="checker" p1={50} p2={50} p3={50} p4={50} amp={50} duty={50} offset={0} animate={false} speed={50} lfoOn={false} lfoFreq={50} oscillate={false}
    enabled={false} onToggle={() => {}} id={id}
    onModeChange={() => {}} onSubTypeChange={() => {}} onP1Change={() => {}} onP2Change={() => {}} onP3Change={() => {}} onP4Change={() => {}} onAmpChange={() => {}} onDutyChange={() => {}} onOffsetChange={() => {}}
    onAnimateChange={() => {}} onSpeedChange={() => {}} onLfoOnChange={() => {}} onLfoFreqChange={() => {}} onOscillateChange={() => {}}
    p1Conn={false} p1Ref={{ current: null }} p2Conn={false} p2Ref={{ current: null }}
    p3Conn={false} p3Ref={{ current: null }} p4Conn={false} p4Ref={{ current: null }}
    spdConn={false} spdRef={{ current: null }} clkConn={false} clkRef={{ current: null }} ampConn={false} ampCvRef={{ current: null }} dtyConn={false} dtyCvRef={{ current: null }} ofsConn={false} ofsCvRef={{ current: null }}
    pointsOutRef={{ current: null }} colorOutRef={{ current: null }} scalarOutRef={{ current: null }} lfoOutRef={{ current: null }}
  />

  const [mode, setMode] = useState(init?.mode ?? 'pattern')
  const [subType, setSubType] = useState(init?.subType ?? 'checker')
  const [p1, setP1] = useState(init?.p1 ?? 50)
  const [p2, setP2] = useState(init?.p2 ?? 50)
  const [p3, setP3] = useState(init?.p3 ?? 50)
  const [p4, setP4] = useState(init?.p4 ?? 50)
  const [animate, setAnimate] = useState(init?.animate ?? false)
  const [speed, setSpeed] = useState(init?.speed ?? 50)
  const [amp, setAmp] = useState(init?.amp ?? 50)
  const [duty, setDuty] = useState(init?.duty ?? 50)
  const [offset, setOffset] = useState(init?.offset ?? 50)
  const [lfoOn, setLfoOn] = useState(init?.lfoOn ?? false)
  const [lfoFreq, setLfoFreq] = useState(init?.lfoFreq ?? 50)
  const [oscillate, setOscillate] = useState(init?.oscillate ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  const modeRef = useRef('pattern')
  const subTypeRef = useRef('checker')
  const p1Ref = useRef(50)
  const p2Ref = useRef(50)
  const p3Ref = useRef(50)
  const p4Ref = useRef(50)
  const animateRef = useRef(false)
  const speedRef = useRef(50)
  const ampRef = useRef(50)
  const dutyRef = useRef(50)
  const offsetRef = useRef(0)
  const ampCvRef = useRef(null)
  const dtyCvRef = useRef(null)
  const ofsCvRef = useRef(null)
  const lfoOnRef = useRef(false)
  const lfoFreqRef = useRef(50)
  const oscillateRef = useRef(false)
  const p1CvRef = useRef(null)
  const p2CvRef = useRef(null)
  const p3CvRef = useRef(null)
  const p4CvRef = useRef(null)
  const spdCvRef = useRef(null)
  const clkRef = useRef(null)
  const prevClkRef = useRef(false)
  const animTimeRef = useRef(0)
  const lfoPhaseRef = useRef(0)
  const lfoOutRef = useRef(null)
  const pointsOutRef = useRef(null)
  const colorOutRef = useRef(null)
  const scalarOutRef = useRef(null)

  enabledRef.current = enabled
  modeRef.current = mode
  subTypeRef.current = subType
  p1Ref.current = p1
  p2Ref.current = p2
  p3Ref.current = p3
  p4Ref.current = p4
  animateRef.current = animate
  speedRef.current = speed
  ampRef.current = amp
  dutyRef.current = duty
  offsetRef.current = offset
  lfoOnRef.current = lfoOn
  lfoFreqRef.current = lfoFreq
  oscillateRef.current = oscillate

  const conns = routing?.connections || []
  const p1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p1')
  const p2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p2')
  const p3Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p3')
  const p4Conn = conns.some(c => c.toModuleId === id && c.toPort === 'p4')
  const spdConn = conns.some(c => c.toModuleId === id && c.toPort === 'spd')
  const clkConn = conns.some(c => c.toModuleId === id && c.toPort === 'clk')
  const ampConn = conns.some(c => c.toModuleId === id && c.toPort === 'amp')
  const dtyConn = conns.some(c => c.toModuleId === id && c.toPort === 'dty')
  const ofsConn = conns.some(c => c.toModuleId === id && c.toPort === 'ofs')

  const handleModeChange = (m) => {
    setMode(m)
    const subs = SUB_ITEMS[m]
    if (subs && subs.length > 0) setSubType(subs[0].value)
  }

  useModule({
    id,
    inputs: { p1: { type: 'scalar' }, p2: { type: 'scalar' }, p3: { type: 'scalar' }, p4: { type: 'scalar' }, spd: { type: 'scalar' }, clk: { type: 'scalar' }, amp: { type: 'scalar' }, dty: { type: 'scalar' }, ofs: { type: 'scalar' } },
    outputs: { out: { type: 'points' }, color: { type: 'color' }, scalar: { type: 'scalar' }, lfo: { type: 'scalar' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { pointsOutRef.current = null; colorOutRef.current = null; scalarOutRef.current = null; return { out: null, color: null, scalar: null } }
      p1CvRef.current = inputs.p1
      p2CvRef.current = inputs.p2
      p3CvRef.current = inputs.p3
      p4CvRef.current = inputs.p4
      spdCvRef.current = inputs.spd
      clkRef.current = inputs.clk

      // Clock: reset LFO phase on rising edge
      const clkHigh = readScalar(inputs.clk) > 50
      if (clkHigh && !prevClkRef.current) lfoPhaseRef.current = 0
      prevClkRef.current = clkHigh

      const v1 = inputs.p1 ? readScalar(inputs.p1) : p1Ref.current
      let v2 = inputs.p2 ? readScalar(inputs.p2) : p2Ref.current
      const v3 = inputs.p3 ? readScalar(inputs.p3) : p3Ref.current
      const v4 = inputs.p4 ? readScalar(inputs.p4) : p4Ref.current

      // SPD base value
      const spdKnob = inputs.spd ? readScalar(inputs.spd) : speedRef.current

      // Internal LFO → modulates v2 (SPD knob)
      if (lfoOnRef.current) {
        lfoPhaseRef.current += dt * (lfoFreqRef.current / 25)
        const lfoVal = oscillateRef.current
          ? (Math.sin(lfoPhaseRef.current * Math.PI * 2) + 1) / 2
          : (lfoPhaseRef.current % 1)
        v2 = spdKnob * lfoVal
        lfoOutRef.current = scalar(lfoVal * 100)
      } else {
        lfoOutRef.current = scalar(0)
      }
      const spdVal = spdKnob

      // Animation time
      if (animateRef.current) animTimeRef.current += dt * (spdVal / 50)
      ampCvRef.current = inputs.amp
      dtyCvRef.current = inputs.dty
      ofsCvRef.current = inputs.ofs
      const ampVal = inputs.amp ? readScalar(inputs.amp) : ampRef.current
      const dtyVal = inputs.dty ? readScalar(inputs.dty) : dutyRef.current
      const ofsVal = inputs.ofs ? readScalar(inputs.ofs) : offsetRef.current
      const geom = generate(modeRef.current, subTypeRef.current, v1, v2, v3, v4, animTimeRef.current, animateRef.current, spdVal, oscillateRef.current, ampVal, dtyVal, ofsVal)
      const pOut = points(geom.pts, geom.edges)
      pOut.aspectFill = true
      pOut.fill = true
      pOut.strokeWidth = 1
      pointsOutRef.current = pOut

      let cOut = null
      if (modeRef.current === 'color') {
        const baseH = ((v1 / 100) + (animateRef.current ? animTimeRef.current * 0.1 : 0)) % 1
        const s = v2 / 100, l = v3 / 100
        const sub = subTypeRef.current
        let h = baseH
        if (sub === 'comp') {
          // Alternate between base and complement
          h = Math.floor(animTimeRef.current * 2) % 2 === 0 ? baseH : (baseH + 0.5) % 1
        } else if (sub === 'anl') {
          const step = Math.floor(animTimeRef.current * 3) % 3
          h = (baseH + (step - 1) * (30 / 360) + 1) % 1
        } else if (sub === 'tri') {
          const step = Math.floor(animTimeRef.current * 3) % 3
          h = (baseH + step * (1 / 3)) % 1
        }
        const rgb = hslToRgb(h, s, l)
        cOut = color(rgb.r, rgb.g, rgb.b)
      }
      colorOutRef.current = cOut

      const sOut = scalar(50)
      scalarOutRef.current = sOut

      return { out: pOut, color: cOut, scalar: sOut, lfo: lfoOutRef.current }
    },
  })

  return <Generator2Panel
    mode={mode} subType={subType} p1={p1} p2={p2} p3={p3} p4={p4} amp={amp} duty={duty} offset={offset} animate={animate} speed={speed} lfoOn={lfoOn} lfoFreq={lfoFreq} oscillate={oscillate}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onModeChange={handleModeChange} onSubTypeChange={setSubType}
    onP1Change={setP1} onP2Change={setP2} onP3Change={setP3} onP4Change={setP4} onAmpChange={setAmp} onDutyChange={setDuty} onOffsetChange={setOffset}
    onAnimateChange={setAnimate} onSpeedChange={setSpeed} onLfoOnChange={setLfoOn} onLfoFreqChange={setLfoFreq} onOscillateChange={setOscillate}
    p1Conn={p1Conn} p1Ref={p1CvRef} p2Conn={p2Conn} p2Ref={p2CvRef}
    p3Conn={p3Conn} p3Ref={p3CvRef} p4Conn={p4Conn} p4Ref={p4CvRef}
    spdConn={spdConn} spdRef={spdCvRef} clkConn={clkConn} clkRef={clkRef} ampConn={ampConn} ampCvRef={ampCvRef} dtyConn={dtyConn} dtyCvRef={dtyCvRef} ofsConn={ofsConn} ofsCvRef={ofsCvRef}
    pointsOutRef={pointsOutRef} colorOutRef={colorOutRef} scalarOutRef={scalarOutRef} lfoOutRef={lfoOutRef}
  />
}
