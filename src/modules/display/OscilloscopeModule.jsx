// OscilloscopeModule — expression generator with reference-style visualizer
// 3U. Layout ported from kol-mirrors ExpressionReference.jsx (Oscilloscope component).

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import { compile } from '../../hooks/useExpressionValue'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import TextInput from '../parametric/TextInput'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const BUS_KEYS = ['a', 'b']

// Reference content (ported from kol-mirrors ExpressionReference.jsx)
const EXAMPLES = [
  ['wave(t*2)', 'Fast sine'],
  ['saw(t)*0.8', 'Ramp to 80'],
  ['tri(t*0.5)', 'Slow bounce'],
  ['ease(t*2, 4)', 'Fast + punchy'],
  ['pulse(t*3)', 'Fast toggle'],
  ['pulse(t, 0.3)', 'PWM 30%'],
  ['sin(t)*30+50', 'Sine 20–80'],
  ['abs(sin(t*3))*max', 'Bouncing'],
  ['rand()', 'Noise'],
  ['t*20 % max', 'Linear ramp'],
  ['exp(t)', 'Exponential'],
  ['log(t)', 'Logarithmic'],
  ['bell(t)', 'Bell curve'],
  ['step(t, 4)', '4 steps'],
  ['step(t, 8)', '8 steps'],
  ['exp(t)*0.5+25', 'Exp 25–75'],
  ['bell(t*2)', 'Fast bell'],
  ['wave(t)+saw(t*2)*0.3', 'Layered'],
  ['tri(t)*pulse(t*4)', 'Gated bounce'],
  ['step(t, 6)*0.8+10', 'Steps 10–90'],
  ['ease(t*0.3, 3)*0.6+20', 'Slow dramatic'],
  // --- with inputs ---
  ['a', 'A passthrough'],
  ['(a + b) / 2', 'A+B average'],
  ['wave(t*2) + a/100', 'Wave + A offset'],
  ['wave(t * (1 + a/100))', 'A = frequency'],
  ['wave(t*2 + a/10)', 'A = phase'],
  ['a/100 * wave(t*2)', 'A = amplitude'],
  ['a > 50 ? wave(t*4) : wave(t)', 'A = tempo gate'],
]

const REFERENCE_GROUPS = [
  { group: 'Waves', items: [
    ['wave(t)', 'Smooth up and down'],
    ['saw(t)', 'Ramp up, jump back'],
    ['tri(t)', 'Ramp up, ramp down'],
    ['pulse(t)', 'Snap on/off'],
    ['rand()', 'Random every frame'],
    ['bell(t)', 'Bell curve'],
    ['exp(t)', 'Exponential ramp'],
    ['log(t)', 'Logarithmic ramp'],
    ['step(t, 4)', 'Staircase'],
  ]},
  { group: 'Functions', items: [
    ['sin', '-1 to 1'],
    ['cos', '-1 to 1'],
    ['abs', 'Absolute'],
    ['floor', '↓ Round'],
    ['ceil', '↑ Round'],
    ['round', 'Nearest'],
    ['sqrt', '√'],
    ['pow', 'Power'],
    ['PI', '3.14159'],
    ['PHI', '1.61803'],
  ]},
  { group: 'Variables', items: [
    ['t', 'Seconds'],
    ['f', 'Frame count'],
    ['min', 'Knob minimum'],
    ['max', 'Knob maximum'],
  ]},
  { group: 'Curves', items: [
    ['ease(t)', 'Gentle breath'],
    ['ease(t, 1)', 'Linear, no curve'],
    ['ease(t, 5)', 'Dramatic punch'],
    ['ease(t, 0.5)', 'Quick flick'],
  ]},
  { group: 'Range', items: [
    ['saw(t)*0.8', '0 to 80'],
    ['wave(t)*0.5+25', '25 to 75'],
    ['tri(t)*0.3+70', '70 to 100'],
    ['ease(t)*0.2', '0 to 20'],
  ]},
  { group: 'Speed', items: [
    ['wave(t*0.5)', 'Half speed'],
    ['saw(t*2)', 'Double speed'],
    ['tri(t*3)', '3x faster'],
    ['ease(t*5)', '5x faster'],
    ['pulse(t*0.1)', 'Very slow'],
  ]},
  { group: 'Tips', items: [
    [null, 'Click an item to load it into the expression'],
    [null, 'Functions / variables replace the expression'],
    [null, 'Edit the text input directly for custom math'],
  ]},
]
const TRACE_COLOR = '#2dd4bf'
const REF_COLOR = 'rgba(231,76,60,0.3)'
const REF_LABEL = 'rgba(231,76,60,0.4)'
const GRID_COLOR = 'rgba(255,255,255,0.06)'
const GRID_LABEL = 'rgba(255,255,255,0.2)'
const PREVIEW_COLOR = 'rgba(255,255,255,0.15)'

