// DitherModule — dither/ASCII pattern processor
// 14HP 3U. Engine mode (grid/hex/radial) + Filter mode (halftone/flow/crosshatch/CRT/glitch/melt).
// Shape/ASCII toggle: shapes use selected geometric primitive, ASCII maps brightness to character density.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import IconButton from '../controls/IconButton'
import IconSelect from '../controls/IconSelect'
import LabeledControl from '../controls/LabeledControl'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

// --- Mode definitions ---

const ENGINE_MODES = [
  { value: 'grid', icon: 'dith-grid', text: 'grid' },
  { value: 'hex', icon: 'dith-hex', text: 'hex' },
  { value: 'radial', icon: 'dith-radial', text: 'rad' },
]

const FILTER_MODES = [
  { value: 'halftone', icon: 'dith-htone', text: 'htn' },
  { value: 'flow', icon: 'dith-flow', text: 'flw' },
  { value: 'crosshatch', icon: 'dith-xhatch', text: 'xht' },
  { value: 'crt', icon: 'dith-crt', text: 'crt' },
  { value: 'glitch', icon: 'dith-glitch', text: 'gli' },
  { value: 'melt', icon: 'dith-melt', text: 'mlt' },
]

// --- Shape library ---

const SHAPE_LIST = ['circle', 'rect', 'tri', 'oct', 'star', 'cross', 'hex', 'diamond', 'gear', 'flower']

const SHAPE_ITEMS = [
  { value: 'circle', icon: 'radial-circle' },
  { value: 'rect', icon: 'radial-rect' },
  { value: 'tri', icon: 'radial-triangle' },
  { value: 'oct', icon: 'shape-octa' },
  { value: 'star', icon: 'radial-star' },
  { value: 'cross', icon: 'dith-cross' },
  { value: 'hex', icon: 'radial-hex' },
  { value: 'diamond', icon: 'dith-diamond' },
  { value: 'gear', icon: 'dith-gear' },
  { value: 'flower', icon: 'dith-flower' },
]

// --- ASCII characters ordered by visual density (sparse → dense) ---

const ASCII_ITEMS = [
  { value: 'dot', icon: 'ascii-dot' },
  { value: 'dash', icon: 'ascii-dash' },
  { value: 'pipe', icon: 'ascii-pipe' },
  { value: 'slash', icon: 'ascii-slash' },
  { value: 'back', icon: 'ascii-back' },
  { value: 'equal', icon: 'ascii-equal' },
  { value: 'plus', icon: 'ascii-plus' },
  { value: 'x', icon: 'ascii-x' },
  { value: 'hash', icon: 'ascii-hash' },
  { value: 'block', icon: 'ascii-block' },
]

const ASCII_DENSITY_ORDER = ASCII_ITEMS.map(i => i.value)

// --- Geometry helpers ---

function addRotatedPoly(pts, edges, cx, cy, verts, cos, sin) {
  const base = pts.length
  for (const [vx, vy] of verts) {
    pts.push({ x: cx + cos * vx - sin * vy, y: cy + sin * vx + cos * vy })
  }
  const n = verts.length
  for (let i = 0; i < n; i++) edges.push([base + i, base + (i + 1) % n])
}

function addRotatedLine(pts, edges, cx, cy, x1, y1, x2, y2, cos, sin) {
  const b = pts.length
  pts.push(
    { x: cx + cos * x1 - sin * y1, y: cy + sin * x1 + cos * y1 },
    { x: cx + cos * x2 - sin * y2, y: cy + sin * x2 + cos * y2 },
  )
  edges.push([b, b + 1])
}

// --- Shape geometry generators ---

