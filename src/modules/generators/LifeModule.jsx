// LifeModule — Conway's Game of Life cellular automaton
// 12HP 3U. Built-in canvas preview. CLK/RST/CLR inputs, points output.
// RULE knob sweeps through automata rulesets (center = classic B3/S23).

import { useState, useRef, useEffect } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Toggle from '../controls/Toggle'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

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

function step(grid, cols, rows, rule, wrap) {
  const next = new Uint8Array(cols * rows)
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
          count += grid[ny * cols + nx]
        }
      }
      const alive = grid[y * cols + x]
      if (alive) {
        next[y * cols + x] = surviveSet.includes(count) ? 1 : 0
      } else {
        next[y * cols + x] = birthSet.includes(count) ? 1 : 0
      }
    }
  }
  return next
}

function gridToPoints(grid, cols, rows) {
  const pts = []
  const edges = []
  const margin = 0.02
  const cellW = (1 - margin * 2) / cols
  const cellH = (1 - margin * 2) / rows
  const inset = 0.15
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!grid[y * cols + x]) continue
      const cx = margin + (x + 0.5) * cellW
      const cy = margin + (y + 0.5) * cellH
      const hw = cellW * (1 - inset) * 0.5
      const hh = cellH * (1 - inset) * 0.5
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
  dnsConn, dnsRef, szConn, szRef, spdConn, spdRef, ruleConn, ruleRef,
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
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
          }}
        />

        {/* Rule label */}
        <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.5, fontFamily: 'monospace', lineHeight: 1 }}>
          {ruleName}
        </div>

        {/* Knobs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <CvKnob port="zoom" moduleId={id} value={zoom} onChange={onZoomChange} label="zoom" direction="vertical" />
          <CvKnob port="dns" moduleId={id} active={dnsConn} signalRef={dnsRef} value={density} onChange={onDensityChange} label="dns" direction="vertical" />
          <CvKnob port="res" moduleId={id} active={szConn} signalRef={szRef} value={size} onChange={onSizeChange} label="res" direction="vertical" />
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
    dnsConn={false} dnsRef={{ current: null }} szConn={false} szRef={{ current: null }}
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
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  const showRef = useRef(true)
  const wrapRef = useRef(true)
  const densityRef = useRef(30)
  const sizeRef = useRef(50)
  const speedRef = useRef(50)
  const ruleRef = useRef(44)
  const zoomRef = useRef(50)
  const gridRef = useRef(null)
  const gridDimsRef = useRef({ cols: 0, rows: 0 })
  const accumRef = useRef(0)
  const prevClkRef = useRef(false)
  const prevRstRef = useRef(false)
  const needsSeedRef = useRef('density')

  const canvasRef = useRef(null)
  const outRef = useRef(null)
  const dnsCvRef = useRef(null)
  const szCvRef = useRef(null)
  const spdCvRef = useRef(null)
  const ruleCvRef = useRef(null)
  const clkCvRef = useRef(null)
  const rstCvRef = useRef(null)
  const clrCvRef = useRef(null)
  const clrColorRef = useRef(null)

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

  const conns = routing?.connections || []
  const dnsConn = conns.some(c => c.toModuleId === id && c.toPort === 'dns')
  const szConn = conns.some(c => c.toModuleId === id && c.toPort === 'sz')
  const spdConn = conns.some(c => c.toModuleId === id && c.toPort === 'spd')
  const ruleConn = conns.some(c => c.toModuleId === id && c.toPort === 'rule')
  const clkConn = conns.some(c => c.toModuleId === id && c.toPort === 'clk')
  const rstConn = conns.some(c => c.toModuleId === id && c.toPort === 'rst')
  const clrConn = conns.some(c => c.toModuleId === id && c.toPort === 'clr')

  const rule = getRule(ruleVal)

  useModule({
    id,
    inputs: {
      dns: { type: 'scalar' }, sz: { type: 'scalar' }, spd: { type: 'scalar' },
      rule: { type: 'scalar' }, clk: { type: 'scalar' }, rst: { type: 'scalar' },
      clr: { type: 'color' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }

      dnsCvRef.current = inputs.dns
      szCvRef.current = inputs.sz
      spdCvRef.current = inputs.spd
      ruleCvRef.current = inputs.rule
      clkCvRef.current = inputs.clk
      rstCvRef.current = inputs.rst
      clrCvRef.current = inputs.clr

      const vDensity = (inputs.dns ? readScalar(inputs.dns) : densityRef.current) / 100
      const vSize = 8 + Math.round(((inputs.sz ? readScalar(inputs.sz) : sizeRef.current) / 100) * 248)
      const vSpeed = (inputs.spd ? readScalar(inputs.spd) : speedRef.current) / 50
      const vRule = getRule(inputs.rule ? readScalar(inputs.rule) : ruleRef.current)

      // Color input
      if (inputs.clr?.type === 'color') {
        const { r, g, b } = inputs.clr.value
        clrColorRef.current = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
      } else {
        clrColorRef.current = null
      }

      // RST trigger
      const rstHigh = readScalar(inputs.rst) > 50
      if (rstHigh && !prevRstRef.current) needsSeedRef.current = 'density'
      prevRstRef.current = rstHigh

      // Resize grid if needed
      const cols = vSize, rows = vSize
      if (needsSeedRef.current) {
        gridRef.current = needsSeedRef.current === 'auto'
          ? autoReseed(cols, rows, vRule)
          : createGrid(cols, rows, vDensity)
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
        gridDimsRef.current = { cols, rows }
      }

      // CLK: external tick
      const clkHigh = readScalar(inputs.clk) > 50
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

      if (doStep && gridRef.current) {
        gridRef.current = step(gridRef.current, cols, rows, vRule, wrapRef.current)
        // Auto-reseed if grid is completely dead
        let alive = 0
        for (let i = 0; i < gridRef.current.length; i++) alive += gridRef.current[i]
        if (alive === 0) gridRef.current = autoReseed(cols, rows, vRule)
      }

      // Output points
      if (gridRef.current) {
        const { pts, edges } = gridToPoints(gridRef.current, cols, rows)
        const out = points(pts, edges)
        out.fill = true
        out.aspectLock = true
        if (inputs.clr?.type === 'color') out.color = inputs.clr.value
        outRef.current = out
        return { out }
      }

      outRef.current = null
      return { out: null }
    },
  })

  // Fixed canvas resolution — immune to CSS zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 160
    canvas.height = 160
  }, [])

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      if (!w || !h) { raf = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, w, h)

      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1)
      }

      if (gridRef.current && enabledRef.current && showRef.current) {
        const { cols, rows } = gridDimsRef.current
        drawLife(ctx, gridRef.current, cols, rows, w, h, clrColorRef.current, zoomRef.current)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <LifePanel
    canvasRef={canvasRef} wrap={wrap} show={show} density={density} size={size} speed={speed}
    ruleVal={ruleVal} ruleName={rule.name} zoom={zoom}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onWrapChange={setWrap} onShowChange={setShow} onDensityChange={setDensity} onSizeChange={setSize}
    onSpeedChange={setSpeed} onRuleChange={handleRule} onZoomChange={setZoom} onSeedA={handleSeedA} onSeedB={handleSeedB}
    dnsConn={dnsConn} dnsRef={dnsCvRef} szConn={szConn} szRef={szCvRef}
    spdConn={spdConn} spdRef={spdCvRef} ruleConn={ruleConn} ruleRef={ruleCvRef}
    clkConn={clkConn} clkRef={clkCvRef} rstConn={rstConn} rstRef={rstCvRef}
    clrConn={clrConn} clrRef={clrCvRef} outRef={outRef}
  />
}
