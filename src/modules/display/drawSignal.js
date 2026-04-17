// Shared Canvas2D drawing primitives for display modules
// All draw functions accept an optional pen object for style control

import { PEN_DEFAULTS } from '../../hooks/signals'

const SCOPE_COLOR = '#2ecc71'
const WIRE_COLOR = '#ffffff'
const REF_COLOR = 'rgba(255,255,255,0.06)'

function penColor(p, fallback) {
  if (p.color) {
    const { r, g, b } = p.color
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
  }
  return fallback
}

// Captures the caller's baseline globalAlpha so multi-drawSignal callers
// (e.g. ConsoleModule rendering 4 channels + 2 returns) retain their pre-set alpha.
function applyPen(ctx, p) {
  ctx.lineWidth = p.thickness
  ctx.lineCap = p.cap
  ctx._baseAlpha = ctx.globalAlpha
  ctx.globalAlpha = ctx._baseAlpha * (p.opacity / 100)
  ctx.setLineDash(p.dash > 0.5 ? [p.dash, p.gap || p.dash] : [])
}

function resetPen(ctx) {
  ctx.globalAlpha = ctx._baseAlpha ?? 1
  ctx.setLineDash([])
}

// Scalar: rolling oscilloscope trace from ring buffer
// bipolar=true renders with zero at middle: val=+100 at top, val=-100 at bottom
// bipolar=false renders unipolar: val=0 at bottom, val=100 at top
export function drawScalar(ctx, history, writeIdx, bufLen, x, y, w, h, p, bipolar = false) {
  // Reference line (zero axis) — middle for bipolar, bottom for unipolar
  const zeroY = bipolar ? y + h / 2 : y + h
  ctx.strokeStyle = REF_COLOR
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, zeroY)
  ctx.lineTo(x + w, zeroY)
  ctx.stroke()

  // Trace — writeIdx points to the NEXT write slot (= oldest data);
  // iterate from there to render oldest→newest across x.
  applyPen(ctx, p)
  ctx.strokeStyle = penColor(p, SCOPE_COLOR)
  ctx.beginPath()
  let started = false
  for (let i = 0; i < bufLen; i++) {
    const idx = (writeIdx + i) % bufLen
    const val = history[idx]
    const px = x + (i / (bufLen - 1)) * w
    const py = bipolar
      ? y + h / 2 - (val / 100) * (h / 2)
      : y + h - (val / 100) * h
    if (!started) { ctx.moveTo(px, py); started = true }
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  resetPen(ctx)

  // Current value readout = newest sample (just-written = writeIdx - 1)
  const current = history[(writeIdx - 1 + bufLen) % bufLen]
  if (current !== undefined) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '9px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(Math.round(current), x + 3, y + 11)
  }
}

// Color: filled rectangle
export function drawColor(ctx, signal, x, y, w, h, p) {
  const { r, g, b, a } = signal.value
  ctx.globalAlpha = (p.opacity / 100) * a
  ctx.fillStyle = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4)
  resetPen(ctx)
}