function addShape(pts, edges, cx, cy, r, type, rot) {
  if (r < 0.001) return
  const cos = Math.cos(rot), sin = Math.sin(rot)

  switch (type) {
    case 'circle': {
      const v = [], n = 8
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        v.push([Math.cos(a) * r, Math.sin(a) * r])
      }
      addRotatedPoly(pts, edges, cx, cy, v, cos, sin)
      break
    }
    case 'rect':
      addRotatedPoly(pts, edges, cx, cy, [[-r, -r], [r, -r], [r, r], [-r, r]], cos, sin)
      break
    case 'tri':
      addRotatedPoly(pts, edges, cx, cy, [[0, -r], [r * 0.87, r * 0.5], [-r * 0.87, r * 0.5]], cos, sin)
      break
    case 'oct': {
      const v = [], n = 8
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.PI / 8
        v.push([Math.cos(a) * r, Math.sin(a) * r])
      }
      addRotatedPoly(pts, edges, cx, cy, v, cos, sin)
      break
    }
    case 'star': {
      const v = [], spikes = 5
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
        const rad = i % 2 === 0 ? r : r * 0.4
        v.push([Math.cos(a) * rad, Math.sin(a) * rad])
      }
      addRotatedPoly(pts, edges, cx, cy, v, cos, sin)
      break
    }
    case 'cross': {
      const w = r * 0.3
      addRotatedPoly(pts, edges, cx, cy, [
        [-w, -r], [w, -r], [w, -w], [r, -w], [r, w], [w, w],
        [w, r], [-w, r], [-w, w], [-r, w], [-r, -w], [-w, -w],
      ], cos, sin)
      break
    }
    case 'hex': {
      const v = []
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6
        v.push([Math.cos(a) * r, Math.sin(a) * r])
      }
      addRotatedPoly(pts, edges, cx, cy, v, cos, sin)
      break
    }
    case 'diamond':
      addRotatedPoly(pts, edges, cx, cy, [[0, -r], [r, 0], [0, r], [-r, 0]], cos, sin)
      break
    case 'gear': {
      const v = [], teeth = 8
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i / (teeth * 2)) * Math.PI * 2
        const rad = i % 2 === 0 ? r : r * 0.7
        v.push([Math.cos(a) * rad, Math.sin(a) * rad])
      }
      addRotatedPoly(pts, edges, cx, cy, v, cos, sin)
      break
    }
    case 'flower': {
      const petals = 5, res = 6
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2
        const pcx = Math.cos(a) * r * 0.5
        const pcy = Math.sin(a) * r * 0.5
        const v = []
        for (let j = 0; j < res; j++) {
          const pa = (j / res) * Math.PI * 2
          v.push([pcx + Math.cos(pa) * r * 0.4, pcy + Math.sin(pa) * r * 0.4])
        }
        addRotatedPoly(pts, edges, cx, cy, v, cos, sin)
      }
      break
    }
  }
}

// --- ASCII character geometry (line/polygon based) ---

function addAscii(pts, edges, cx, cy, r, charType) {
  if (r < 0.001) return

  switch (charType) {
    case 'dot': {
      // Small circle
      const base = pts.length, segs = 6, sr = r * 0.25
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2
        pts.push({ x: cx + Math.cos(a) * sr, y: cy + Math.sin(a) * sr })
      }
      for (let i = 0; i < segs; i++) edges.push([base + i, base + (i + 1) % segs])
      break
    }
    case 'dash': {
      // Horizontal bar
      const w = r * 0.5, h = r * 0.12
      const base = pts.length
      pts.push({ x: cx - w, y: cy - h }, { x: cx + w, y: cy - h }, { x: cx + w, y: cy + h }, { x: cx - w, y: cy + h })
      edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
      break
    }
    case 'pipe': {
      // Vertical bar
      const w = r * 0.12, h = r * 0.5
      const base = pts.length
      pts.push({ x: cx - w, y: cy - h }, { x: cx + w, y: cy - h }, { x: cx + w, y: cy + h }, { x: cx - w, y: cy + h })
      edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
      break
    }
    case 'plus': {
      // Cross: horizontal + vertical bars
      const w = r * 0.12, l = r * 0.45
      const b1 = pts.length
      pts.push({ x: cx - l, y: cy - w }, { x: cx + l, y: cy - w }, { x: cx + l, y: cy + w }, { x: cx - l, y: cy + w })
      edges.push([b1, b1 + 1], [b1 + 1, b1 + 2], [b1 + 2, b1 + 3], [b1 + 3, b1])
      const b2 = pts.length
      pts.push({ x: cx - w, y: cy - l }, { x: cx + w, y: cy - l }, { x: cx + w, y: cy + l }, { x: cx - w, y: cy + l })
      edges.push([b2, b2 + 1], [b2 + 1, b2 + 2], [b2 + 2, b2 + 3], [b2 + 3, b2])
      break
    }
    case 'x': {
      // Two diagonal lines
      const l = r * 0.4
      let b = pts.length
      pts.push({ x: cx - l, y: cy - l }, { x: cx + l, y: cy + l })
      edges.push([b, b + 1])
      b = pts.length
      pts.push({ x: cx + l, y: cy - l }, { x: cx - l, y: cy + l })
      edges.push([b, b + 1])
      break
    }
    case 'hash': {
      // Grid: 2 horizontal + 2 vertical lines
      const l = r * 0.5, g = r * 0.18
      for (const dy of [-g, g]) {
        const b = pts.length
        pts.push({ x: cx - l, y: cy + dy }, { x: cx + l, y: cy + dy })
        edges.push([b, b + 1])
      }
      for (const dx of [-g, g]) {
        const b = pts.length
        pts.push({ x: cx + dx, y: cy - l }, { x: cx + dx, y: cy + l })
        edges.push([b, b + 1])
      }
      break
    }
    case 'slash': {
      // Forward diagonal
      const l = r * 0.5
      const b = pts.length
      pts.push({ x: cx + l, y: cy - l }, { x: cx - l, y: cy + l })
      edges.push([b, b + 1])
      break
    }
    case 'back': {
      // Backward diagonal
      const l = r * 0.5
      const b = pts.length
      pts.push({ x: cx - l, y: cy - l }, { x: cx + l, y: cy + l })
      edges.push([b, b + 1])
      break
    }
    case 'equal': {
      // Two horizontal lines
      const l = r * 0.5, g = r * 0.15
      let b = pts.length
      pts.push({ x: cx - l, y: cy - g }, { x: cx + l, y: cy - g })
      edges.push([b, b + 1])
      b = pts.length
      pts.push({ x: cx - l, y: cy + g }, { x: cx + l, y: cy + g })
      edges.push([b, b + 1])
      break
    }
    case 'block': {
      // Filled square
      const s = r * 0.45, base = pts.length
      pts.push({ x: cx - s, y: cy - s }, { x: cx + s, y: cy - s }, { x: cx + s, y: cy + s }, { x: cx - s, y: cy + s })
      edges.push([base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base])
      break
    }
  }
}

