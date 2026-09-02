// Shared Canvas2D drawing primitives for display modules
// All draw functions accept an optional pen object for style control

// .js extension so bare node can load this module too (scripts/check-drawsignal-alpha.mjs)
import { PEN_DEFAULTS } from '../../hooks/signals.js'

// inks: canvas — signal defaults drawn on a screen, not chrome on the panel
const SCOPE_COLOR = '#2ecc71' // inks: canvas
const WIRE_COLOR = '#ffffff' // inks: canvas
const REF_COLOR = 'rgba(255,255,255,0.06)' // inks: canvas

// Cache `rgb(r,g,b)` strings on the color object to avoid rebuilding them per
// draw. Invalidated by detecting component changes via a cheap stable hash.
// Color objects are mostly immutable per frame — producers allocate fresh ones
// when values change — so the cache hits >95% of the time in steady state.
function rgbString(c) {
  if (!c) return null
  const hash = (c.r * 255 | 0) * 65536 + (c.g * 255 | 0) * 256 + (c.b * 255 | 0)
  if (c.__rgbHash === hash && c.__rgbStr) return c.__rgbStr
  c.__rgbStr = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`
  c.__rgbHash = hash
  return c.__rgbStr
}

function penColor(p, fallback) {
  return p.color ? rgbString(p.color) : fallback
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
  const { a } = signal.value
  // Capture-then-multiply — a caller's baseline (Console fader) scales the
  // fill; overwriting it absolutely both ignored the fader and left resetPen
  // restoring a STALE baseline from some earlier applyPen (G1, fable-audit-2).
  ctx._baseAlpha = ctx.globalAlpha
  ctx.globalAlpha = ctx._baseAlpha * (p.opacity / 100) * a
  ctx.fillStyle = rgbString(signal.value)
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
    ctx.fillStyle = rgbString(signal.bg)
    ctx.fillRect(x, y, w, h)
  }

  // Apply signal-level opacity (from console send levels)
  if (signal.opacity != null) ctx.globalAlpha *= signal.opacity

  // Override pen thickness if signal carries strokeWidth
  if (signal.strokeWidth != null) ctx.lineWidth = signal.strokeWidth

  // Aspect: contain (aspectLock) is opt-in; everything else fills (cover).
  // Stretch is not a display option — pipe through Transform if you want it.
  let dx, dy, dw, dh
  if (signal.aspectLock) {
    const side = Math.min(w, h)
    dx = x + (w - side) / 2
    dy = y + (h - side) / 2
    dw = side
    dh = side
  } else {
    const side = Math.max(w, h)
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
    // Restore stroke width ONLY — the grid touched lineWidth and strokeStyle,
    // never alpha. The old `applyPen(ctx, p)` here re-captured an already
    // pen-multiplied alpha as the new baseline: pen opacity applied twice, and
    // on displays that never reset alpha per frame (Monitor/Output) the error
    // COMPOUNDED frame over frame (G1, fable-audit-2).
    if (signal.strokeWidth != null) ctx.lineWidth = signal.strokeWidth
    else ctx.lineWidth = p.thickness
  }

  // Optional instancing: signal.instances = [{rotation?, mirror?, offsetX?}, ...] replays
  // the whole shape draw N times with canvas2D transforms around the content center.
  // Cheaper than emitting N rotated copies of every vertex when the repeat is uniform
  // (e.g. Kaleidoscope). Absent = draw once at identity.
  // Transform order on a point: mirror → translate(offsetX, 0) → rotate → (back to world).
  // Note: assumes isotropic rendering (dw === dh) — guaranteed by the aspect
  // branch above (both aspectLock contain and the default fill produce a square).
  const instances = signal.instances && signal.instances.length > 0 ? signal.instances : null
  const instCount = instances ? instances.length : 1
  const centerX = dx + dw * 0.5
  const centerY = dy + dh * 0.5

  // The one alpha every branch below multiplies FROM (base × pen × signal
  // opacity, settled above). Groups and axes used to assign absolutes here,
  // which leaked: a group's 0.3 bled into the next group, axes' 0.5 into the
  // next instance (G1, fable-audit-2).
  const drawAlpha = ctx.globalAlpha

  for (let ii = 0; ii < instCount; ii++) {
    if (instances) {
      const inst = instances[ii]
      ctx.save()
      if (inst.rotation || inst.mirror || inst.offsetX) {
        ctx.translate(centerX, centerY)
        if (inst.rotation) ctx.rotate(inst.rotation)
        if (inst.offsetX) ctx.translate(inst.offsetX * dw, 0)
        if (inst.mirror) ctx.scale(-1, 1)
        ctx.translate(-centerX, -centerY)
      }
    }

    if (signal.edges && signal.edges.length > 0) {
      const color = signal.color
        ? rgbString(signal.color)
        : penColor(p, WIRE_COLOR)

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

      // Stroke — suppressed when pen.fill is on (override: pen.fill flips stroke→fill),
      // or when the signal explicitly opts out with `stroke: false` (block/pixel producers
      // like Life that want crisp filled shapes without the pen's round-capped outline).
      if (!p?.fill && signal.stroke !== false) {
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
        const gc = g.color ? rgbString(g.color) : penColor(p, WIRE_COLOR)
        // multiplicative, and reset per group — no opacity means drawAlpha,
        // not whatever the previous group left behind
        ctx.globalAlpha = g.opacity != null ? drawAlpha * g.opacity : drawAlpha
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
      ctx.globalAlpha = drawAlpha
    }

    // Per-axis colored lines (from Gen 3D) — dimmed relative to the baseline,
    // and restored, so a later instance doesn't inherit the dim
    if (signal.axes) {
      ctx.globalAlpha = drawAlpha * 0.5
      for (const axis of signal.axes) {
        ctx.strokeStyle = rgbString(axis.color)
        ctx.beginPath()
        ctx.moveTo(dx + axis.pts[0].x * dw, dy + axis.pts[0].y * dh)
        ctx.lineTo(dx + axis.pts[1].x * dw, dy + axis.pts[1].y * dh)
        ctx.stroke()
      }
      ctx.globalAlpha = drawAlpha
    }

    if (instances) ctx.restore()
  }

  resetPen(ctx)
}

// Lo-fi scalar: chunky bar
function drawScalarLofi(ctx, signal, x, y, w, h, p) {
  // capture-then-multiply, same discipline as drawColor (G1, fable-audit-2)
  ctx._baseAlpha = ctx.globalAlpha
  ctx.globalAlpha = ctx._baseAlpha * (p.opacity / 100)
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
  ctx._baseAlpha = ctx.globalAlpha
  ctx.globalAlpha = ctx._baseAlpha * (p.opacity / 100)
  if (signal.opacity != null) ctx.globalAlpha *= signal.opacity
  ctx.fillStyle = penColor(p, signal.edges ? WIRE_COLOR : SCOPE_COLOR)
  const r = Math.max(1.5, p.thickness / 2)
  // Match drawPoints aspect policy: aspectLock = contain, default = cover.
  // Both branches produce an isotropic square region so lofi doesn't warp the signal.
  let dx, dy, dw, dh
  if (signal.aspectLock) {
    const side = Math.min(w, h)
    dx = x + (w - side) / 2
    dy = y + (h - side) / 2
    dw = dh = side
  } else {
    const side = Math.max(w, h)
    dx = x + (w - side) / 2
    dy = y + (h - side) / 2
    dw = dh = side
  }
  for (const pt of pts) {
    ctx.beginPath()
    ctx.arc(dx + pt.x * dw, dy + pt.y * dh, r, 0, Math.PI * 2)
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