// Points: wireframe (with edges) or waveform polyline (without edges)
// Supports signal.strokeWidth, signal.fill, signal.grid from RadialGen
export function drawPoints(ctx, signal, x, y, w, h, p) {
  const pts = signal.value
  const hasGroups = signal.groups && signal.groups.length > 0
  if ((!pts || pts.length === 0) && !hasGroups) return

  applyPen(ctx, p)

  // Background fill
  if (signal.bg) {
    const bg = signal.bg
    ctx.fillStyle = `rgb(${Math.round(bg.r * 255)},${Math.round(bg.g * 255)},${Math.round(bg.b * 255)})`
    ctx.fillRect(x, y, w, h)
  }

  // Apply signal-level opacity (from console send levels)
  if (signal.opacity != null) ctx.globalAlpha *= signal.opacity

  // Override pen thickness if signal carries strokeWidth
  if (signal.strokeWidth != null) ctx.lineWidth = signal.strokeWidth

  // Aspect: contain (aspectLock) or cover (aspectFill)
  let dx = x, dy = y, dw = w, dh = h
  if (signal.aspectFill) {
    const side = Math.max(w, h)
    dx = x + (w - side) / 2
    dy = y + (h - side) / 2
    dw = side
    dh = side
  } else if (signal.aspectLock) {
    const side = Math.min(w, h)
    dx = x + (w - side) / 2
    dy = y + (h - side) / 2
    dw = side
    dh = side
  }

  // Grid — full grid covering entire canvas area (not clipped to aspect)
  if (signal.grid) {
    ctx.lineWidth = 1
    const divisions = 8
    // Grid lines
    ctx.strokeStyle = REF_COLOR
    ctx.beginPath()
    for (let i = 0; i <= divisions; i++) {
      if (i === divisions / 2) continue // skip center, drawn as crosshair
      const gx = x + (i / divisions) * w
      ctx.moveTo(gx, y)
      ctx.lineTo(gx, y + h)
      const gy = y + (i / divisions) * h
      ctx.moveTo(x, gy)
      ctx.lineTo(x + w, gy)
    }
    ctx.stroke()
    // Crosshair — more visible
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.moveTo(x + w / 2, y)
    ctx.lineTo(x + w / 2, y + h)
    ctx.moveTo(x, y + h / 2)
    ctx.lineTo(x + w, y + h / 2)
    ctx.stroke()
    // Restore stroke width
    if (signal.strokeWidth != null) ctx.lineWidth = signal.strokeWidth
    else applyPen(ctx, p)
  }

  if (signal.edges && signal.edges.length > 0) {
    const color = signal.color
      ? `rgb(${Math.round(signal.color.r * 255)},${Math.round(signal.color.g * 255)},${Math.round(signal.color.b * 255)})`
      : penColor(p, 'strokeWidth' in signal ? '#ffffff' : WIRE_COLOR)

    // Fill — trace closed shapes from edges
    if (signal.fill || p?.fill) {
      ctx.fillStyle = color
      let prevTo = -1
      for (let e = 0; e < signal.edges.length; e++) {
        const [i, j] = signal.edges[e]
        if (i >= pts.length || j >= pts.length) continue
        if (i !== prevTo) {
          if (prevTo !== -1) { ctx.closePath(); ctx.fill() }
          ctx.beginPath()
          ctx.moveTo(dx + pts[i].x * dw, dy + pts[i].y * dh)
        }
        ctx.lineTo(dx + pts[j].x * dw, dy + pts[j].y * dh)
        prevTo = j
      }
      if (prevTo !== -1) { ctx.closePath(); ctx.fill() }
    }

    // Stroke — suppressed when pen.fill is on (override: pen.fill flips stroke→fill)
    if (!p?.fill) {
      ctx.strokeStyle = color
      ctx.beginPath()
      const edges = signal.edges
      const ptsLen = pts.length
      for (let k = 0; k < edges.length; k++) {
        const e = edges[k]
        const i = e[0], j = e[1]
        if (i >= ptsLen || j >= ptsLen) continue
        ctx.moveTo(dx + pts[i].x * dw, dy + pts[i].y * dh)
        ctx.lineTo(dx + pts[j].x * dw, dy + pts[j].y * dh)
      }
      ctx.stroke()
    }
  } else if (pts && pts.length > 0) {
    ctx.strokeStyle = penColor(p, SCOPE_COLOR)
    ctx.beginPath()
    ctx.moveTo(dx + pts[0].x * dw, dy + pts[0].y * dh)
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(dx + pts[i].x * dw, dy + pts[i].y * dh)
    }
    ctx.stroke()
  }

  // Per-group colored wireframes (from Magneto etc.)
  if (signal.groups) {
    for (const g of signal.groups) {
      if (!g.pts || g.pts.length === 0) continue
      const gc = g.color
        ? `rgb(${Math.round(g.color.r * 255)},${Math.round(g.color.g * 255)},${Math.round(g.color.b * 255)})`
        : penColor(p, WIRE_COLOR)
      if (g.opacity != null) ctx.globalAlpha = g.opacity
      ctx.strokeStyle = gc
      ctx.fillStyle = gc
      if (g.edges && g.edges.length > 0) {
        // Pen.fill is an override: forces fill, suppresses stroke
        const doFill = (g.fill || p?.fill) && g.pts.length > 2
        const doStroke = g.stroke !== false && !p?.fill
        if (doFill) {
          ctx.beginPath()
          ctx.moveTo(dx + g.pts[0].x * dw, dy + g.pts[0].y * dh)
          for (let i = 1; i < g.pts.length; i++) {
            ctx.lineTo(dx + g.pts[i].x * dw, dy + g.pts[i].y * dh)
          }
          ctx.closePath()
          ctx.fill()
        }
        if (doStroke) {
          ctx.beginPath()
          const gEdges = g.edges
          const gPtsLen = g.pts.length
          for (let k = 0; k < gEdges.length; k++) {
            const e = gEdges[k]
            const i = e[0], j = e[1]
            if (i >= gPtsLen || j >= gPtsLen) continue
            ctx.moveTo(dx + g.pts[i].x * dw, dy + g.pts[i].y * dh)
            ctx.lineTo(dx + g.pts[j].x * dw, dy + g.pts[j].y * dh)
          }
          ctx.stroke()
        }
      } else {
        ctx.beginPath()
        ctx.moveTo(dx + g.pts[0].x * dw, dy + g.pts[0].y * dh)
        for (let i = 1; i < g.pts.length; i++) {
          ctx.lineTo(dx + g.pts[i].x * dw, dy + g.pts[i].y * dh)
        }
        ctx.stroke()
      }
    }
  }

  // Per-axis colored lines (from Gen 3D)
  if (signal.axes) {
    for (const axis of signal.axes) {
      ctx.strokeStyle = `rgb(${Math.round(axis.color.r * 255)},${Math.round(axis.color.g * 255)},${Math.round(axis.color.b * 255)})`
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(dx + axis.pts[0].x * dw, dy + axis.pts[0].y * dh)
      ctx.lineTo(dx + axis.pts[1].x * dw, dy + axis.pts[1].y * dh)
      ctx.stroke()
    }
  }

  resetPen(ctx)
}