// --- Grid layouts (return {cells: [{nx, ny}], cellSize}) ---

function layoutGrid(count) {
  const cells = []
  const step = 1 / count
  const pad = 2
  for (let gy = -pad; gy < count + pad; gy++) {
    for (let gx = -pad; gx < count + pad; gx++) {
      cells.push({ nx: (gx + 0.5) * step, ny: (gy + 0.5) * step })
    }
  }
  return { cells, cellSize: step }
}

function layoutHex(count) {
  const cells = []
  const step = 1 / count
  const rowH = step * 0.866
  const rows = Math.ceil(1 / rowH)
  const pad = 2
  for (let gy = -pad; gy < rows + pad; gy++) {
    const offset = gy % 2 === 0 ? 0 : step * 0.5
    const cols = count + pad * 2
    for (let gx = -pad; gx < count + pad; gx++) {
      cells.push({ nx: (gx + 0.5) * step + offset, ny: gy * rowH + rowH * 0.5 })
    }
  }
  return { cells, cellSize: step }
}

function layoutRadial(count) {
  const cells = []
  const cx = 0.5, cy = 0.5
  const maxR = 0.42
  const rings = Math.max(2, Math.floor(count / 2))
  const step = (1 - 0.1) / count
  cells.push({ nx: cx, ny: cy })
  for (let ring = 1; ring <= rings; ring++) {
    const r = (ring / rings) * maxR
    const n = Math.max(4, Math.round((2 * Math.PI * r) / step))
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      cells.push({ nx: cx + Math.cos(a) * r, ny: cy + Math.sin(a) * r })
    }
  }
  return { cells, cellSize: step }
}

// --- Brightness field (per-cell value 0-1) ---

function sampleBrightness(nx, ny, mode, isEngine, angle, t, animate) {
  if (isEngine) {
    const cos = Math.cos(angle), sin = Math.sin(angle)
    const grad = (cos * (nx - 0.5) + sin * (ny - 0.5)) + 0.5
    return Math.max(0, Math.min(1, animate ? grad + Math.sin(t * 0.8) * 0.2 : grad))
  }
  switch (mode) {
    case 'halftone': {
      const dx = nx - 0.5, dy = ny - 0.5
      const dist = 1 - Math.sqrt(dx * dx + dy * dy) * 2
      return Math.max(0, Math.min(1, animate ? dist + Math.sin(t * 0.6) * 0.2 : dist))
    }
    case 'flow': {
      const cos = Math.cos(angle), sin = Math.sin(angle)
      return Math.max(0, Math.min(1, (cos * (nx - 0.5) + sin * (ny - 0.5)) + 0.5))
    }
    case 'crosshatch': {
      const g = 4
      return ((Math.floor(nx * g) + Math.floor(ny * g)) % 2 === 0) ? 0.8 : 0.3
    }
    case 'crt':
      return Math.max(0, Math.min(1, nx + (animate ? Math.sin(t) * 0.2 : 0)))
    case 'glitch':
      return Math.max(0, Math.min(1, nx + Math.sin(ny * 20) * 0.3))
    case 'melt':
      return Math.max(0, Math.min(1, 1 - ny + (animate ? Math.sin(t * 0.5) * 0.2 : 0)))
    default:
      return 0.5
  }
}

