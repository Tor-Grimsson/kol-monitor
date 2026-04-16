// SVGModule — load SVG files and output as points signal
// 10HP 1U. Dropdown file selector, SCL knob, CLR/PEN inputs, points output.

import { useState, useRef, useCallback, useEffect } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Dropdown from '../controls/Dropdown'

// Parse SVG text into { vertices: [[x,y]], edges: [[i,j]] }
function parseSVG(svgText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return { vertices: [], edges: [], aspect: 1 }

  // Get viewBox for normalization
  const vb = svg.getAttribute('viewBox')
  let vx = 0, vy = 0, vw = 100, vh = 100
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number)
    if (parts.length === 4) [vx, vy, vw, vh] = parts
  } else {
    vw = parseFloat(svg.getAttribute('width')) || 100
    vh = parseFloat(svg.getAttribute('height')) || 100
  }
  const aspect = vw / vh

  const vertices = []
  const edges = []

  function addPoint(x, y) {
    const idx = vertices.length
    vertices.push([(x - vx) / vw, (y - vy) / vh])
    return idx
  }

  function addEdge(a, b) { edges.push([a, b]) }

  // Sample cubic bezier
  function sampleCubic(x0, y0, x1, y1, x2, y2, x3, y3, steps = 8) {
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const u = 1 - t
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
      pts.push([x, y])
    }
    return pts
  }

  // Sample quadratic bezier
  function sampleQuad(x0, y0, x1, y1, x2, y2, steps = 8) {
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const u = 1 - t
      const x = u * u * x0 + 2 * u * t * x1 + t * t * x2
      const y = u * u * y0 + 2 * u * t * y1 + t * t * y2
      pts.push([x, y])
    }
    return pts
  }

  // Sample arc (simplified — approximate with line segments)
  function sampleArc(x0, y0, rx, ry, rotation, largeArc, sweep, x1, y1, steps = 16) {
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t])
    }
    // Better arc approximation using endpoint parameterization
    if (rx === 0 || ry === 0) return pts
    const phi = (rotation * Math.PI) / 180
    const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi)
    const dx2 = (x0 - x1) / 2, dy2 = (y0 - y1) / 2
    const x1p = cosPhi * dx2 + sinPhi * dy2
    const y1p = -sinPhi * dx2 + cosPhi * dy2
    let rxSq = rx * rx, rySq = ry * ry
    const x1pSq = x1p * x1p, y1pSq = y1p * y1p
    let lambda = x1pSq / rxSq + y1pSq / rySq
    if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); rxSq = rx * rx; rySq = ry * ry }
    const num = Math.max(0, rxSq * rySq - rxSq * y1pSq - rySq * x1pSq)
    const den = rxSq * y1pSq + rySq * x1pSq
    const sq = den === 0 ? 0 : Math.sqrt(num / den) * (largeArc === sweep ? -1 : 1)
    const cxp = sq * rx * y1p / ry
    const cyp = -sq * ry * x1p / rx
    const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2
    const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2
    const theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx)
    let dTheta = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - theta1
    if (sweep && dTheta < 0) dTheta += Math.PI * 2
    if (!sweep && dTheta > 0) dTheta -= Math.PI * 2
    const arcPts = []
    for (let i = 0; i <= steps; i++) {
      const t = theta1 + (i / steps) * dTheta
      const xr = rx * Math.cos(t), yr = ry * Math.sin(t)
      arcPts.push([cosPhi * xr - sinPhi * yr + cx, sinPhi * xr + cosPhi * yr + cy])
    }
    return arcPts
  }

  // Parse path d attribute
  function parsePath(d) {
    const cmds = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []
    let cx = 0, cy = 0, startX = 0, startY = 0, startIdx = -1
    let prevCx2 = 0, prevCy2 = 0, prevCmd = ''

    for (const cmd of cmds) {
      const type = cmd[0]
      const nums = (cmd.slice(1).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi) || []).map(Number)
      const rel = type === type.toLowerCase()

      switch (type.toUpperCase()) {
        case 'M': {
          for (let i = 0; i < nums.length; i += 2) {
            cx = rel ? cx + nums[i] : nums[i]
            cy = rel ? cy + nums[i + 1] : nums[i + 1]
            if (i === 0) { startX = cx; startY = cy }
            const idx = addPoint(cx, cy)
            if (i === 0) startIdx = idx
            else addEdge(idx - 1, idx)
          }
          break
        }
        case 'L': {
          for (let i = 0; i < nums.length; i += 2) {
            const prev = vertices.length - 1
            cx = rel ? cx + nums[i] : nums[i]
            cy = rel ? cy + nums[i + 1] : nums[i + 1]
            const idx = addPoint(cx, cy)
            if (prev >= 0) addEdge(prev, idx)
          }
          break
        }
        case 'H': {
          for (const n of nums) {
            const prev = vertices.length - 1
            cx = rel ? cx + n : n
            const idx = addPoint(cx, cy)
            if (prev >= 0) addEdge(prev, idx)
          }
          break
        }
        case 'V': {
          for (const n of nums) {
            const prev = vertices.length - 1
            cy = rel ? cy + n : n
            const idx = addPoint(cx, cy)
            if (prev >= 0) addEdge(prev, idx)
          }
          break
        }
        case 'C': {
          for (let i = 0; i < nums.length; i += 6) {
            const x1 = rel ? cx + nums[i] : nums[i]
            const y1 = rel ? cy + nums[i + 1] : nums[i + 1]
            const x2 = rel ? cx + nums[i + 2] : nums[i + 2]
            const y2 = rel ? cy + nums[i + 3] : nums[i + 3]
            const x3 = rel ? cx + nums[i + 4] : nums[i + 4]
            const y3 = rel ? cy + nums[i + 5] : nums[i + 5]
            const sampled = sampleCubic(cx, cy, x1, y1, x2, y2, x3, y3)
            for (let j = 1; j < sampled.length; j++) {
              const prev = vertices.length - 1
              const idx = addPoint(sampled[j][0], sampled[j][1])
              if (prev >= 0) addEdge(prev, idx)
            }
            prevCx2 = x2; prevCy2 = y2
            cx = x3; cy = y3
          }
          break
        }
        case 'S': {
          for (let i = 0; i < nums.length; i += 4) {
            const x1 = prevCmd === 'C' || prevCmd === 'S' ? 2 * cx - prevCx2 : cx
            const y1 = prevCmd === 'C' || prevCmd === 'S' ? 2 * cy - prevCy2 : cy
            const x2 = rel ? cx + nums[i] : nums[i]
            const y2 = rel ? cy + nums[i + 1] : nums[i + 1]
            const x3 = rel ? cx + nums[i + 2] : nums[i + 2]
            const y3 = rel ? cy + nums[i + 3] : nums[i + 3]
            const sampled = sampleCubic(cx, cy, x1, y1, x2, y2, x3, y3)
            for (let j = 1; j < sampled.length; j++) {
              const prev = vertices.length - 1
              const idx = addPoint(sampled[j][0], sampled[j][1])
              if (prev >= 0) addEdge(prev, idx)
            }
            prevCx2 = x2; prevCy2 = y2
            cx = x3; cy = y3
          }
          break
        }
        case 'Q': {
          for (let i = 0; i < nums.length; i += 4) {
            const x1 = rel ? cx + nums[i] : nums[i]
            const y1 = rel ? cy + nums[i + 1] : nums[i + 1]
            const x2 = rel ? cx + nums[i + 2] : nums[i + 2]
            const y2 = rel ? cy + nums[i + 3] : nums[i + 3]
            const sampled = sampleQuad(cx, cy, x1, y1, x2, y2)
            for (let j = 1; j < sampled.length; j++) {
              const prev = vertices.length - 1
              const idx = addPoint(sampled[j][0], sampled[j][1])
              if (prev >= 0) addEdge(prev, idx)
            }
            prevCx2 = x1; prevCy2 = y1
            cx = x2; cy = y2
          }
          break
        }
        case 'T': {
          for (let i = 0; i < nums.length; i += 2) {
            const x1 = prevCmd === 'Q' || prevCmd === 'T' ? 2 * cx - prevCx2 : cx
            const y1 = prevCmd === 'Q' || prevCmd === 'T' ? 2 * cy - prevCy2 : cy
            const x2 = rel ? cx + nums[i] : nums[i]
            const y2 = rel ? cy + nums[i + 1] : nums[i + 1]
            const sampled = sampleQuad(cx, cy, x1, y1, x2, y2)
            for (let j = 1; j < sampled.length; j++) {
              const prev = vertices.length - 1
              const idx = addPoint(sampled[j][0], sampled[j][1])
              if (prev >= 0) addEdge(prev, idx)
            }
            prevCx2 = x1; prevCy2 = y1
            cx = x2; cy = y2
          }
          break
        }
        case 'A': {
          for (let i = 0; i < nums.length; i += 7) {
            const arcRx = nums[i], arcRy = nums[i + 1], rot = nums[i + 2]
            const large = nums[i + 3], sw = nums[i + 4]
            const x1 = rel ? cx + nums[i + 5] : nums[i + 5]
            const y1 = rel ? cy + nums[i + 6] : nums[i + 6]
            const sampled = sampleArc(cx, cy, arcRx, arcRy, rot, large, sw, x1, y1)
            for (let j = 1; j < sampled.length; j++) {
              const prev = vertices.length - 1
              const idx = addPoint(sampled[j][0], sampled[j][1])
              if (prev >= 0) addEdge(prev, idx)
            }
            cx = x1; cy = y1
          }
          break
        }
        case 'Z': {
          if (startIdx >= 0 && vertices.length > 0) {
            addEdge(vertices.length - 1, startIdx)
          }
          cx = startX; cy = startY
          break
        }
      }
      prevCmd = type.toUpperCase()
    }
  }

  // Parse basic shapes
  function parseElement(el) {
    const tag = el.tagName.toLowerCase()
    switch (tag) {
      case 'path': {
        const d = el.getAttribute('d')
        if (d) parsePath(d)
        break
      }
      case 'line': {
        const a = addPoint(+el.getAttribute('x1') || 0, +el.getAttribute('y1') || 0)
        const b = addPoint(+el.getAttribute('x2') || 0, +el.getAttribute('y2') || 0)
        addEdge(a, b)
        break
      }
      case 'rect': {
        const x = +el.getAttribute('x') || 0, y = +el.getAttribute('y') || 0
        const w = +el.getAttribute('width') || 0, h = +el.getAttribute('height') || 0
        const a = addPoint(x, y), b = addPoint(x + w, y)
        const c = addPoint(x + w, y + h), d = addPoint(x, y + h)
        addEdge(a, b); addEdge(b, c); addEdge(c, d); addEdge(d, a)
        break
      }
      case 'circle': {
        const cx = +el.getAttribute('cx') || 0, cy = +el.getAttribute('cy') || 0
        const r = +el.getAttribute('r') || 0
        const n = 32
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2
          addPoint(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
          if (i > 0) addEdge(vertices.length - 2, vertices.length - 1)
        }
        addEdge(vertices.length - 1, vertices.length - n)
        break
      }
      case 'ellipse': {
        const cx = +el.getAttribute('cx') || 0, cy = +el.getAttribute('cy') || 0
        const rx = +el.getAttribute('rx') || 0, ry = +el.getAttribute('ry') || 0
        const n = 32
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2
          addPoint(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry)
          if (i > 0) addEdge(vertices.length - 2, vertices.length - 1)
        }
        addEdge(vertices.length - 1, vertices.length - n)
        break
      }
      case 'polygon':
      case 'polyline': {
        const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number)
        const first = vertices.length
        for (let i = 0; i < pts.length - 1; i += 2) {
          addPoint(pts[i], pts[i + 1])
          if (i > 0) addEdge(vertices.length - 2, vertices.length - 1)
        }
        if (tag === 'polygon' && vertices.length > first) {
          addEdge(vertices.length - 1, first)
        }
        break
      }
    }
  }

  // Walk all shape elements
  const shapeEls = svg.querySelectorAll('path, line, rect, circle, ellipse, polygon, polyline')
  shapeEls.forEach(parseElement)

  return { vertices, edges, aspect }
}

