// S2V — Scalar to Visual converter
// 6HP 1U. Takes up to 4 scalar inputs, outputs points geometry.
// Modes: bar, gauge, plot, meter, scatter.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar } from '../../hooks/signals'
import { sinLut, cosLut } from '../../hooks/trigLut'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import IconSelect from '../parametric/IconSelect'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const MODES = [
  { value: 'bar', icon: 'gen-gradient', label: 'Bar' },
  { value: 'gauge', icon: 'radial-circle', label: 'Gauge' },
  { value: 'plot', icon: 'wave-sin', label: 'Plot' },
  { value: 'meter', icon: 'ascii-dash', label: 'Meter' },
  { value: 'scatter', icon: 'ptrn-dot', label: 'Scatter' },
]

const PLOT_LEN = 64
// ponytail: scratch reused across frames — plot mode was allocating 4× Float32Array
// per frame just to linearize the ring buffers. Consumed inside one process call.
const _orderedScratch = [null, null, null, null]
const COLORS = [
  { r: 0.18, g: 0.8, b: 0.44 },
  { r: 0.2, g: 0.6, b: 1 },
  { r: 0.91, g: 0.3, b: 0.24 },
  { r: 0.95, g: 0.77, b: 0.06 },
]

function generateBar(vals) {
  const pts = [], edges = []
  const n = vals.filter(v => v != null).length || 1
  const w = 0.8 / n
  const gap = 0.04
  let x = 0.1
  for (let i = 0; i < 4; i++) {
    if (vals[i] == null) continue
    const h = (vals[i] / 100) * 0.8
    const base = pts.length
    pts.push({ x, y: 0.9 - h })
    pts.push({ x: x + w - gap, y: 0.9 - h })
    pts.push({ x: x + w - gap, y: 0.9 })
    pts.push({ x, y: 0.9 })
    edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
    x += w
  }
  return { pts, edges }
}

function generateGauge(vals) {
  const pts = [], edges = []
  const cx = 0.5, cy = 0.55, r = 0.35
  // Arc background
  const arcPts = 32
  for (let i = 0; i <= arcPts; i++) {
    const a = Math.PI * 0.8 + (i / arcPts) * Math.PI * 1.4
    pts.push({ x: cx + cosLut(a) * r, y: cy + sinLut(a) * r })
    if (i > 0) edges.push([pts.length - 2, pts.length - 1])
  }
  // Needle for first input
  const val = vals[0] ?? 50
  const needleA = Math.PI * 0.8 + (val / 100) * Math.PI * 1.4
  const base = pts.length
  pts.push({ x: cx, y: cy })
  pts.push({ x: cx + cosLut(needleA) * r * 0.85, y: cy + sinLut(needleA) * r * 0.85 })
  edges.push([base, base + 1])
  return { pts, edges }
}

function generatePlot(histories) {
  const pts = [], edges = []
  for (let ch = 0; ch < 4; ch++) {
    const hist = histories[ch]
    if (!hist) continue
    const base = pts.length
    for (let i = 0; i < PLOT_LEN; i++) {
      const x = 0.05 + (i / (PLOT_LEN - 1)) * 0.9
      const y = 0.9 - (hist[i] / 100) * 0.8
      pts.push({ x, y })
      if (i > 0) edges.push([base + i - 1, base + i])
    }
  }
  return { pts, edges }
}

function generateMeter(vals) {
  const pts = [], edges = []
  const n = vals.filter(v => v != null).length || 1
  const h = 0.8 / n
  const gap = 0.02
  let y = 0.1
  for (let i = 0; i < 4; i++) {
    if (vals[i] == null) continue
    const w = (vals[i] / 100) * 0.8
    const base = pts.length
    pts.push({ x: 0.1, y })
    pts.push({ x: 0.1 + w, y })
    pts.push({ x: 0.1 + w, y: y + h - gap })
    pts.push({ x: 0.1, y: y + h - gap })
    edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
    // Tick marks
    for (let t = 0.25; t < 1; t += 0.25) {
      const tx = 0.1 + t * 0.8
      const b = pts.length
      pts.push({ x: tx, y: y + h - gap })
      pts.push({ x: tx, y: y + h - gap + 0.01 })
      edges.push([b, b + 1])
    }
    y += h
  }
  return { pts, edges }
}