// --- Filter algorithm transforms ---

function applyFilter(mode, brightness, intensity, nx, ny) {
  let scX = 1, scY = 1, rot = 0, offX = 0, offY = 0
  const int = intensity / 100

  switch (mode) {
    case 'halftone':
      scX = scY = brightness * 1.5
      break
    case 'flow': {
      const dx = nx - 0.5, dy = ny - 0.5
      rot = Math.atan2(dy, dx) * int
      scX = scY = brightness * 1.2
      break
    }
    case 'crosshatch':
      rot = brightness > 0.5 ? Math.PI / 4 : -Math.PI / 4
      scY = 1.5
      scX = 0.3
      break
    case 'crt': {
      const line = Math.floor(ny * 20)
      if (line % 2 === 0) { scX = 1.2; scY = 0.3; offX = 0.01 * int }
      else { scX = brightness; scY = 0.8 }
      break
    }
    case 'glitch':
      offX = (brightness - 0.5) * 0.05 * int
      break
    case 'melt':
      offY = brightness * 0.04 * int
      scX = scY = brightness
      break
  }
  return { scX, scY, rot, offX, offY }
}

// --- Main generation pipeline ---

// Build per-cell density map from points input (fast, edge-based)
function buildDensityMap(signal, cellCount) {
  if (!signal || signal.type !== 'points') return null
  const srcPts = signal.value
  if (!srcPts || srcPts.length === 0) return null
  const map = new Float32Array(cellCount * cellCount)
  for (const pt of srcPts) {
    const gx = Math.floor(pt.x * cellCount)
    const gy = Math.floor(pt.y * cellCount)
    if (gx >= 0 && gx < cellCount && gy >= 0 && gy < cellCount) {
      map[gy * cellCount + gx]++
    }
  }
  let max = 0
  for (let i = 0; i < map.length; i++) if (map[i] > max) max = map[i]
  if (max > 0) for (let i = 0; i < map.length; i++) map[i] /= max
  return map
}

// Build per-cell fill map from points input using ray casting (accurate, heavy)
function buildFillMap(signal, cellCount) {
  if (!signal || signal.type !== 'points') return null
  const srcPts = signal.value
  const srcEdges = signal.edges
  if (!srcPts || srcPts.length === 0 || !srcEdges || srcEdges.length === 0) return null
  const map = new Float32Array(cellCount * cellCount)
  const step = 1 / cellCount
  for (let gy = 0; gy < cellCount; gy++) {
    const cy = (gy + 0.5) * step
    for (let gx = 0; gx < cellCount; gx++) {
      const cx = (gx + 0.5) * step
      let crossings = 0
      for (const [i, j] of srcEdges) {
        if (i >= srcPts.length || j >= srcPts.length) continue
        const y1 = srcPts[i].y, y2 = srcPts[j].y
        if ((y1 <= cy && y2 > cy) || (y2 <= cy && y1 > cy)) {
          const xCross = srcPts[i].x + (cy - y1) / (y2 - y1) * (srcPts[j].x - srcPts[i].x)
          if (xCross > cx) crossings++
        }
      }
      map[gy * cellCount + gx] = crossings % 2 === 1 ? 1 : 0
    }
  }
  return map
}