// Built-in SVG library — loaded from public/kol-vector/
const VECTOR_FILES = [
  'form-01', 'form-02', 'form-03', 'form-04', 'form-05', 'form-06', 'form-07',
  'form-08', 'form-09', 'form-10', 'form-11', 'form-12', 'form-13',
  'shape-00', 'shape-01', 'shape-01-1', 'shape-01-2', 'shape-01-3', 'shape-01-4', 'shape-01-5',
]

async function loadBuiltinLibrary() {
  const entries = []
  for (const name of VECTOR_FILES) {
    try {
      const res = await fetch(`/kol-vector/${name}.svg`)
      if (!res.ok) continue
      const text = await res.text()
      entries.push({ name, data: parseSVG(text) })
    } catch (_) {}
  }
  return entries
}

function SVGPanel({ enabled, onToggle, current, names, onSelect, scale, onScaleChange, id, outputRef, clrRef, penRef, sclRef, onLoad }) {
  const btnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 3, borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'transparent', cursor: 'pointer',
    color: 'rgba(255,255,255,0.3)',
  }

  return (
    <Module label="SVG" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', height: '100%', padding: '4px 4px', gap: 6 }}>

        {/* Left: scl knob + dropdown + buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0, height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Dropdown value={current || 'library'} options={names} onChange={onSelect} />
            <button className="kol-helper-xxxs" style={{ ...btnStyle }} onClick={onLoad}>Load</button>
            <button className="kol-helper-xxxs" style={{ ...btnStyle }} onClick={() => onSelect(null)}>Clr</button>
          </div>
          <CvKnob port="scl" moduleId={id} signalRef={sclRef} value={scale} onChange={onScaleChange} label="scale" variant="row-right" direction="horizontal" />
        </div>

        {/* Right: jacks */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <LabeledJack type="in" port="clr" moduleId={id} signalRef={clrRef} label="clr" />
          <LabeledJack type="in" port="pen" moduleId={id} signalRef={penRef} label="pen" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outputRef} label="out" />
        </div>

      </div>
    </Module>
  )
}