function NumField({ label, value, onChange }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label ? <span className="kol-helper-8" style={{ color: 'rgba(255,255,255,0.48)', textTransform: 'uppercase', lineHeight: 1 }}>{label}</span> : null}
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (v === '' || v === '-' || !isNaN(Number(v))) {
            onChange(v === '' || v === '-' ? v : Number(v))
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const step = e.shiftKey ? 10 : 1
            const dir = e.key === 'ArrowUp' ? 1 : -1
            onChange((Number(value) || 0) + step * dir)
          }
        }}
        className="kol-helper-8"
        style={{
          width: 36, height: 20, textAlign: 'right',
          background: 'var(--kol-surface-primary)', color: '#fff',
          border: 'none', borderRadius: 2,
          padding: '0 6px', outline: 'none', fontFamily: 'var(--kol-font-family-mono)',
        }}
      />
    </span>
  )
}

function RefDropdown({ label, groups, onSelect }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const toggle = useCallback(() => {
    if (open) { setOpen(false); return }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ top: rect.bottom + 2, left: rect.left })
    setOpen(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        className="kol-helper-8"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggle() }}
        style={{
          color: 'rgba(255,255,255,0.6)',
          background: 'var(--kol-surface-primary)',
          border: 'none', borderRadius: 2,
          padding: '0 8px', height: 24, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          fontFamily: 'var(--kol-font-family-mono)',
        }}
      >{label}</button>
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onPointerDown={() => setOpen(false)} />
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', top: pos.top, left: pos.left,
              minWidth: 220, maxHeight: 320, overflowY: 'auto',
              background: 'rgba(20,20,20,0.97)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3,
              zIndex: 9999, padding: '4px 0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {groups.map(({ group, items }) => (
              <div key={group}>
                <div className="kol-helper-8" style={{
                  color: 'rgba(255,255,255,0.4)', padding: '4px 8px 2px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>{group}</div>
                {items.map(([expr, desc], i) => (
                  <div
                    key={`${group}-${i}`}
                    onPointerDown={() => { if (expr != null) { onSelect(expr); setOpen(false) } }}
                    className="kol-helper-8"
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                      padding: '3px 8px',
                      color: 'rgba(255,255,255,0.85)',
                      cursor: expr != null ? 'pointer' : 'default',
                      fontFamily: 'var(--kol-font-family-mono)',
                    }}
                  >
                    <span style={{ color: expr != null ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>{expr ?? '—'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none' }}>{desc}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}

function IconAction({ label, onClick }) {
  return (
    <span
      onClick={onClick}
      className="kol-helper-8"
      style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.48)', textTransform: 'uppercase', userSelect: 'none', lineHeight: 1 }}
    >{label}</span>
  )
}

function OscPanel({
  canvasRef, expr, onExprChange,
  vmin, vmax, sec, ofs, onVminChange, onVmaxChange, onSecChange, onOfsChange,
  onFit, onReset, onPolarity, polarityLabel,
  enabled, onToggle, id,
  aConn, aRef, bConn, bRef, clkConn, clkRef, outRef,
}) {
  return (
    <Module label="Scope+" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px', gap: 0 }}>

        {/* 1. Text input + reference dropdowns */}
        <div style={{ paddingBottom: 8, flexShrink: 0, display: 'flex', gap: 4, alignItems: 'center' }}>
          <TextInput value={expr} onCommit={onExprChange} placeholder="empty = passthrough input A" style={{ flex: 1, height: 24 }} />
          <RefDropdown label="Ex" groups={[{ group: 'Examples', items: EXAMPLES }]} onSelect={onExprChange} />
          <RefDropdown label="Ref" groups={REFERENCE_GROUPS} onSelect={onExprChange} />
        </div>

        {/* 2. Canvas — flex-1 */}
        <div style={{ flex: 1, minHeight: 80, background: 'rgba(8,8,8,0.95)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
          <canvas ref={canvasRef} width={400} height={160} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* 3. Fit / polarity / Reset row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 16, paddingTop: 2 }}>
          <IconAction label="Fit" onClick={onFit} />
          <IconAction label={polarityLabel} onClick={onPolarity} />
          <IconAction label="Reset" onClick={onReset} />
        </div>

        <Divider className="py-2" />

        {/* 4. Min / Max / Sec / Ofs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 24 }}>
          <NumField label="Min" value={vmin} onChange={onVminChange} />
          <NumField label="Max" value={vmax} onChange={onVmaxChange} />
          <NumField label="Sec" value={sec} onChange={onSecChange} />
          <NumField label="Ofs" value={ofs} onChange={onOfsChange} />
        </div>

        {/* 8. Jacks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <LabeledJack type="in" port="a" moduleId={id} active={aConn} signalRef={aRef} label="a" />
            <LabeledJack type="in" port="b" moduleId={id} active={bConn} signalRef={bRef} label="b" />
            <LabeledJack type="in" port="rst" moduleId={id} active={clkConn} signalRef={clkRef} label="rst" />
          </div>
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>

      </div>
    </Module>
  )
}

const NULL_REF = { current: null }

export default function OscilloscopeModule({ id = 'osc1', init, preview }) {
  if (preview) return <OscPanel canvasRef={NULL_REF} expr="wave(t)" onExprChange={() => {}}
    vmin={-100} vmax={100} sec={5} ofs={0} onVminChange={() => {}} onVmaxChange={() => {}} onSecChange={() => {}} onOfsChange={() => {}}
    onFit={() => {}} onReset={() => {}} onPolarity={() => {}} polarityLabel="-/+"
    enabled={false} onToggle={() => {}} id={id}
    aConn={false} aRef={NULL_REF} bConn={false} bRef={NULL_REF} clkConn={false} clkRef={NULL_REF} outRef={NULL_REF} />

  const canvasRef = useRef(null)
  const [expr, setExpr] = useState(init?.expr ?? 'wave(t)')
  const [vmin, setVmin] = useState(init?.vmin ?? 0)
  const [vmax, setVmax] = useState(init?.vmax ?? 100)
  const [sec, setSec] = useState(init?.sec ?? 5)
  const [ofs, setOfs] = useState(init?.ofs ?? 0)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const fnRef = useRef(null)
  useEffect(() => { fnRef.current = compile(expr, BUS_KEYS) }, [expr])

  // History buffer for input A — used when expression is empty (passthrough mode)
  const HIST_LEN = 400
  const historyARef = useRef(new Float32Array(HIST_LEN))
  const histWriteIdxRef = useRef(0)

  const enabledRef = useRef(true)
  const outRef = useRef(null)
  const aRef = useRef(null)
  const bRef = useRef(null)
  const clkRef = useRef(null)
  const tStartRef = useRef(0)
  const frameRef = useRef(0)
  const prevClkRef = useRef(false)
  const currentTRef = useRef(0)
  const currentBusRef = useRef({ a: 0, b: 0 })
  const viewRef = useRef({ vmin: -100, vmax: 100, sec: 5, ofs: 0 })

  enabledRef.current = enabled
  viewRef.current = { vmin, vmax, sec, ofs }

  const aConn = cp.has('a')
  const bConn = cp.has('b')
  const clkConn = cp.has('rst')

  const saveStateRef = useRef({})
  saveStateRef.current = { expr, vmin, vmax, sec, ofs }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' }, rst: { type: 'scalar' } },
    outputs: { out: { type: 'scalar' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }

      aRef.current = inputs.a
      bRef.current = inputs.b
      clkRef.current = inputs.rst

      const clkHigh = readScalar(inputs.rst) > 0
      if (clkHigh && !prevClkRef.current) {
        tStartRef.current = t
        frameRef.current = 0
      }
      prevClkRef.current = clkHigh

      const relT = t - tStartRef.current
      const frame = frameRef.current++
      const bus = { a: readScalar(inputs.a), b: readScalar(inputs.b) }

      currentTRef.current = relT
      currentBusRef.current = bus

      // Always push input A into history ring — used by passthrough draw when expression is empty
      const aVal = readScalar(inputs.a)
      historyARef.current[histWriteIdxRef.current] = aVal
      histWriteIdxRef.current = (histWriteIdxRef.current + 1) % HIST_LEN

      let out = null
      if (fnRef.current) {
        try { out = scalar(fnRef.current(relT, frame, viewRef.current.vmin, viewRef.current.vmax, bus)) } catch { /* silent */ }
      } else if (inputs.a) {
        // Empty expression — pass through input A as the output
        out = scalar(aVal)
      }
      outRef.current = out
      return { out }
    },
  })

  const fit = () => {
    const fn = fnRef.current
    if (!fn) return
    const { sec } = viewRef.current
    const bus = currentBusRef.current
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i <= 300; i++) {
      const t = (i / 300) * sec
      try { const v = fn(t, Math.round(t * 60), -1000, 1000, bus); if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v } } catch { break }
    }
    if (lo !== Infinity) {
      const m = (hi - lo) * 0.1 || 1
      setVmin(Math.floor(lo - m))
      setVmax(Math.ceil(hi + m))
    }
  }

  const reset = () => {
    setVmin(0); setVmax(100); setSec(5); setOfs(0)
  }

  const polarity = () => {
    // Toggle between bipolar (-100..100) and unipolar (0..100)
    if (vmin < 0) { setVmin(0); setVmax(100) }
    else { setVmin(-100); setVmax(100) }
  }
  const polarityLabel = vmin < 0 ? '-/+' : 'UNI'

  useCanvasLoop(canvasRef, () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    if (!w || !h) return

    ctx.fillStyle = 'rgba(8,8,8,0.95)'
    ctx.fillRect(0, 0, w, h)

    const v = viewRef.current
    const mn = v.vmin
    const mx = v.vmax
    const dur = v.sec
    const px = v.ofs

    const pad = 24
    const innerH = h - pad * 2
    const range = (mx - mn) || 1
    const center = (mn + mx) / 2
    const lo = center - range / 2
    const toY = (val) => pad + innerH * (1 - (val - lo) / range)
    const toT = (pixelX) => (pixelX / w) * dur + px

    const yTop = toY(mx)
    const yBot = toY(mn)

    ctx.strokeStyle = REF_COLOR
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(0, yTop); ctx.lineTo(w, yTop); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, yBot); ctx.lineTo(w, yBot); ctx.stroke()
    ctx.setLineDash([])
    ctx.font = '9px var(--kol-font-family-mono, monospace)'
    ctx.fillStyle = REF_LABEL
    ctx.fillText(String(mx), w - 28, yTop + 10)
    ctx.fillText(String(mn), w - 28, yBot - 4)

    // Zero axis — only when zero is within the visible range
    if (mn < 0 && mx > 0) {
      const yZero = toY(0)
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, yZero); ctx.lineTo(w, yZero); ctx.stroke()
    }

    if (!enabledRef.current) return
    const fn = fnRef.current

    // Empty-expression passthrough: draw input A history as rolling trace
    if (!fn) {
      const hist = historyARef.current
      const wi = histWriteIdxRef.current
      ctx.strokeStyle = TRACE_COLOR
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < w; i++) {
        const histIdx = (wi + Math.floor((i / w) * HIST_LEN)) % HIST_LEN
        const y = toY(hist[histIdx])
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y)
      }
      ctx.stroke()
      return
    }

    const bus = currentBusRef.current
    // Playhead time: prefer process-provided t; fall back to wall clock so preview/static contexts still animate
    const curT = currentTRef.current || (performance.now() / 1000)
    const playT = curT % dur
    const playX = ((playT - px) / dur) * w

    let vMin = Infinity, vMax = -Infinity
    const samples = new Array(w)
    for (let i = 0; i < w; i++) {
      const t = toT(i)
      try {
        const sv = fn(t, Math.round(t * 60), mn, mx, bus)
        samples[i] = sv
        if (sv < vMin) vMin = sv
        if (sv > vMax) vMax = sv
      } catch { samples[i] = 0 }
    }
    const vMid = (vMin + vMax) / 2

    if (isFinite(vMin) && isFinite(vMax)) {
      ctx.fillStyle = GRID_LABEL
      ctx.strokeStyle = GRID_COLOR
      for (const vv of [vMax, vMid, vMin]) {
        const y = toY(vv)
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
        ctx.fillText(Math.round(vv), 4, y - 3)
      }
    }

    ctx.strokeStyle = PREVIEW_COLOR
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < w; i++) {
      const y = toY(samples[i])
      i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y)
    }
    ctx.stroke()

    ctx.strokeStyle = 'rgba(45,212,191,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(playX, 0); ctx.lineTo(playX, h); ctx.stroke()

    ctx.strokeStyle = TRACE_COLOR
    ctx.lineWidth = 2
    ctx.beginPath()
    const traceEnd = Math.min(playX, w)
    for (let i = 0; i < traceEnd; i++) {
      const y = toY(samples[i])
      i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y)
    }
    ctx.stroke()

    try {
      const curV = fn(playT, Math.round(playT * 60), mn, mx, bus)
      const dotY = toY(curV)
      ctx.fillStyle = TRACE_COLOR
      ctx.beginPath(); ctx.arc(playX, dotY, 3, 0, Math.PI * 2); ctx.fill()
    } catch {}
  })

  return <OscPanel canvasRef={canvasRef} expr={expr} onExprChange={setExpr}
    vmin={vmin} vmax={vmax} sec={sec} ofs={ofs} onVminChange={setVmin} onVmaxChange={setVmax} onSecChange={setSec} onOfsChange={setOfs}
    onFit={fit} onReset={reset} onPolarity={polarity} polarityLabel={polarityLabel}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    aConn={aConn} aRef={aRef} bConn={bConn} bRef={bRef} clkConn={clkConn} clkRef={clkRef} outRef={outRef} />
}
