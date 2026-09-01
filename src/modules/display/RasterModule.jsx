// RasterModule — "last stop" pixel-domain display. Consumes signals and prints
// pixels; outputs nothing. Terminal module by design: the wire protocol stays
// vector (ARCHITECTURE §1/§7) — everything pixel-shaped happens inside.
// Ops: fb (video feedback) · smr (smear) · blr (blur) · slit (slitscan) ·
// dith (ordered dither) · ascii.
// 12HP 3U, display category.

import { useRef, useState } from 'react'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import CvKnob from '../parametric/CvKnob'
import Knob from '../parametric/Knob'
import Selector from '../parametric/Selector'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'

const MODES = ['fb', 'smr', 'blr', 'slit', 'dith', 'ascii']
const SLIT_RING = 24
// Bayer 4×4 ordered-dither thresholds, /16
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
const ASCII_RAMP = ' .:-=+*#%@'
const DUMMY_HIST = new Float32Array(2) // drawSignal's scalar branch wants a history buffer

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function RasterPanel({ canvasRef, mode, amt, res, fade, enabled, onToggle, onModeChange, onAmtChange, onResChange, onFadeChange, id, inConn, inRef, penConn, penRef, amtConn, amtInRef }) {
  return (
    <Module label="Raster" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4 }}>
        <canvas
          ref={canvasRef}
          width={240}
          height={140}
          style={{ flex: 1, width: '100%', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Selector value={mode} options={MODES} onChange={onModeChange} />
          <CvKnob port="amt" moduleId={id} active={amtConn} signalRef={amtInRef} value={amt} onChange={onAmtChange} label="amt" />
          <Knob value={res} onChange={onResChange} label="res" />
          <Knob value={fade} onChange={onFadeChange} label="fade" />
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
          <LabeledJack type="in" port="pen" moduleId={id} active={penConn} signalRef={penRef} label="pen" size="sm" />
        </div>
      </div>
    </Module>
  )
}