function generateDither(isEngine, mode, isAscii, asciiSet, shape, cellCountVal, gapVal, scaleVal, contrastVal, angleVal, intensityVal, invert, animate, fill, t, inputSignal, ray) {
  const pts = []
  const edges = []

  // Cell count from SIZE knob (0-100 → 6-24)
  const cellCount = Math.round(4 + (cellCountVal / 100) * 44)

  // Layout
  let layout
  if (isEngine) {
    switch (mode) {
      case 'hex': layout = layoutHex(cellCount); break
      case 'radial': layout = layoutRadial(cellCount); break
      default: layout = layoutGrid(cellCount); break
    }
  } else {
    layout = layoutGrid(cellCount)
  }

  const { cells, cellSize } = layout
  const halfCell = cellSize * 0.5
  const gapNorm = (gapVal / 100) * halfCell
  const scaleNorm = scaleVal / 100
  const angleRad = (angleVal / 100) * Math.PI * 2
  const contrastMul = 1 + ((contrastVal - 50) / 50) * 2

  // Shape index for shape mode
  const selectedShape = shape

  // Build input map: density (fast) or fill/ray casting (accurate)
  const inputMap = (!isEngine && inputSignal?.type === 'points')
    ? (ray ? buildFillMap(inputSignal, cellCount) : buildDensityMap(inputSignal, cellCount))
    : null
  const scalarVal = inputSignal ? readScalar(inputSignal) : null

  for (const cell of cells) {
    let brightness

    if (inputMap) {
      // Filter + points: per-cell brightness from source
      const gx = Math.floor(cell.nx * cellCount)
      const gy = Math.floor(cell.ny * cellCount)
      brightness = (gx >= 0 && gx < cellCount && gy >= 0 && gy < cellCount)
        ? inputMap[gy * cellCount + gx]
        : 0
    } else if (scalarVal != null) {
      // Scalar input: modulate internal brightness field
      brightness = sampleBrightness(cell.nx, cell.ny, mode, isEngine, angleRad, t, animate) * (scalarVal / 100)
    } else {
      // No input: internal brightness field only
      brightness = sampleBrightness(cell.nx, cell.ny, mode, isEngine, angleRad, t, animate)
    }

    // Contrast
    brightness = Math.max(0, Math.min(1, (brightness - 0.5) * contrastMul + 0.5))

    // Invert
    if (invert) brightness = 1 - brightness

    // Skip dim cells
    if (brightness < 0.03) continue

    // Compute transforms
    let rot = 0, scX = scaleNorm, scY = scaleNorm, offX = 0, offY = 0

    if (isEngine) {
      scX *= brightness
      scY *= brightness
    } else {
      const fx = applyFilter(mode, brightness, intensityVal, cell.nx, cell.ny)
      scX *= fx.scX
      scY *= fx.scY
      rot = fx.rot
      offX = fx.offX
      offY = fx.offY
    }

    // Cell radius
    const maxScale = Math.max(Math.abs(scX), Math.abs(scY))
    const r = Math.max(0.001, (halfCell - gapNorm) * maxScale)
    const cx = cell.nx + offX
    const cy = cell.ny + offY

    // Draw shape or ASCII character
    if (isAscii) {
      // Sort active chars by density order, map brightness to set
      const sorted = ASCII_DENSITY_ORDER.filter(c => asciiSet.includes(c))
      if (sorted.length === 0) continue
      const charIdx = sorted.length === 1 ? 0 : Math.min(sorted.length - 1, Math.floor(brightness * sorted.length))
      addAscii(pts, edges, cx, cy, halfCell - gapNorm, sorted[charIdx])
    } else {
      addShape(pts, edges, cx, cy, r, selectedShape, rot)
    }
  }

  return { pts, edges }
}

// --- UI ---

