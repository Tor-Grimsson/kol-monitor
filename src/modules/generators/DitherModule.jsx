// DitherModule — dither/ASCII pattern processor
// 14HP 3U. Engine mode (grid/hex/radial) + Filter mode (halftone/flow/crosshatch/CRT/glitch/melt).
// Shape/ASCII toggle: shapes use selected geometric primitive, ASCII maps brightness to character density.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, points, readScalar, readCv } from '../../hooks/signals'
import { sinLut, cosLut } from '../../hooks/trigLut'
import { newClockSyncState, measureClockRate } from '../../hooks/clockSync'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import CvKnob from '../parametric/CvKnob'
import IconButton from '../parametric/IconButton'
import IconSelect from '../parametric/IconSelect'
import LabeledControl from '../parametric/LabeledControl'
import Toggle from '../parametric/Toggle'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

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

// --- Shape geometry generators ---

function scaleUnit(unit, r) {
  const v = new Array(unit.length)
  for (let i = 0; i < unit.length; i++) v[i] = [unit[i][0] * r, unit[i][1] * r]
  return v
}

function addShape(pts, edges, cx, cy, r, type, rot) {
  if (r < 0.001) return
  const noRot = rot === 0
  const cos = noRot ? 1 : Math.cos(rot)
  const sin = noRot ? 0 : Math.sin(rot)

  switch (type) {
    case 'circle':
      addRotatedPoly(pts, edges, cx, cy, scaleUnit(UNIT_CIRCLE_8, r), cos, sin)
      break
    case 'rect':
      addRotatedPoly(pts, edges, cx, cy, [[-r, -r], [r, -r], [r, r], [-r, r]], cos, sin)
      break
    case 'tri':
      addRotatedPoly(pts, edges, cx, cy, [[0, -r], [r * 0.87, r * 0.5], [-r * 0.87, r * 0.5]], cos, sin)
      break
    case 'oct':
      addRotatedPoly(pts, edges, cx, cy, scaleUnit(UNIT_OCT_8, r), cos, sin)
      break
    case 'star':
      addRotatedPoly(pts, edges, cx, cy, scaleUnit(UNIT_STAR_10, r), cos, sin)
      break
    case 'cross': {
      const w = r * 0.3
      addRotatedPoly(pts, edges, cx, cy, [
        [-w, -r], [w, -r], [w, -w], [r, -w], [r, w], [w, w],
        [w, r], [-w, r], [-w, w], [-r, w], [-r, -w], [-w, -w],
      ], cos, sin)
      break
    }
    case 'hex':
      addRotatedPoly(pts, edges, cx, cy, scaleUnit(UNIT_HEX_6, r), cos, sin)
      break
    case 'diamond':
      addRotatedPoly(pts, edges, cx, cy, [[0, -r], [r, 0], [0, r], [-r, 0]], cos, sin)
      break
    case 'gear':
      addRotatedPoly(pts, edges, cx, cy, scaleUnit(UNIT_GEAR_16, r), cos, sin)
      break
    case 'flower': {
      const petals = 5, res = 6
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2
        const pcx = cosLut(a) * r * 0.5
        const pcy = sinLut(a) * r * 0.5
        const v = []
        for (let j = 0; j < res; j++) {
          const pa = (j / res) * Math.PI * 2
          v.push([pcx + cosLut(pa) * r * 0.4, pcy + sinLut(pa) * r * 0.4])
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
        pts.push({ x: cx + cosLut(a) * sr, y: cy + sinLut(a) * sr })
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

// --- Pre-computed unit shapes (avoid trig per cell) ---

const UNIT_CIRCLE_8 = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  return [Math.cos(a), Math.sin(a)]
})

const UNIT_OCT_8 = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8
  return [Math.cos(a), Math.sin(a)]
})

const UNIT_HEX_6 = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + Math.PI / 6
  return [Math.cos(a), Math.sin(a)]
})

const UNIT_STAR_10 = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2
  const rad = i % 2 === 0 ? 1 : 0.4
  return [Math.cos(a) * rad, Math.sin(a) * rad]
})

