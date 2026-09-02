// LifeModule — Conway's Game of Life cellular automaton
// 12HP 3U. Built-in canvas preview. CLK/RST/CLR inputs, points output.
// RULE knob sweeps through automata rulesets (center = classic B3/S23).

import { useState, useRef } from 'react'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import CvKnob from '../parametric/CvKnob'
import Toggle from '../parametric/Toggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

// --- Cellular automata rulesets ---
// Format: { birth: Set, survive: Set }
// Knob sweeps through these from 0→100
const RULESETS = [
  { name: 'Seeds',      birth: [2],       survive: [] },
  { name: 'Diamoeba',   birth: [3,5,6,7,8], survive: [5,6,7,8] },
  { name: 'Day & Night', birth: [3,6,7,8], survive: [3,4,6,7,8] },
  { name: 'Maze',       birth: [3],        survive: [1,2,3,4,5] },
  { name: 'Life',       birth: [3],        survive: [2,3] },
  { name: 'HighLife',   birth: [3,6],      survive: [2,3] },
  { name: 'Morley',     birth: [3,6,8],    survive: [2,4,5] },
  { name: 'Anneal',     birth: [4,6,7,8],  survive: [3,5,6,7,8] },
  { name: 'Replicator', birth: [1,3,5,7],  survive: [1,3,5,7] },
]

function getRule(knobValue) {
  const idx = Math.round((knobValue / 100) * (RULESETS.length - 1))
  return RULESETS[Math.max(0, Math.min(idx, RULESETS.length - 1))]
}

// --- Simulation ---

// Known long-lived patterns for classic Life (relative coords)
const METHUSELAHS = [
  // R-pentomino — runs 1103 generations
  [[0,0],[1,0],[-1,1],[0,1],[0,2]],
  // Acorn — runs 5206 generations
  [[0,0],[1,0],[1,2],[3,1],[4,0],[5,0],[6,0]],
  // Diehard — runs 130 generations then dies, but interesting
  [[0,0],[1,0],[1,1],[5,1],[6,1],[7,1],[6,-1]],
  // Pi-heptomino — runs 173 generations
  [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[2,2]],
]

function stampPattern(grid, cols, rows, pattern, cx, cy) {
  for (const [dx, dy] of pattern) {
    const x = cx + dx, y = cy + dy
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      grid[y * cols + x] = 1
    }
  }
}

function createGrid(cols, rows, density) {
  const grid = new Uint8Array(cols * rows)
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < density ? 1 : 0
  }
  return grid
}

function autoReseed(cols, rows, rule) {
  const grid = new Uint8Array(cols * rows)
  const isLife = rule.birth.length === 1 && rule.birth[0] === 3 &&
    rule.survive.length === 2 && rule.survive[0] === 2 && rule.survive[1] === 3
  if (isLife) {
    // Place 2-4 random methuselahs at random positions in central area
    const count = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const pattern = METHUSELAHS[Math.floor(Math.random() * METHUSELAHS.length)]
      const cx = Math.floor(cols * 0.25 + Math.random() * cols * 0.5)
      const cy = Math.floor(rows * 0.25 + Math.random() * rows * 0.5)
      stampPattern(grid, cols, rows, pattern, cx, cy)
    }
  } else {
    // Clustered blobs — 3-6 random clusters in central area
    const count = 3 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const cx = Math.floor(cols * 0.2 + Math.random() * cols * 0.6)
      const cy = Math.floor(rows * 0.2 + Math.random() * rows * 0.6)
      const r = 2 + Math.floor(Math.random() * 4)
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue
          if (Math.random() > 0.5) continue
          const x = cx + dx, y = cy + dy
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[y * cols + x] = 1
          }
        }
      }
    }
  }
  return grid
}

function step(src, dst, cols, rows, rule, wrap) {
  const birthSet = rule.birth
  const surviveSet = rule.survive
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          let nx = x + dx, ny = y + dy
          if (wrap) {
            nx = (nx + cols) % cols
            ny = (ny + rows) % rows
          } else {
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue
          }
          count += src[ny * cols + nx]
        }
      }
      const alive = src[y * cols + x]
      if (alive) {
        dst[y * cols + x] = surviveSet.includes(count) ? 1 : 0
      } else {
        dst[y * cols + x] = birthSet.includes(count) ? 1 : 0
      }
    }
  }
}