function DitherPanel({
  isEngine, mode, shape, isAscii, asciiSet, cellCount, gap, scale, contrast, angle, intensity, speed,
  invert, animate, fill, ray, enabled, onToggle, id,
  onIsEngineChange, onModeChange, onShapeChange, onIsAsciiChange, onAsciiSetChange,
  onCellCountChange, onGapChange, onScaleChange, onContrastChange, onAngleChange, onIntensityChange, onSpeedChange,
  onInvertChange, onAnimateChange, onFillChange, onRayChange,
  spdConn, spdCvRef, clkConn, clkCvRef,
  sizeCvRef, gapCvRef, sclCvRef, ctrCvRef, angCvRef, intCvRef,
  sizeConn, gapConn, sclConn, ctrConn, angConn, intConn,
  inConn, inSigRef, clrConn, clrSigRef,
  outRef, dnsRef, colorOutRef,
}) {
  const modes = isEngine ? ENGINE_MODES : FILTER_MODES

  return (
    <Module label="Dither" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 4, padding: '2px 4px' }}>

        {/* Engine / Filter + Ray + Mode selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <span
              onClick={() => onIsEngineChange(true)}
              className="kol-helper-xxxs"
              style={{ color: isEngine ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1 }}
            >engine</span>
            <span
              onClick={() => onIsEngineChange(false)}
              className="kol-helper-xxxs"
              style={{ color: !isEngine ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1 }}
            >filter</span>
            <div style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div onClick={() => onRayChange(!ray)} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f1c40f', opacity: ray ? 1 : 0.3 }} />
              <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>raycast</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {modes.map(item => (
              <LabeledControl key={item.value} label={item.text}>
                <IconButton icon={item.icon} title={item.value} active={mode === item.value} onClick={() => onModeChange(item.value)} />
              </LabeledControl>
            ))}
          </div>
        </div>

        <Divider className="px-1" />

        {/* Shape / ASCII toggle + shape selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <span
              onClick={() => onIsAsciiChange(false)}
              className="kol-helper-xxxs"
              style={{ color: !isAscii ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1 }}
            >shape</span>
            <span
              onClick={() => onIsAsciiChange(true)}
              className="kol-helper-xxxs"
              style={{ color: isAscii ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1 }}
            >ascii</span>
          </div>
          {!isAscii ? (
            <IconSelect value={shape} onChange={onShapeChange} items={SHAPE_ITEMS} columns={5} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {ASCII_ITEMS.map(item => (
                <IconButton
                  key={item.value}
                  icon={item.icon}
                  title={item.value}
                  active={asciiSet.includes(item.value)}
                  onClick={() => {
                    const has = asciiSet.includes(item.value)
                    onAsciiSetChange(has ? asciiSet.filter(c => c !== item.value) : [...asciiSet, item.value])
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <Divider className="px-1" />

        {/* Param knobs — conditional on mode */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <CvKnob port="size" moduleId={id} active={sizeConn} signalRef={sizeCvRef} value={cellCount} onChange={onCellCountChange} label="size" direction="vertical" />
          <CvKnob port="gap" moduleId={id} active={gapConn} signalRef={gapCvRef} value={gap} onChange={onGapChange} label="gap" direction="vertical" />
          {!isAscii && <CvKnob port="scl" moduleId={id} active={sclConn} signalRef={sclCvRef} value={scale} onChange={onScaleChange} label="scl" direction="vertical" />}
          <CvKnob port="ctr" moduleId={id} active={ctrConn} signalRef={ctrCvRef} value={contrast} onChange={onContrastChange} label="ctr" direction="vertical" />
          {(isEngine || mode === 'flow') && <CvKnob port="ang" moduleId={id} active={angConn} signalRef={angCvRef} value={angle} onChange={onAngleChange} label="ang" direction="vertical" />}
          {!isEngine && !isAscii && mode !== 'halftone' && mode !== 'crosshatch' && <CvKnob port="int" moduleId={id} active={intConn} signalRef={intCvRef} value={intensity} onChange={onIntensityChange} label="mix" direction="vertical" />}
          {animate && (isEngine || mode === 'halftone' || mode === 'crt' || mode === 'melt') && <CvKnob port="spd" moduleId={id} active={spdConn} signalRef={spdCvRef} value={speed} onChange={onSpeedChange} label="rate" direction="vertical" />}
        </div>

        {/* Toggles + rate */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8 }}>
          <Toggle value={invert} onChange={onInvertChange} label="inv" size="sm" horizontal />
          {(isEngine || mode === 'halftone' || mode === 'crt' || mode === 'melt') && <Toggle value={animate} onChange={onAnimateChange} label="ani" size="sm" horizontal />}
          <Toggle value={fill} onChange={onFillChange} label="fil" size="sm" horizontal />
        </div>

        <Divider className="px-1" />

        {/* I/O jacks */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inSigRef} label="in" />
          <LabeledJack type="in" port="clr" moduleId={id} active={clrConn} signalRef={clrSigRef} label="clr" />
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkCvRef} label="clk" />
          <LabeledJack type="out" port="color" moduleId={id} signalRef={colorOutRef} label="col" />
          <LabeledJack type="out" port="dns" moduleId={id} signalRef={dnsRef} label="dns" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

// --- Module ---