const UNIT_GEAR_16 = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2
  const rad = i % 2 === 0 ? 1 : 0.7
  return [Math.cos(a) * rad, Math.sin(a) * rad]
})

// --- Grid layouts (return {cells: [{nx, ny}], cellSize}) ---
// Clipped to -0.1..1.1 range (small bleed for edge coverage, not 2-cell pad)

function layoutGrid(count) {
  const cells = []
  const step = 1 / count
  for (let gy = -1; gy <= count; gy++) {
    for (let gx = -1; gx <= count; gx++) {
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
  for (let gy = -1; gy <= rows; gy++) {
    const offset = gy % 2 === 0 ? 0 : step * 0.5
    for (let gx = -1; gx <= count; gx++) {
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
      cells.push({ nx: cx + cosLut(a) * r, ny: cy + sinLut(a) * r })
    }
  }
  return { cells, cellSize: step }
}

// --- Brightness field (per-cell value 0-1) ---

function sampleBrightness(nx, ny, mode, isEngine, angle, t, animate) {
  if (isEngine) {
    const cos = cosLut(angle), sin = sinLut(angle)
    const grad = (cos * (nx - 0.5) + sin * (ny - 0.5)) + 0.5
    return Math.max(0, Math.min(1, animate ? grad + sinLut(t * 0.8) * 0.2 : grad))
  }
  switch (mode) {
    case 'halftone': {
      const dx = nx - 0.5, dy = ny - 0.5
      const dist = 1 - Math.sqrt(dx * dx + dy * dy) * 2
      return Math.max(0, Math.min(1, animate ? dist + sinLut(t * 0.6) * 0.2 : dist))
    }
    case 'flow': {
      const cos = cosLut(angle), sin = sinLut(angle)
      return Math.max(0, Math.min(1, (cos * (nx - 0.5) + sin * (ny - 0.5)) + 0.5))
    }
    case 'crosshatch': {
      const g = 4
      return ((Math.floor(nx * g) + Math.floor(ny * g)) % 2 === 0) ? 0.8 : 0.3
    }
    case 'crt':
      return Math.max(0, Math.min(1, nx + (animate ? sinLut(t) * 0.2 : 0)))
    case 'glitch':
      return Math.max(0, Math.min(1, nx + sinLut(ny * 20) * 0.3))
    case 'melt':
      return Math.max(0, Math.min(1, 1 - ny + (animate ? sinLut(t * 0.5) * 0.2 : 0)))
    default:
      return 0.5
  }
}

// --- Filter algorithm transforms ---

function applyFilter(mode, brightness, intensity, nx, ny) {
  // Returns shared scratch — callers consume the fields immediately, never hold it
  const fx = _fxScratch
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
  fx.scX = scX; fx.scY = scY; fx.rot = rot; fx.offX = offX; fx.offY = offY
  return fx
}

// --- Main generation pipeline ---

// File-level scratch reused across frames. Dither rebuilds geometry every frame
// and was the app's top GC source (28ms GC / 4s window, dither-patch baseline).
// All of this is consumed inside a single generateDither call and never leaves
// the module, so sharing across instances is safe (process calls run
// sequentially). pts/edges stay freshly allocated — consumers may buffer
// signals. ponytail: bucket edge-records ({i,j,maxX}) still allocate per frame;
// pool them if a profile ever names buildFillMap again.
const _layoutCache = { key: '', layout: null }
const _mapScratch = { size: 0, map: null }
const _blurScratch = { size: 0, map: null }
const _fillBuckets = []
const _asciiCache = { set: null, sorted: null }
const _fxScratch = { scX: 1, scY: 1, rot: 0, offX: 0, offY: 0 }

function getScratchMap(store, size) {
  if (store.size !== size) { store.size = size; store.map = new Float32Array(size) }
  return store.map
}

// Build per-cell density map from points input (fast, edge-based)
function buildDensityMap(signal, cellCount) {
  if (!signal || signal.type !== 'points') return null
  const srcPts = signal.value
  if (!srcPts || srcPts.length === 0) return null
  const map = getScratchMap(_mapScratch, cellCount * cellCount)
  map.fill(0)
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

// Build per-cell fill map from points input using ray casting with Y-bucketed edges
function buildFillMap(signal, cellCount) {
  if (!signal || signal.type !== 'points') return null
  const srcPts = signal.value
  const srcEdges = signal.edges
  if (!srcPts || srcPts.length === 0 || !srcEdges || srcEdges.length === 0) return null

  // Y-bucketed edges, sorted by max X within each row for early exit
  const step = 1 / cellCount
  const buckets = _fillBuckets
  while (buckets.length < cellCount) buckets.push([])
  for (let i = 0; i < cellCount; i++) buckets[i].length = 0

  for (const [i, j] of srcEdges) {
    if (i >= srcPts.length || j >= srcPts.length) continue
    const y1 = srcPts[i].y, y2 = srcPts[j].y
    const maxX = Math.max(srcPts[i].x, srcPts[j].x)
    const rowMin = Math.max(0, Math.floor(Math.min(y1, y2) * cellCount))
    const rowMax = Math.min(cellCount - 1, Math.floor(Math.max(y1, y2) * cellCount))
    for (let r = rowMin; r <= rowMax; r++) buckets[r].push({ i, j, maxX })
  }

  // Sort each bucket by maxX ascending — edges fully left of cell can be skipped
  for (let r = 0; r < cellCount; r++) buckets[r].sort((a, b) => a.maxX - b.maxX)

  const map = getScratchMap(_mapScratch, cellCount * cellCount)
  for (let gy = 0; gy < cellCount; gy++) {
    const cy = (gy + 0.5) * step
    const rowEdges = buckets[gy]
    for (let gx = 0; gx < cellCount; gx++) {
      const cx = (gx + 0.5) * step
      let crossings = 0
      for (let e = 0; e < rowEdges.length; e++) {
        // Edge entirely left of cell — ray goes right, can't cross
        if (rowEdges[e].maxX <= cx) continue
        const { i, j } = rowEdges[e]
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

// Box blur on density/fill map — smooths cell transitions
function blurMap(map, cellCount, passes) {
  if (passes <= 0) return map
  let src = map
  let dst = getScratchMap(_blurScratch, cellCount * cellCount)
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < cellCount; y++) {
      for (let x = 0; x < cellCount; x++) {
        let sum = 0, count = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && nx < cellCount && ny >= 0 && ny < cellCount) {
              sum += src[ny * cellCount + nx]
              count++
            }
          }
        }
        dst[y * cellCount + x] = sum / count
      }
    }
    const tmp = src; src = dst; dst = tmp
  }
  return src
}

function generateDither(isEngine, mode, isAscii, asciiSet, shape, cellCountVal, gapVal, scaleVal, contrastVal, angleVal, intensityVal, invert, animate, fill, t, inputSignal, ray, blur) {
  const pts = []
  const edges = []

  // Cell count from SIZE knob (0-100 → 6-24)
  const cellCount = Math.round(4 + (cellCountVal / 100) * 44)

  // Layout — cells depend only on kind + count, cache across frames
  const layoutKey = (isEngine ? mode : 'grid') + ':' + cellCount
  if (_layoutCache.key !== layoutKey) {
    _layoutCache.key = layoutKey
    if (isEngine && mode === 'hex') _layoutCache.layout = layoutHex(cellCount)
    else if (isEngine && mode === 'radial') _layoutCache.layout = layoutRadial(cellCount)
    else _layoutCache.layout = layoutGrid(cellCount)
  }
  const layout = _layoutCache.layout

  const { cells, cellSize } = layout
  const halfCell = cellSize * 0.5
  const gapNorm = (gapVal / 100) * halfCell
  const scaleNorm = scaleVal / 100
  const angleRad = (angleVal / 100) * Math.PI * 2
  const contrastMul = 1 + ((contrastVal - 50) / 50) * 2

  // Shape index for shape mode
  const selectedShape = shape

  // Build input map: density (fast) or fill/ray casting (accurate), then blur
  const blurPasses = Math.round((blur / 100) * 5)
  let inputMap = (!isEngine && inputSignal?.type === 'points')
    ? (ray ? buildFillMap(inputSignal, cellCount) : buildDensityMap(inputSignal, cellCount))
    : null
  if (inputMap && blurPasses > 0) inputMap = blurMap(inputMap, cellCount, blurPasses)
  const scalarVal = inputSignal ? readScalar(inputSignal) : null

  // Pre-sort ASCII density ramp — recompute only when the set identity changes
  if (isAscii && _asciiCache.set !== asciiSet) {
    _asciiCache.set = asciiSet
    _asciiCache.sorted = ASCII_DENSITY_ORDER.filter(c => asciiSet.includes(c))
  }
  const asciiSorted = isAscii ? _asciiCache.sorted : null
  const asciiLen = asciiSorted ? asciiSorted.length : 0

  for (const cell of cells) {
    let brightness

    if (inputMap) {
      const gx = Math.floor(cell.nx * cellCount)
      const gy = Math.floor(cell.ny * cellCount)
      brightness = (gx >= 0 && gx < cellCount && gy >= 0 && gy < cellCount)
        ? inputMap[gy * cellCount + gx]
        : 0
    } else if (scalarVal != null) {
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
      if (asciiLen === 0) continue
      const charIdx = asciiLen === 1 ? 0 : Math.min(asciiLen - 1, Math.floor(brightness * asciiLen))
      const charR = (halfCell - gapNorm) * (0.4 + brightness * 0.6)
      addAscii(pts, edges, cx, cy, charR, asciiSorted[charIdx])
    } else {
      addShape(pts, edges, cx, cy, r, selectedShape, rot)
    }
  }

  return { pts, edges }
}

// --- UI ---

function DitherPanel({
  isEngine, mode, shape, isAscii, asciiSet, cellCount, gap, scale, contrast, angle, intensity, speed, blur,
  invert, animate, fill, ray, enabled, onToggle, id,
  onIsEngineChange, onModeChange, onShapeChange, onIsAsciiChange, onAsciiSetChange,
  onCellCountChange, onGapChange, onScaleChange, onContrastChange, onAngleChange, onIntensityChange, onSpeedChange, onBlurChange,
  onInvertChange, onAnimateChange, onFillChange, onRayChange,
  spdConn, spdCvRef, clkConn, clkCvRef, clkInConn, clkInRef,
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
              className="kol-helper-8"
              style={{ color: isEngine ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1 }}
            >engine</span>
            <span
              onClick={() => onIsEngineChange(false)}
              className="kol-helper-8"
              style={{ color: !isEngine ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1 }}
            >filter</span>
            <div style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div onClick={() => onRayChange(!ray)} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f1c40f', opacity: ray ? 1 : 0.3 }} />
              <span className="kol-helper-8" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>raycast</span>
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
              className="kol-helper-8"
              style={{ color: !isAscii ? 'rgba(231,76,60,0.9)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1 }}
            >shape</span>
            <span
              onClick={() => onIsAsciiChange(true)}
              className="kol-helper-8"
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
          <CvKnob port="blur" moduleId={id} value={blur} onChange={onBlurChange} label="blr" direction="vertical" />
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
          <LabeledJack type="in" port="clk" moduleId={id} active={clkInConn} signalRef={clkInRef} label="clk" />
          <LabeledJack type="in" port="rst" moduleId={id} active={clkConn} signalRef={clkCvRef} label="rst" />
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
    onInvertChange={() => {}} onAnimateChange={() => {}} onFillChange={() => {}} ray={false} onRayChange={() => {}} onSpeedChange={() => {}} speed={50} blur={0} onBlurChange={() => {}}
    spdConn={false} spdCvRef={{ current: null }} clkConn={false} clkCvRef={{ current: null }} clkInConn={false} clkInRef={{ current: null }}
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
  const [blur, setBlur] = useState(init?.blur ?? 0)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

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
  const clkCvRef = useRef(null)  // rst jack
  const clkInRef = useRef(null)  // clk jack
  const prevClkRef = useRef(false)
  const syncRef = useRef(newClockSyncState())
  const rayRef = useRef(false)
  const blurRef = useRef(0)
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
  blurRef.current = blur

  // Connection detection
  const sizeConn = cp.has('size')
  const gapConn = cp.has('gap')
  const sclConn = cp.has('scl')
  const ctrConn = cp.has('ctr')
  const angConn = cp.has('ang')
  const intConn = cp.has('int')
  const inConn = cp.has('in')
  const clrConn = cp.has('clr')
  const spdConn = cp.has('spd')
  const clkConn = cp.has('rst')
  const clkInConn = cp.has('clk')

  const handleIsEngineChange = (v) => {
    setIsEngine(v)
    setMode(v ? 'grid' : 'halftone')
  }

  const saveStateRef = useRef({})
  saveStateRef.current = { isEngine, mode, shape, isAscii, asciiSet, cellCount, gap, scale, contrast, angle, intensity, invert, animate, fill, speed, ray, blur }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'scalar' }, clr: { type: 'color' }, rst: { type: 'scalar' }, clk: { type: 'scalar' }, spd: { type: 'scalar', cv: 'offset' },
      size: { type: 'scalar', cv: 'offset' }, gap: { type: 'scalar', cv: 'offset' }, scl: { type: 'scalar', cv: 'offset' },
      ctr: { type: 'scalar', cv: 'offset' }, ang: { type: 'scalar', cv: 'offset' }, int: { type: 'scalar', cv: 'attenuate' },
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

      const vSize = readCv(inputs.size, cellCountRef.current)
      const vGap = readCv(inputs.gap, gapValRef.current)
      const vScale = readCv(inputs.scl, scaleValRef.current)
      const vContrast = readCv(inputs.ctr, contrastValRef.current)
      const vAngle = readCv(inputs.ang, angleValRef.current)
      const vIntensity = readCv(inputs.int, intensityValRef.current, 'attenuate')
      // Rst rising edge zeros animation phase. Clk (separate jack) drives rate.
      spdCvRef.current = inputs.spd
      clkCvRef.current = inputs.rst
      clkInRef.current = inputs.clk
      const clkHigh = readScalar(inputs.rst) > 0
      if (clkHigh && !prevClkRef.current) animTimeRef.current = 0
      prevClkRef.current = clkHigh

      // Knob as multiplier; baseRate = 1 cycle/sec free, or 1/period when clk locks.
      const vSpeed = readCv(inputs.spd, speedRef.current)
      const baseRate = measureClockRate(syncRef.current, inputs.clk, t, 1)
      if (animateRef.current) animTimeRef.current += dt * baseRate * (vSpeed / 50)

      const geom = generateDither(
        isEngineRef.current, modeRef.current, isAsciiRef.current, asciiSetRef.current,
        shapeRef.current, vSize, vGap, vScale, vContrast, vAngle, vIntensity,
        invertRef.current, animateRef.current, fillRef.current, animTimeRef.current, inputs.in || null, rayRef.current, blurRef.current,
      )

      const pOut = points(geom.pts, geom.edges)
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
    onInvertChange={setInvert} onAnimateChange={setAnimate} onFillChange={setFill} ray={ray} onRayChange={setRay} onSpeedChange={setSpeed} speed={speed} blur={blur} onBlurChange={setBlur}
    spdConn={spdConn} spdCvRef={spdCvRef} clkConn={clkConn} clkCvRef={clkCvRef} clkInConn={clkInConn} clkInRef={clkInRef}
    sizeCvRef={sizeCvRef} gapCvRef={gapCvRef} sclCvRef={sclCvRef}
    ctrCvRef={ctrCvRef} angCvRef={angCvRef} intCvRef={intCvRef}
    sizeConn={sizeConn} gapConn={gapConn} sclConn={sclConn} ctrConn={ctrConn} angConn={angConn} intConn={intConn}
    inConn={inConn} inSigRef={inSigRef} clrConn={clrConn} clrSigRef={clrSigRef}
    outRef={outRef} dnsRef={dnsRef} colorOutRef={colorOutRef}
  />
}