function gridToPoints(grid, cols, rows, zoom = 0) {
  const pts = []
  const edges = []
  const margin = 0.02
  const cellW = (1 - margin * 2) / cols
  const cellH = (1 - margin * 2) / rows
  // Visible gap between adjacent cells so 2x2 / 3x3 clusters read as distinct blocks,
  // not merged blobs. Matches Life preview's ~1-px per cluster separation.
  const inset = 0.18
  const scale = 1 + (zoom / 100) * 3
  const hw = cellW * scale * (1 - inset) * 0.5
  const hh = cellH * scale * (1 - inset) * 0.5
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!grid[y * cols + x]) continue
      const cx0 = margin + (x + 0.5) * cellW
      const cy0 = margin + (y + 0.5) * cellH
      // Scale around [0.5, 0.5] to match drawLife preview.
      const cx = 0.5 + (cx0 - 0.5) * scale
      const cy = 0.5 + (cy0 - 0.5) * scale
      // Skip cells fully outside the [0, 1] unit square.
      if (cx + hw < 0 || cx - hw > 1 || cy + hh < 0 || cy - hh > 1) continue
      const base = pts.length
      pts.push({ x: cx - hw, y: cy - hh })
      pts.push({ x: cx + hw, y: cy - hh })
      pts.push({ x: cx + hw, y: cy + hh })
      pts.push({ x: cx - hw, y: cy + hh })
      edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
    }
  }
  return { pts, edges }
}

// --- Canvas drawing ---

function drawLife(ctx, grid, cols, rows, w, h, color, zoom) {
  const scale = 1 + (zoom / 100) * 3
  const totalW = w * scale
  const totalH = h * scale
  const ox = (w - totalW) / 2
  const oy = (h - totalH) / 2
  const cellW = totalW / cols
  const cellH = totalH / rows
  ctx.fillStyle = color || '#2ecc71'
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!grid[y * cols + x]) continue
      const px = ox + x * cellW + 0.5
      const py = oy + y * cellH + 0.5
      if (px + cellW < 0 || px > w || py + cellH < 0 || py > h) continue
      ctx.fillRect(px, py, cellW - 1, cellH - 1)
    }
  }
}

// --- UI ---

function LifePanel({
  canvasRef, wrap, show, density, size, speed, ruleVal, ruleName, zoom,
  enabled, onToggle, id,
  onWrapChange, onShowChange, onDensityChange, onSizeChange, onSpeedChange, onRuleChange, onZoomChange,
  onSeedA, onSeedB,
  zoomConn, zoomRef, dnsConn, dnsRef, resConn, resRef, spdConn, spdRef, ruleConn, ruleRef,
  clkConn, clkRef, rstConn, rstRef, clrConn, clrRef, outRef,
}) {
  return (
    <Module label="Life" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4, padding: '2px 4px' }}>

        {/* Canvas preview */}
        <canvas
          ref={canvasRef}
          width={160}
          height={100}
          onClick={onSeedA}
          style={{
            flex: 1,
            width: '100%',
            borderRadius: 2,
            border: '1px solid var(--kol-fg-08)',
            cursor: 'pointer',
          }}
        />

        {/* Rule label */}
        <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.5, fontFamily: 'monospace', lineHeight: 1 }}>
          {ruleName}
        </div>

        {/* Knobs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <CvKnob port="zoom" moduleId={id} active={zoomConn} signalRef={zoomRef} value={zoom} onChange={onZoomChange} label="zoom" direction="vertical" />
          <CvKnob port="dns" moduleId={id} active={dnsConn} signalRef={dnsRef} value={density} onChange={onDensityChange} label="dns" direction="vertical" />
          <CvKnob port="res" moduleId={id} active={resConn} signalRef={resRef} value={size} onChange={onSizeChange} label="res" direction="vertical" />
          <CvKnob port="spd" moduleId={id} active={spdConn} signalRef={spdRef} value={speed} onChange={onSpeedChange} label="spd" direction="vertical" />
          <CvKnob port="rule" moduleId={id} active={ruleConn} signalRef={ruleRef} value={ruleVal} onChange={onRuleChange} label="rule" direction="vertical" />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Toggle value={wrap} onChange={onWrapChange} label="wrap" size="sm" horizontal />
          <Toggle momentary onChange={onSeedA} label="seda" size="sm" horizontal />
          <Toggle momentary onChange={onSeedB} label="sedb" size="sm" horizontal />
          <Toggle value={show} onChange={onShowChange} label="show" size="sm" horizontal />
        </div>

        {/* I/O */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkRef} label="clk" />
          <LabeledJack type="in" port="rst" moduleId={id} active={rstConn} signalRef={rstRef} label="rst" />
          <LabeledJack type="in" port="clr" moduleId={id} active={clrConn} signalRef={clrRef} label="clr" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

// --- Module ---