function generateScatter(vals) {
  const pts = [], edges = []
  const x = vals[0] != null ? 0.1 + (vals[0] / 100) * 0.8 : 0.5
  const y = vals[1] != null ? 0.9 - (vals[1] / 100) * 0.8 : 0.5
  const r = 0.02
  const segs = 6
  const base = pts.length
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2
    pts.push({ x: x + cosLut(a) * r, y: y + sinLut(a) * r })
  }
  for (let i = 0; i < segs; i++) edges.push([base + i, base + (i + 1) % segs])
  // Crosshair
  const b2 = pts.length
  pts.push({ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 })
  edges.push([b2, b2 + 1])
  const b3 = pts.length
  pts.push({ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 })
  edges.push([b3, b3 + 1])
  return { pts, edges }
}

function S2VPanel({ mode, enabled, onToggle, onModeChange, id, aConn, aRef, bConn, bRef, cConn, cRef, dConn, dRef, outRef }) {
  return (
    <Module label="S2V" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%', padding: '4px 0', gap: 4 }}>
        <div style={{ paddingBottom: 2 }}>
          <IconSelect value={mode} onChange={onModeChange} columns={5} items={MODES} />
        </div>
        <Divider />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <LabeledJack type="in" port="a" moduleId={id} active={aConn} signalRef={aRef} label="a" />
            <LabeledJack type="in" port="b" moduleId={id} active={bConn} signalRef={bRef} label="b" />
            <LabeledJack type="in" port="c" moduleId={id} active={cConn} signalRef={cRef} label="c" />
            <LabeledJack type="in" port="d" moduleId={id} active={dConn} signalRef={dRef} label="d" />
          </div>
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function S2VModule({ id = 's2v1', init, preview }) {
  if (preview) return <S2VPanel mode="bar" enabled={false} onToggle={() => {}} onModeChange={() => {}} id={id} aConn={false} aRef={{ current: null }} bConn={false} bRef={{ current: null }} cConn={false} cRef={{ current: null }} dConn={false} dRef={{ current: null }} outRef={{ current: null }} />

  const [mode, setMode] = useState(init?.mode ?? 'bar')
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const modeRef = useRef('bar')
  const aRef = useRef(null), bRef = useRef(null), cRef = useRef(null), dRef = useRef(null)
  const outRef = useRef(null)
  const historiesRef = useRef([null, null, null, null])
  const writeIdxRef = useRef(0)

  enabledRef.current = enabled
  modeRef.current = mode

  const aConn = cp.has('a'), bConn = cp.has('b'), cConn = cp.has('c'), dConn = cp.has('d')

  const saveStateRef = useRef({})
  saveStateRef.current = { mode }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' }, c: { type: 'scalar' }, d: { type: 'scalar' } },
    outputs: { out: { type: 'points' } },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      aRef.current = inputs.a; bRef.current = inputs.b; cRef.current = inputs.c; dRef.current = inputs.d

      const vals = [
        inputs.a ? readScalar(inputs.a) : null,
        inputs.b ? readScalar(inputs.b) : null,
        inputs.c ? readScalar(inputs.c) : null,
        inputs.d ? readScalar(inputs.d) : null,
      ]

      let geom
      switch (modeRef.current) {
        case 'bar': geom = generateBar(vals); break
        case 'gauge': geom = generateGauge(vals); break
        case 'plot': {
          // Update ring buffers
          const idx = writeIdxRef.current
          for (let i = 0; i < 4; i++) {
            if (vals[i] != null) {
              if (!historiesRef.current[i]) historiesRef.current[i] = new Float32Array(PLOT_LEN)
              historiesRef.current[i][idx] = vals[i]
            }
          }
          writeIdxRef.current = (idx + 1) % PLOT_LEN
          // Build ordered arrays from ring buffer (into reusable scratch)
          const ordered = _orderedScratch
          for (let ch = 0; ch < 4; ch++) {
            const h = historiesRef.current[ch]
            if (!h) { ordered[ch] = null; continue }
            if (!ordered[ch]) ordered[ch] = new Float32Array(PLOT_LEN)
            const out = ordered[ch]
            for (let i = 0; i < PLOT_LEN; i++) out[i] = h[(writeIdxRef.current + i) % PLOT_LEN]
          }
          geom = generatePlot(ordered)
          break
        }
        case 'meter': geom = generateMeter(vals); break
        case 'scatter': geom = generateScatter(vals); break
        default: geom = generateBar(vals)
      }

      const out = points(geom.pts, geom.edges)
      out.aspectLock = true
      out.strokeWidth = 1
      outRef.current = out
      return { out }
    },
  })

  return <S2VPanel mode={mode} enabled={enabled} onToggle={() => setEnabled(!enabled)} onModeChange={setMode} id={id} aConn={aConn} aRef={aRef} bConn={bConn} bRef={bRef} cConn={cConn} cRef={cRef} dConn={dConn} dRef={dRef} outRef={outRef} />
}