export default function DitherModule({ id = 'dither_1', init, preview }) {
  if (preview) return <DitherPanel
    isEngine={true} mode="grid" shape="circle" isAscii={false} asciiSet={['dot']}
    cellCount={50} gap={10} scale={80} contrast={50} angle={0} intensity={50}
    invert={false} animate={false} fill={true} enabled={false} onToggle={() => {}} id={id}
    onIsEngineChange={() => {}} onModeChange={() => {}} onShapeChange={() => {}} onIsAsciiChange={() => {}} onAsciiSetChange={() => {}}
    onCellCountChange={() => {}} onGapChange={() => {}} onScaleChange={() => {}} onContrastChange={() => {}} onAngleChange={() => {}} onIntensityChange={() => {}}
    onInvertChange={() => {}} onAnimateChange={() => {}} onFillChange={() => {}} ray={false} onRayChange={() => {}} onSpeedChange={() => {}} speed={50}
    spdConn={false} spdCvRef={{ current: null }} clkConn={false} clkCvRef={{ current: null }}
    sizeCvRef={{ current: null }} gapCvRef={{ current: null }} sclCvRef={{ current: null }}
    ctrCvRef={{ current: null }} angCvRef={{ current: null }} intCvRef={{ current: null }}
    sizeConn={false} gapConn={false} sclConn={false} ctrConn={false} angConn={false} intConn={false}
    inConn={false} inSigRef={{ current: null }} clrConn={false} clrSigRef={{ current: null }}
    outRef={{ current: null }} dnsRef={{ current: null }} colorOutRef={{ current: null }}
  />

  const [isEngine, setIsEngine] = useState(init?.isEngine ?? true)
  const [mode, setMode] = useState(init?.mode ?? 'grid')
  const [shape, setShape] = useState(init?.shape ?? 'circle')
  const [isAscii, setIsAscii] = useState(init?.isAscii ?? false)
  const [asciiSet, setAsciiSet] = useState(init?.asciiSet ?? ['dot'])
  const [cellCount, setCellCount] = useState(init?.cellCount ?? 50)
  const [gap, setGap] = useState(init?.gap ?? 10)
  const [scale, setScale] = useState(init?.scale ?? 80)
  const [contrast, setContrast] = useState(init?.contrast ?? 50)
  const [angle, setAngle] = useState(init?.angle ?? 0)
  const [intensity, setIntensity] = useState(init?.intensity ?? 50)
  const [invert, setInvert] = useState(init?.invert ?? false)
  const [animate, setAnimate] = useState(init?.animate ?? false)
  const [fill, setFill] = useState(init?.fill ?? true)
  const [speed, setSpeed] = useState(init?.speed ?? 50)
  const [ray, setRay] = useState(init?.ray ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()

  // State value refs (for process loop)
  const enabledRef = useRef(true)
  const isEngineRef = useRef(true)
  const modeRef = useRef('grid')
  const shapeRef = useRef('circle')
  const isAsciiRef = useRef(false)
  const asciiSetRef = useRef(['dot'])
  const cellCountRef = useRef(50)
  const gapValRef = useRef(10)
  const scaleValRef = useRef(80)
  const contrastValRef = useRef(50)
  const angleValRef = useRef(0)
  const intensityValRef = useRef(50)
  const invertRef = useRef(false)
  const animateRef = useRef(false)
  const fillRef = useRef(true)
  const speedRef = useRef(50)
  const spdCvRef = useRef(null)
  const clkCvRef = useRef(null)
  const prevClkRef = useRef(false)
  const rayRef = useRef(false)
  const animTimeRef = useRef(0)

  // CV signal refs
  const sizeCvRef = useRef(null)
  const gapCvRef = useRef(null)
  const sclCvRef = useRef(null)
  const ctrCvRef = useRef(null)
  const angCvRef = useRef(null)
  const intCvRef = useRef(null)
  const inSigRef = useRef(null)
  const clrSigRef = useRef(null)

  // Output refs
  const outRef = useRef(null)
  const dnsRef = useRef(null)
  const colorOutRef = useRef(null)

  // Sync state → refs
  enabledRef.current = enabled
  isEngineRef.current = isEngine
  modeRef.current = mode
  shapeRef.current = shape
  isAsciiRef.current = isAscii
  asciiSetRef.current = asciiSet
  cellCountRef.current = cellCount
  gapValRef.current = gap
  scaleValRef.current = scale
  contrastValRef.current = contrast
  angleValRef.current = angle
  intensityValRef.current = intensity
  invertRef.current = invert
  animateRef.current = animate
  fillRef.current = fill
  speedRef.current = speed
  rayRef.current = ray

  // Connection detection
  const conns = routing?.connections || []
  const sizeConn = conns.some(c => c.toModuleId === id && c.toPort === 'size')
  const gapConn = conns.some(c => c.toModuleId === id && c.toPort === 'gap')
  const sclConn = conns.some(c => c.toModuleId === id && c.toPort === 'scl')
  const ctrConn = conns.some(c => c.toModuleId === id && c.toPort === 'ctr')
  const angConn = conns.some(c => c.toModuleId === id && c.toPort === 'ang')
  const intConn = conns.some(c => c.toModuleId === id && c.toPort === 'int')
  const inConn = conns.some(c => c.toModuleId === id && c.toPort === 'in')
  const clrConn = conns.some(c => c.toModuleId === id && c.toPort === 'clr')
  const spdConn = conns.some(c => c.toModuleId === id && c.toPort === 'spd')
  const clkConn = conns.some(c => c.toModuleId === id && c.toPort === 'clk')

  const handleIsEngineChange = (v) => {
    setIsEngine(v)
    setMode(v ? 'grid' : 'halftone')
  }

  useModule({
    id,
    inputs: {
      in: { type: 'scalar' }, clr: { type: 'color' }, clk: { type: 'scalar' }, spd: { type: 'scalar' },
      size: { type: 'scalar' }, gap: { type: 'scalar' }, scl: { type: 'scalar' },
      ctr: { type: 'scalar' }, ang: { type: 'scalar' }, int: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' }, dns: { type: 'scalar' }, color: { type: 'color' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) {
        outRef.current = null; dnsRef.current = null; colorOutRef.current = null
        return { out: null, dns: null, color: null }
      }

      // Store CV signals for UI indicators
      sizeCvRef.current = inputs.size
      gapCvRef.current = inputs.gap
      sclCvRef.current = inputs.scl
      ctrCvRef.current = inputs.ctr
      angCvRef.current = inputs.ang
      intCvRef.current = inputs.int
      inSigRef.current = inputs.in
      clrSigRef.current = inputs.clr

      // Read values (CV overrides knob)
      const vSize = inputs.size ? readScalar(inputs.size) : cellCountRef.current
      const vGap = inputs.gap ? readScalar(inputs.gap) : gapValRef.current
      const vScale = inputs.scl ? readScalar(inputs.scl) : scaleValRef.current
      const vContrast = inputs.ctr ? readScalar(inputs.ctr) : contrastValRef.current
      const vAngle = inputs.ang ? readScalar(inputs.ang) : angleValRef.current
      const vIntensity = inputs.int ? readScalar(inputs.int) : intensityValRef.current
      // Clock: reset animation phase on rising edge
      spdCvRef.current = inputs.spd
      clkCvRef.current = inputs.clk
      const clkHigh = readScalar(inputs.clk) > 50
      if (clkHigh && !prevClkRef.current) animTimeRef.current = 0
      prevClkRef.current = clkHigh

      // Animation time with speed control
      const vSpeed = inputs.spd ? readScalar(inputs.spd) : speedRef.current
      if (animateRef.current) animTimeRef.current += dt * (vSpeed / 50)

      const geom = generateDither(
        isEngineRef.current, modeRef.current, isAsciiRef.current, asciiSetRef.current,
        shapeRef.current, vSize, vGap, vScale, vContrast, vAngle, vIntensity,
        invertRef.current, animateRef.current, fillRef.current, animTimeRef.current, inputs.in || null, rayRef.current,
      )

      const pOut = points(geom.pts, geom.edges)
      pOut.aspectFill = true
      pOut.fill = fillRef.current
      pOut.strokeWidth = 1
      if (inputs.clr?.type === 'color') pOut.color = inputs.clr.value
      outRef.current = pOut

      // Density output: proportion of non-empty cells
      const cells = Math.round(4 + (vSize / 100) * 44)
      const maxPts = cells * cells * 4
      const density = geom.pts.length > 0 ? Math.min(100, (geom.pts.length / maxPts) * 100) : 0
      const sOut = scalar(density)
      dnsRef.current = sOut

      // Color pass-through
      const cOut = inputs.clr || null
      colorOutRef.current = cOut

      return { out: pOut, dns: sOut, color: cOut }
    },
  })

  return <DitherPanel
    isEngine={isEngine} mode={mode} shape={shape} isAscii={isAscii} asciiSet={asciiSet}
    cellCount={cellCount} gap={gap} scale={scale} contrast={contrast} angle={angle} intensity={intensity}
    invert={invert} animate={animate} fill={fill} enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onIsEngineChange={handleIsEngineChange} onModeChange={setMode} onShapeChange={setShape} onIsAsciiChange={setIsAscii} onAsciiSetChange={setAsciiSet}
    onCellCountChange={setCellCount} onGapChange={setGap} onScaleChange={setScale} onContrastChange={setContrast}
    onAngleChange={setAngle} onIntensityChange={setIntensity}
    onInvertChange={setInvert} onAnimateChange={setAnimate} onFillChange={setFill} ray={ray} onRayChange={setRay} onSpeedChange={setSpeed} speed={speed}
    spdConn={spdConn} spdCvRef={spdCvRef} clkConn={clkConn} clkCvRef={clkCvRef}
    sizeCvRef={sizeCvRef} gapCvRef={gapCvRef} sclCvRef={sclCvRef}
    ctrCvRef={ctrCvRef} angCvRef={angCvRef} intCvRef={intCvRef}
    sizeConn={sizeConn} gapConn={gapConn} sclConn={sclConn} ctrConn={ctrConn} angConn={angConn} intConn={intConn}
    inConn={inConn} inSigRef={inSigRef} clrConn={clrConn} clrSigRef={clrSigRef}
    outRef={outRef} dnsRef={dnsRef} colorOutRef={colorOutRef}
  />
}