export default function SVGModule({ id = 'svg1', init, preview }) {
  if (preview) return <SVGPanel enabled={false} onToggle={() => {}} current={null} names={[]} onSelect={() => {}} scale={50} onScaleChange={() => {}} id={id} outputRef={{ current: null }} clrRef={{ current: null }} penRef={{ current: null }} sclRef={{ current: null }} onLoad={() => {}} />

  const [enabled, setEnabled] = useModuleEnabled()
  const [scale, setScale] = useState(init?.scale ?? 50)
  const [svgLib, setSvgLib] = useState([]) // { name, data: parsedSVG }
  const [currentName, setCurrentName] = useState(null)

  // Load built-in library on mount
  useEffect(() => {
    loadBuiltinLibrary().then(entries => {
      if (entries.length) setSvgLib(entries)
    })
  }, [])

  const enabledRef = useRef(true)
  const scaleRef = useRef(50)
  const outputRef = useRef(null)
  const clrRef = useRef(null)
  const penRef = useRef(null)
  const sclRef = useRef(null)
  const parsedRef = useRef(null) // current parsed SVG data
  const fileRef = useRef(null)

  enabledRef.current = enabled
  scaleRef.current = scale

  const names = svgLib.map(s => s.name)

  const handleSelect = useCallback((name) => {
    if (!name) { setCurrentName(null); parsedRef.current = null; return }
    const entry = svgLib.find(s => s.name === name)
    if (entry) { setCurrentName(name); parsedRef.current = entry.data }
  }, [svgLib])

  const handleLoad = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const parsed = parseSVG(text)
      const name = file.name.replace(/\.svg$/i, '')
      setSvgLib(prev => {
        const exists = prev.findIndex(s => s.name === name)
        if (exists >= 0) {
          const updated = [...prev]
          updated[exists] = { name, data: parsed }
          return updated
        }
        return [...prev, { name, data: parsed }]
      })
      setCurrentName(name)
      parsedRef.current = parsed
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const saveStateRef = useRef({})
  saveStateRef.current = { scale, currentName }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      clr: { type: 'color' },
      pen: { type: 'pen' },
      scl: { type: 'scalar', cv: 'offset' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs) => {
      if (!enabledRef.current || !parsedRef.current) {
        outputRef.current = null
        return { out: null }
      }

      const parsed = parsedRef.current
      const s = readCv(inputs.scl, scaleRef.current) / 50

      // Scale vertices around center (0.5, 0.5) — output as {x,y} objects for drawSignal
      const scaled = parsed.vertices.map(([x, y]) => ({
        x: 0.5 + (x - 0.5) * s,
        y: 0.5 + (y - 0.5) * s,
      }))

      const out = points(scaled, parsed.edges)
      out.aspectLock = true
      out.strokeWidth = 1

      // Color from CLR input
      if (inputs.clr?.type === 'color') out.color = inputs.clr.value
      clrRef.current = inputs.clr

      // Pen passthrough
      penRef.current = inputs.pen

      outputRef.current = out
      return { out }
    },
  })

  return (
    <>
      <input ref={fileRef} type="file" accept=".svg,image/svg+xml" style={{ display: 'none' }} onChange={handleFile} />
      <SVGPanel
        enabled={enabled}
        onToggle={() => setEnabled(!enabled)}
        current={currentName}
        names={names}
        onSelect={handleSelect}
        scale={scale}
        onScaleChange={setScale}
        id={id}
        outputRef={outputRef}
        clrRef={clrRef}
        penRef={penRef}
        sclRef={sclRef}
        onLoad={handleLoad}
      />
    </>
  )
}