export default function LifeModule({ id = 'life1', init, preview }) {
  if (preview) return <LifePanel
    canvasRef={{ current: null }} wrap={true} show={true} density={30} size={50} speed={50} ruleVal={44} ruleName="Life" zoom={0}
    enabled={false} onToggle={() => {}} id={id}
    onWrapChange={() => {}} onShowChange={() => {}} onDensityChange={() => {}} onSizeChange={() => {}} onSpeedChange={() => {}} onRuleChange={() => {}} onZoomChange={() => {}} onSeedA={() => {}} onSeedB={() => {}}
    zoomConn={false} zoomRef={{ current: null }} dnsConn={false} dnsRef={{ current: null }} resConn={false} resRef={{ current: null }}
    spdConn={false} spdRef={{ current: null }} ruleConn={false} ruleRef={{ current: null }}
    clkConn={false} clkRef={{ current: null }} rstConn={false} rstRef={{ current: null }}
    clrConn={false} clrRef={{ current: null }} outRef={{ current: null }}
  />

  const [wrap, setWrap] = useState(init?.wrap ?? true)
  const [show, setShow] = useState(init?.show ?? true)
  const [density, setDensity] = useState(init?.density ?? 30)
  const [size, setSize] = useState(init?.size ?? 50)
  const [speed, setSpeed] = useState(init?.speed ?? 50)
  const [ruleVal, setRuleVal] = useState(init?.rule ?? 44) // ~center = classic Life
  const [zoom, setZoom] = useState(init?.zoom ?? 50)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const showRef = useRef(true)
  const wrapRef = useRef(true)
  const densityRef = useRef(30)
  const sizeRef = useRef(50)
  const speedRef = useRef(50)
  const ruleRef = useRef(44)
  const zoomRef = useRef(50)
  const gridRef = useRef(null)
  const gridNextRef = useRef(null)
  const gridDimsRef = useRef({ cols: 0, rows: 0 })
  const accumRef = useRef(0)
  const prevClkRef = useRef(false)
  const prevRstRef = useRef(false)
  const needsSeedRef = useRef('density')

  const canvasRef = useRef(null)
  const outRef = useRef(null)
  const zoomCvRef = useRef(null)
  const dnsCvRef = useRef(null)
  const resCvRef = useRef(null)
  const spdCvRef = useRef(null)
  const ruleCvRef = useRef(null)
  const clkCvRef = useRef(null)
  const rstCvRef = useRef(null)
  const clrCvRef = useRef(null)
  const clrColorRef = useRef(null)
  // Tracks the CV-merged zoom value so the preview canvas reflects modulation, not just the knob.
  const effectiveZoomRef = useRef(50)

  enabledRef.current = enabled
  showRef.current = show
  wrapRef.current = wrap
  densityRef.current = density
  sizeRef.current = size
  speedRef.current = speed
  ruleRef.current = ruleVal
  zoomRef.current = zoom

  const handleSeedA = () => { needsSeedRef.current = 'density' }
  const handleSeedB = () => { needsSeedRef.current = 'auto' }
  const handleRule = (v) => {
    const step = 100 / (RULESETS.length - 1)
    setRuleVal(Math.round(Math.round(v / step) * step))
  }

  const zoomConn = cp.has('zoom')
  const dnsConn = cp.has('dns')
  const resConn = cp.has('res')
  const spdConn = cp.has('spd')
  const ruleConn = cp.has('rule')
  const clkConn = cp.has('clk')
  const rstConn = cp.has('rst')
  const clrConn = cp.has('clr')

  const rule = getRule(ruleVal)

  const saveStateRef = useRef({})
  saveStateRef.current = { wrap, show, density, size, speed, ruleVal, zoom }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      zoom: { type: 'scalar', cv: 'offset' },
      dns: { type: 'scalar', cv: 'offset' }, res: { type: 'scalar', cv: 'offset' }, spd: { type: 'scalar', cv: 'offset' },
      rule: { type: 'scalar', cv: 'offset' }, clk: { type: 'scalar' }, rst: { type: 'scalar' },
      clr: { type: 'color' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }

      zoomCvRef.current = inputs.zoom
      dnsCvRef.current = inputs.dns
      resCvRef.current = inputs.res
      spdCvRef.current = inputs.spd
      ruleCvRef.current = inputs.rule
      clkCvRef.current = inputs.clk
      rstCvRef.current = inputs.rst
      clrCvRef.current = inputs.clr

      const vZoom = readCv(inputs.zoom, zoomRef.current)
      effectiveZoomRef.current = vZoom
      const vDensity = readCv(inputs.dns, densityRef.current) / 100
      const vSize = 8 + Math.round((readCv(inputs.res, sizeRef.current) / 100) * 248)
      const vSpeed = readCv(inputs.spd, speedRef.current) / 50
      const vRule = getRule(readCv(inputs.rule, ruleRef.current))

      // Color input
      if (inputs.clr?.type === 'color') {
        const { r, g, b } = inputs.clr.value
        clrColorRef.current = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
      } else {
        clrColorRef.current = null
      }

      // RST trigger
      const rstHigh = readScalar(inputs.rst) > 0
      if (rstHigh && !prevRstRef.current) needsSeedRef.current = 'density'
      prevRstRef.current = rstHigh

      // Resize grid if needed
      const cols = vSize, rows = vSize
      if (needsSeedRef.current) {
        gridRef.current = needsSeedRef.current === 'auto'
          ? autoReseed(cols, rows, vRule)
          : createGrid(cols, rows, vDensity)
        gridNextRef.current = new Uint8Array(cols * rows)
        gridDimsRef.current = { cols, rows }
        needsSeedRef.current = false
        accumRef.current = 0
      } else if (cols !== gridDimsRef.current.cols || rows !== gridDimsRef.current.rows) {
        // Preserve pattern: copy old cells centered in new grid
        const oldGrid = gridRef.current
        const oldCols = gridDimsRef.current.cols
        const oldRows = gridDimsRef.current.rows
        const newGrid = new Uint8Array(cols * rows)
        const ox = Math.floor((cols - oldCols) / 2)
        const oy = Math.floor((rows - oldRows) / 2)
        for (let y = 0; y < oldRows; y++) {
          for (let x = 0; x < oldCols; x++) {
            const nx = x + ox, ny = y + oy
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              newGrid[ny * cols + nx] = oldGrid[y * oldCols + x]
            }
          }
        }
        gridRef.current = newGrid
        gridNextRef.current = new Uint8Array(cols * rows)
        gridDimsRef.current = { cols, rows }
      }

      // CLK: external tick
      const clkHigh = readScalar(inputs.clk) > 0
      let doStep = false
      if (inputs.clk) {
        if (clkHigh && !prevClkRef.current) doStep = true
        prevClkRef.current = clkHigh
      } else {
        // Internal clock: speed knob controls generations per second
        const gensPerSec = 0.5 + vSpeed * 15
        accumRef.current += dt * gensPerSec
        if (accumRef.current >= 1) {
          doStep = true
          accumRef.current -= 1
        }
      }

      if (doStep && gridRef.current && gridNextRef.current) {
        step(gridRef.current, gridNextRef.current, cols, rows, vRule, wrapRef.current)
        const swap = gridRef.current
        gridRef.current = gridNextRef.current
        gridNextRef.current = swap
        // Auto-reseed if grid is completely dead
        let alive = 0
        for (let i = 0; i < gridRef.current.length; i++) alive += gridRef.current[i]
        if (alive === 0) gridRef.current = autoReseed(cols, rows, vRule)
      }

      // Output points
      if (gridRef.current) {
        const { pts, edges } = gridToPoints(gridRef.current, cols, rows, vZoom)
        const out = points(pts, edges)
        out.fill = true
        // Crisp blocks — skip the pen's round-capped stroke that was blooming each cell.
        out.stroke = false
        // Default to Life's preview green (SCOPE green) so downstream displays
        // match the in-module canvas unless CLR overrides.
        out.color = inputs.clr?.type === 'color'
          ? inputs.clr.value
          : { r: 0.18, g: 0.8, b: 0.44, a: 1 }
        outRef.current = out
        return { out }
      }

      outRef.current = null
      return { out: null }
    },
  })

  useCanvasLoop(canvasRef, () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    if (!w || !h) return

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#080808'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)

    if (gridRef.current && enabledRef.current && showRef.current) {
      const { cols, rows } = gridDimsRef.current
      drawLife(ctx, gridRef.current, cols, rows, w, h, clrColorRef.current, effectiveZoomRef.current)
    }
  })

  return <LifePanel
    canvasRef={canvasRef} wrap={wrap} show={show} density={density} size={size} speed={speed}
    ruleVal={ruleVal} ruleName={rule.name} zoom={zoom}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onWrapChange={setWrap} onShowChange={setShow} onDensityChange={setDensity} onSizeChange={setSize}
    onSpeedChange={setSpeed} onRuleChange={handleRule} onZoomChange={setZoom} onSeedA={handleSeedA} onSeedB={handleSeedB}
    zoomConn={zoomConn} zoomRef={zoomCvRef} dnsConn={dnsConn} dnsRef={dnsCvRef} resConn={resConn} resRef={resCvRef}
    spdConn={spdConn} spdRef={spdCvRef} ruleConn={ruleConn} ruleRef={ruleCvRef}
    clkConn={clkConn} clkRef={clkCvRef} rstConn={rstConn} rstRef={rstCvRef}
    clrConn={clrConn} clrRef={clrCvRef} outRef={outRef}
  />
}