// Lo-fi scalar: chunky bar
function drawScalarLofi(ctx, signal, x, y, w, h, p) {
  ctx.globalAlpha = p.opacity / 100
  const norm = signal.value / 100
  const barH = norm * h
  ctx.fillStyle = penColor(p, SCOPE_COLOR)
  ctx.fillRect(x + 4, y + h - barH, w - 8, barH)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '9px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(Math.round(signal.value), x + w / 2, y + 12)
  resetPen(ctx)
}

// Lo-fi points: scattered dots
function drawPointsLofi(ctx, signal, x, y, w, h, p) {
  const pts = signal.value
  if (!pts || pts.length === 0) return
  ctx.globalAlpha = p.opacity / 100
  ctx.fillStyle = penColor(p, signal.edges ? WIRE_COLOR : SCOPE_COLOR)
  const r = Math.max(1.5, p.thickness / 2)
  for (const pt of pts) {
    ctx.beginPath()
    ctx.arc(x + pt.x * w, y + pt.y * h, r, 0, Math.PI * 2)
    ctx.fill()
  }
  resetPen(ctx)
}

// Dispatch: auto-detect signal type and draw with pen style
// bipolar: render scalar traces with zero at middle (val=-100 bottom, val=+100 top)
export function drawSignal(ctx, signal, x, y, w, h, history, writeIdx, bufLen, penSignal, bipolar = false) {
  if (!signal) return
  const p = penSignal?.type === 'pen' ? penSignal.value : PEN_DEFAULTS
  const lo = p.lofi > 50
  if (signal.type === 'scalar') {
    if (lo) drawScalarLofi(ctx, signal, x, y, w, h, p)
    else drawScalar(ctx, history, writeIdx, bufLen, x, y, w, h, p, bipolar)
  }
  else if (signal.type === 'color') drawColor(ctx, signal, x, y, w, h, p)
  else if (signal.type === 'points') {
    if (lo) drawPointsLofi(ctx, signal, x, y, w, h, p)
    else drawPoints(ctx, signal, x, y, w, h, p)
  }
}