export default function RasterModule({ id = 'raster1', init, preview }) {
  if (preview) return <RasterPanel canvasRef={{ current: null }} mode="fb" amt={60} res={50} fade={70} enabled={false} onToggle={() => {}} onModeChange={() => {}} onAmtChange={() => {}} onResChange={() => {}} onFadeChange={() => {}} id={id} inConn={false} inRef={{ current: null }} penConn={false} penRef={{ current: null }} amtConn={false} amtInRef={{ current: null }} />

  const canvasRef = useRef(null)
  const [mode, setMode] = useState(init?.mode ?? 'fb')
  const [amt, setAmt] = useState(init?.amt ?? 60)
  const [res, setRes] = useState(init?.res ?? 50)
  const [fade, setFade] = useState(init?.fade ?? 70)
  const [enabled, setEnabled] = useModuleEnabled()

  const modeRef = useRef('fb'); modeRef.current = mode
  const amtRef = useRef(60); amtRef.current = amt
  const resRef = useRef(50); resRef.current = res
  const fadeRef = useRef(70); fadeRef.current = fade
  const enabledRef = useRef(true); enabledRef.current = enabled

  const inSigRef = useRef(null)
  const penInRef = useRef(null)
  const amtInRef = useRef(null)

  // Pixel machinery — sized lazily to the visible canvas, rebuilt on resize.
  // fresh = this frame's vector render; histA/histB ping-pong for fb/smr
  // (drawing a canvas onto itself is UB-adjacent); ring = slitscan history.
  const pixRef = useRef({ w: 0, h: 0, fresh: null, histA: null, histB: null, ring: null, ringIdx: 0, sample: null })

  const cp = useConnectedPorts(id)
  const saveStateRef = useRef({})
  saveStateRef.current = { mode, amt, res, fade }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'any' },
      pen: { type: 'pen' },
      amt: { type: 'scalar', cv: 'offset' },
    },
    outputs: {},
    process: (inputs) => {
      inSigRef.current = enabledRef.current ? inputs.in : null
      penInRef.current = inputs.pen
      amtInRef.current = inputs.amt
      return {}
    },
  })

  useCanvasLoop(canvasRef, () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    if (!w || !h) return

    if (!enabledRef.current) {
      ctx.fillStyle = 'rgba(8,8,8,1)'
      ctx.fillRect(0, 0, w, h)
      return
    }

    const px = pixRef.current
    if (px.w !== w || px.h !== h) {
      px.w = w; px.h = h
      px.fresh = makeCanvas(w, h)
      px.histA = makeCanvas(w, h)
      px.histB = makeCanvas(w, h)
      // The 24-canvas slit ring is ~3MB at panel size and only slit reads it —
      // allocated on the first slit frame instead of in every mode (G5,
      // fable-audit-2). Nulled here so a resize re-sizes it on next use.
      px.ring = null
      px.ringIdx = 0
      px.sample = makeCanvas(96, 54)
    }

    // 1. Render this frame's input to the fresh buffer (vector → pixels)
    const fctx = px.fresh.getContext('2d')
    fctx.clearRect(0, 0, w, h)
    fctx.fillStyle = '#000'
    fctx.fillRect(0, 0, w, h)
    const sig = inSigRef.current
    if (sig) drawSignal(fctx, sig, 0, 0, w, h, DUMMY_HIST, 0, DUMMY_HIST.length, penInRef.current)

    const amtVal = readCv(amtInRef.current, amtRef.current) / 100 // 0-1
    const fadeVal = fadeRef.current / 100 // 0-1
    const m = modeRef.current

    if (m === 'fb' || m === 'smr') {
      // Ping-pong accumulate: decayed history (+ zoom for fb) + fresh on top
      const prev = px.histA, next = px.histB
      const nctx = next.getContext('2d')
      nctx.clearRect(0, 0, w, h)
      nctx.fillStyle = '#000'
      nctx.fillRect(0, 0, w, h)
      nctx.globalAlpha = 0.5 + fadeVal * 0.49 // 0.5–0.99 persistence
      if (m === 'fb') {
        // Feedback transform: amt = zoom, res doubles as rotation (res is
        // otherwise unused in fb/smr) — zoom + rotate in the loop = howl-around
        const z = amtVal * 0.06
        const rot = ((resRef.current - 50) / 50) * 0.04
        nctx.save()
        nctx.translate(w / 2, h / 2)
        nctx.rotate(rot)
        nctx.scale(1 + z, 1 + z)
        nctx.translate(-w / 2, -h / 2)
        nctx.drawImage(prev, 0, 0)
        nctx.restore()
      } else {
        nctx.drawImage(prev, 0, 0)
      }
      nctx.globalAlpha = m === 'smr' ? 0.85 : 1
      nctx.drawImage(px.fresh, 0, 0)
      nctx.globalAlpha = 1
      px.histA = next; px.histB = prev
      ctx.drawImage(next, 0, 0)
      return
    }

    if (m === 'blr') {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.filter = `blur(${(amtVal * 8).toFixed(1)}px)`
      ctx.drawImage(px.fresh, 0, 0)
      ctx.filter = 'none'
      return
    }

    if (m === 'slit') {
      if (!px.ring) px.ring = Array.from({ length: SLIT_RING }, () => makeCanvas(w, h))
      // Push fresh into the ring, compose output from per-band delayed frames
      px.ringIdx = (px.ringIdx + 1) % SLIT_RING
      const rctx = px.ring[px.ringIdx].getContext('2d')
      rctx.clearRect(0, 0, w, h)
      rctx.drawImage(px.fresh, 0, 0)
      const bands = Math.max(4, Math.round(4 + (resRef.current / 100) * 44))
      const bh = h / bands
      const depth = amtVal * (SLIT_RING - 1)
      for (let b = 0; b < bands; b++) {
        const delay = Math.round((b / Math.max(1, bands - 1)) * depth)
        const src = px.ring[(px.ringIdx - delay + SLIT_RING * 2) % SLIT_RING]
        const y = Math.floor(b * bh)
        const hh = Math.ceil(bh)
        ctx.drawImage(src, 0, y, w, hh, 0, y, w, hh)
      }
      return
    }

    // dith / ascii — sample the fresh buffer at low res, repaint as cells
    const cols = Math.max(16, Math.round(16 + (resRef.current / 100) * 80))
    const rows = Math.max(9, Math.round(cols * (h / w)))
    if (px.sample.width !== cols || px.sample.height !== rows) {
      px.sample.width = cols
      px.sample.height = rows
    }
    const sctx = px.sample.getContext('2d', { willReadFrequently: true })
    sctx.drawImage(px.fresh, 0, 0, cols, rows)
    const img = sctx.getImageData(0, 0, cols, rows).data
    const cw = w / cols, chh = h / rows
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)

    if (m === 'dith') {
      ctx.fillStyle = '#fff'
      const bias = (amtVal - 0.5) * 0.6
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = (gy * cols + gx) * 4
          const lum = (img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114) / 255
          const threshold = BAYER4[gy & 3][gx & 3] / 16
          if (lum + bias > threshold) ctx.fillRect(gx * cw, gy * chh, Math.ceil(cw), Math.ceil(chh))
        }
      }
      return
    }

    // ascii
    ctx.fillStyle = '#fff'
    ctx.font = `${Math.ceil(chh)}px monospace`
    ctx.textBaseline = 'top'
    const rampMax = ASCII_RAMP.length - 1
    const gain = 0.5 + amtVal
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const i = (gy * cols + gx) * 4
        const lum = Math.min(1, ((img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114) / 255) * gain)
        const chIdx = Math.round(lum * rampMax)
        if (chIdx > 0) ctx.fillText(ASCII_RAMP[chIdx], gx * cw, gy * chh)
      }
    }
  })

  return <RasterPanel canvasRef={canvasRef} mode={mode} amt={amt} res={res} fade={fade} enabled={enabled} onToggle={() => setEnabled(!enabled)} onModeChange={setMode} onAmtChange={setAmt} onResChange={setRes} onFadeChange={setFade} id={id} inConn={cp.has('in')} inRef={inSigRef} penConn={cp.has('pen')} penRef={penInRef} amtConn={cp.has('amt')} amtInRef={amtInRef} />
}
