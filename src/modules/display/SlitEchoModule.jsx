// SlitEchoModule — analog TV emulator, the raster descendant of Magneto.
// Broadcast repeater chain + vidicon persistence + slitscan + Vasulka/Paik
// hacking layer (scanline skew, v-roll, chroma split, sync tear).
// Terminal display module: consumes signals, prints pixels, outputs nothing —
// wire protocol stays vector (ARCHITECTURE §1/§7). All ops are drawImage /
// filter / globalCompositeOperation — no getImageData in the loop.
// Design doc: .kol/llm-plan/08-slit-echo-dev.md
// 20HP 3U, display category.

import { useRef, useState } from 'react'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { readCv, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import CvKnob from '../parametric/CvKnob'
import Knob from '../parametric/Knob'
import FlipToggle from '../parametric/FlipToggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'

// Frame-indexed ring — deliberate: analog TV has no timestamps, a frame is a
// field. Unlike Magneto's wall-clock tape, dropped FPS here degrades the
// picture like a bad transmitter would. ponytail: 48 frames ≈ 0.8s at 60fps.
const RING = 48
const TEAR_SECONDS = 0.3
const SKEW_BANDS = 24
const WOB_BANDS = 24
const DUMMY_HIST = new Float32Array(2)
// Echo-generation filter strings are deterministic in g — built once instead
// of a template per drawImage per frame (G6's free half, fable-audit-2)
const ECHO_FILTERS = [null, ...Array.from({ length: 6 }, (_, i) => {
  const g = i + 1
  return `blur(${(g * 0.5).toFixed(1)}px) saturate(${Math.max(40, 100 - g * 12)}%)`
})]

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function SlitEchoPanel({ canvasRef, trail, echo, space, fade, slit, bands, axis, skew, roll, split, wob, spin, crt, vhs, enabled, onToggle, id,
  onTrail, onEcho, onSpace, onFade, onSlit, onBands, onAxis, onSkew, onRoll, onSplit, onWob, onSpin, onCrt, onVhs,
  inConn, inRef, penConn, penRef, trigConn, trigRef, sltConn, sltRef, skwConn, skwRef, rllConn, rllRef, splConn, splRef, wobConn, wobRef }) {
  return (
    <Module label="Slit-Echo" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4 }}>
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          style={{ flex: 1, width: '100%', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Knob value={trail} onChange={onTrail} label="trail" />
          <Knob value={echo} onChange={onEcho} label="echo" />
          <Knob value={space} onChange={onSpace} label="space" />
          <Knob value={fade} onChange={onFade} label="fade" />
          <CvKnob port="slt" moduleId={id} active={sltConn} signalRef={sltRef} value={slit} onChange={onSlit} label="slit" />
          <Knob value={bands} onChange={onBands} label="bands" />
          <FlipToggle value={axis} onChange={onAxis} labelA="h" labelB="v" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <CvKnob port="skw" moduleId={id} active={skwConn} signalRef={skwRef} value={skew} onChange={onSkew} label="skew" />
          <CvKnob port="wob" moduleId={id} active={wobConn} signalRef={wobRef} value={wob} onChange={onWob} label="wob" />
          <CvKnob port="rll" moduleId={id} active={rllConn} signalRef={rllRef} value={roll} onChange={onRoll} label="roll" />
          <CvKnob port="spl" moduleId={id} active={splConn} signalRef={splRef} value={split} onChange={onSplit} label="split" />
          <Knob value={spin} onChange={onSpin} label="spin" bipolar />
          <Knob value={crt} onChange={onCrt} label="crt" />
          <Knob value={vhs} onChange={onVhs} label="vhs" />
          <LabeledJack type="in" port="trig" moduleId={id} active={trigConn} signalRef={trigRef} label="tear" />
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
          <LabeledJack type="in" port="pen" moduleId={id} active={penConn} signalRef={penRef} label="pen" size="sm" />
        </div>
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }

export default function SlitEchoModule({ id = 'slitEcho1', init, preview }) {
  if (preview) return <SlitEchoPanel canvasRef={{ current: null }} trail={55} echo={40} space={30} fade={60} slit={45} bands={40} axis={false} skew={20} roll={0} split={25} wob={0} spin={0} crt={30} vhs={0} enabled={false} onToggle={() => {}} id={id}
    onTrail={() => {}} onEcho={() => {}} onSpace={() => {}} onFade={() => {}} onSlit={() => {}} onBands={() => {}} onAxis={() => {}} onSkew={() => {}} onRoll={() => {}} onSplit={() => {}} onWob={() => {}} onSpin={() => {}} onCrt={() => {}} onVhs={() => {}}
    inConn={false} inRef={NULL_REF} penConn={false} penRef={NULL_REF} trigConn={false} trigRef={NULL_REF} sltConn={false} sltRef={NULL_REF} skwConn={false} skwRef={NULL_REF} rllConn={false} rllRef={NULL_REF} splConn={false} splRef={NULL_REF} wobConn={false} wobRef={NULL_REF} />

  const canvasRef = useRef(null)
  const [trail, setTrail] = useState(init?.trail ?? 55)
  const [echo, setEcho] = useState(init?.echo ?? 40)
  const [space, setSpace] = useState(init?.space ?? 30)
  const [fade, setFade] = useState(init?.fade ?? 60)
  const [slit, setSlit] = useState(init?.slit ?? 45)
  const [bands, setBands] = useState(init?.bands ?? 40)
  const [axis, setAxis] = useState(init?.axis ?? false) // false = h bands, true = v columns
  const [skew, setSkew] = useState(init?.skew ?? 20)
  const [roll, setRoll] = useState(init?.roll ?? 0)
  const [split, setSplit] = useState(init?.split ?? 25)
  const [wob, setWob] = useState(init?.wob ?? 0)
  const [spin, setSpin] = useState(init?.spin ?? 0) // bipolar [-100,100], 0 = no rotation
  const [crt, setCrt] = useState(init?.crt ?? 0)
  const [vhs, setVhs] = useState(init?.vhs ?? 0)
  const [enabled, setEnabled] = useModuleEnabled()

  const trailRef = useRef(55); trailRef.current = trail
  const echoRef = useRef(40); echoRef.current = echo
  const spaceRef = useRef(30); spaceRef.current = space
  const fadeRef = useRef(60); fadeRef.current = fade
  const slitRef = useRef(45); slitRef.current = slit
  const bandsRef = useRef(40); bandsRef.current = bands
  const axisRef = useRef(false); axisRef.current = axis
  const skewRef = useRef(20); skewRef.current = skew
  const rollRef = useRef(0); rollRef.current = roll
  const splitRef = useRef(25); splitRef.current = split
  const wobRef = useRef(0); wobRef.current = wob
  const spinRef = useRef(0); spinRef.current = spin
  const crtRef = useRef(0); crtRef.current = crt
  const vhsRef = useRef(0); vhsRef.current = vhs
  const enabledRef = useRef(true); enabledRef.current = enabled

  const inSigRef = useRef(null)
  const penInRef = useRef(null)
  const trigInRef = useRef(null)
  const sltInRef = useRef(null)
  const skwInRef = useRef(null)
  const rllInRef = useRef(null)
  const splInRef = useRef(null)
  const wobInRef = useRef(null)
  const prevTrigRef = useRef(false)
  const tearUntilRef = useRef(0)
  const tearSeedRef = useRef(1)
  const timeRef = useRef(0)
  const rollPosRef = useRef(0)

  // Pixel machinery, sized lazily to the visible canvas
  const pixRef = useRef({ w: 0, h: 0, fresh: null, live: null, accA: null, accB: null, hackA: null, hackB: null, vig: null, scan: null, ring: null, ringIdx: 0 })

  const cp = useConnectedPorts(id)
  const saveStateRef = useRef({})
  saveStateRef.current = { trail, echo, space, fade, slit, bands, axis, skew, roll, split, wob, spin, crt, vhs }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'any' },
      pen: { type: 'pen' },
      trig: { type: 'scalar' },
      slt: { type: 'scalar', cv: 'offset' },
      skw: { type: 'scalar', cv: 'offset' },
      rll: { type: 'scalar', cv: 'offset' },
      spl: { type: 'scalar', cv: 'offset' },
      wob: { type: 'scalar', cv: 'offset' },
    },
    outputs: {},
    process: (inputs, dt, t) => {
      inSigRef.current = enabledRef.current ? inputs.in : null
      penInRef.current = inputs.pen
      trigInRef.current = inputs.trig
      sltInRef.current = inputs.slt
      skwInRef.current = inputs.skw
      rllInRef.current = inputs.rll
      splInRef.current = inputs.spl
      wobInRef.current = inputs.wob
      timeRef.current = t
      // Sync tear — rising edge on trig kicks a short burst of band displacement
      const trigHigh = inputs.trig ? readScalar(inputs.trig) > 0 : false
      if (trigHigh && !prevTrigRef.current) {
        tearUntilRef.current = t + TEAR_SECONDS
        tearSeedRef.current = (tearSeedRef.current * 16807) % 2147483647 || 1
      }
      prevTrigRef.current = trigHigh
      // v-roll position advances at roll rate (dt-based, knob+CV)
      const rollVal = readCv(inputs.rll, rollRef.current) / 100
      rollPosRef.current = (rollPosRef.current + dt * rollVal * 0.8) % 1
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
      px.live = makeCanvas(w, h)
      px.accA = makeCanvas(w, h)
      px.accB = makeCanvas(w, h)
      px.hackA = makeCanvas(w, h)
      px.hackB = makeCanvas(w, h)
      px.ring = Array.from({ length: RING }, () => makeCanvas(w, h))
      px.ringIdx = 0
      // Cached vignette overlay for the CRT pass
      px.vig = makeCanvas(w, h)
      const vctx = px.vig.getContext('2d')
      const grad = vctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.55)')
      vctx.fillStyle = grad
      vctx.fillRect(0, 0, w, h)
      // Cached scanlines, same trick as the vignette: opaque black lines drawn
      // once, intensity applied at draw time via globalAlpha — h/3 fillRects
      // per frame become one drawImage (G7, fable-audit-2)
      px.scan = makeCanvas(w, h)
      const sctx = px.scan.getContext('2d')
      sctx.fillStyle = '#000'
      for (let y = 1; y < h; y += 3) sctx.fillRect(0, y, w, 1)
    }

    // ---- 1. fresh: vector render of the input ----
    const fctx = px.fresh.getContext('2d')
    fctx.fillStyle = '#000'
    fctx.fillRect(0, 0, w, h)
    const sig = inSigRef.current
    if (sig) drawSignal(fctx, sig, 0, 0, w, h, DUMMY_HIST, 0, DUMMY_HIST.length, penInRef.current)

    px.ringIdx = (px.ringIdx + 1) % RING
    const rctx = px.ring[px.ringIdx].getContext('2d')
    rctx.clearRect(0, 0, w, h)
    rctx.drawImage(px.fresh, 0, 0)
    const ringAt = (delay) => px.ring[(px.ringIdx - Math.min(RING - 1, Math.max(0, delay)) + RING * 2) % RING]

    // ---- 2. live: slitscan time displacement across the ring ----
    const slitVal = readCv(sltInRef.current, slitRef.current) / 100
    const lctx = px.live.getContext('2d')
    lctx.fillStyle = '#000'
    lctx.fillRect(0, 0, w, h)
    if (slitVal < 0.02) {
      lctx.drawImage(px.fresh, 0, 0)
    } else {
      const nBands = Math.max(4, Math.round(4 + (bandsRef.current / 100) * 60))
      const depth = slitVal * (RING - 1)
      if (axisRef.current) {
        const bw = w / nBands
        for (let b = 0; b < nBands; b++) {
          const delay = Math.round((b / Math.max(1, nBands - 1)) * depth)
          const x = Math.floor(b * bw), ww = Math.ceil(bw)
          lctx.drawImage(ringAt(delay), x, 0, ww, h, x, 0, ww, h)
        }
      } else {
        const bh = h / nBands
        for (let b = 0; b < nBands; b++) {
          const delay = Math.round((b / Math.max(1, nBands - 1)) * depth)
          const y = Math.floor(b * bh), hh = Math.ceil(bh)
          lctx.drawImage(ringAt(delay), 0, y, w, hh, 0, y, w, hh)
        }
      }
    }

    // ---- 3. acc: vidicon persistence + repeater echo generations ----
    const prev = px.accA, next = px.accB
    const nctx = next.getContext('2d')
    nctx.fillStyle = '#000'
    nctx.fillRect(0, 0, w, h)
    nctx.globalAlpha = (trailRef.current / 100) * 0.97
    // Spin: rotation inside the persistence loop — with trail up this is true
    // howl-around (each generation inherits the accumulated rotation)
    const spinRad = (spinRef.current / 100) * 0.05
    if (spinRad !== 0) {
      nctx.save()
      nctx.translate(w / 2, h / 2)
      nctx.rotate(spinRad)
      nctx.translate(-w / 2, -h / 2)
      nctx.drawImage(prev, 0, 0)
      nctx.restore()
    } else {
      nctx.drawImage(prev, 0, 0)
    }
    nctx.globalAlpha = 1
    nctx.drawImage(px.live, 0, 0)
    // Repeater chain: each relay hop is softer and dimmer (gCO lighter so
    // overlapping generations bloom like stacked broadcast signals)
    const gens = Math.round((echoRef.current / 100) * 6)
    if (gens > 0) {
      const hop = 2 + Math.round((spaceRef.current / 100) * 12)
      const g0 = fadeRef.current / 100
      nctx.globalCompositeOperation = 'lighter'
      for (let g = 1; g <= gens; g++) {
        const alpha = Math.pow(g0, g) * 0.55
        if (alpha < 0.02) break
        nctx.globalAlpha = alpha
        nctx.filter = ECHO_FILTERS[g]
        nctx.drawImage(ringAt(g * hop), 0, 0)
      }
      nctx.filter = 'none'
      nctx.globalCompositeOperation = 'source-over'
      nctx.globalAlpha = 1
    }
    px.accA = next; px.accB = prev

    // ---- 4. hack chain: roll → skew(+tear) → wobbulator → split → vhs → crt ----
    const t = timeRef.current
    const skewVal = readCv(skwInRef.current, skewRef.current) / 100
    const splitVal = readCv(splInRef.current, splitRef.current) / 100
    const wobVal = readCv(wobInRef.current, wobRef.current) / 100
    const vhsVal = vhsRef.current / 100
    const crtVal = crtRef.current / 100
    const tearing = t < tearUntilRef.current

    // v-roll: acc → hackA (wrap-scroll)
    const hctx = px.hackA.getContext('2d')
    hctx.fillStyle = '#000'
    hctx.fillRect(0, 0, w, h)
    const rollY = Math.round(rollPosRef.current * h)
    if (rollY === 0) {
      hctx.drawImage(next, 0, 0)
    } else {
      hctx.drawImage(next, 0, rollY - h)
      hctx.drawImage(next, 0, rollY)
    }

    // h-skew + tear: hackA → hackB, horizontal bands
    const bctx = px.hackB.getContext('2d')
    bctx.fillStyle = '#000'
    bctx.fillRect(0, 0, w, h)
    const doSkew = skewVal > 0.02 || tearing
    if (!doSkew) {
      bctx.drawImage(px.hackA, 0, 0)
    } else {
      const bh = h / SKEW_BANDS
      let seed = tearSeedRef.current
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
      for (let b = 0; b < SKEW_BANDS; b++) {
        const y = Math.floor(b * bh), hh = Math.ceil(bh)
        let dx = Math.sin(b * 0.7 + t * 2.2) * skewVal * w * 0.06
        if (tearing && rand() > 0.72) dx += (rand() - 0.5) * w * 0.3
        bctx.drawImage(px.hackA, 0, y, w, hh, dx, y, w, hh)
      }
    }

    // wobbulator: hackB → hackA (reused), vertical strips y-displaced —
    // Paik's scanline wave, orthogonal to skew
    const wctx = px.hackA.getContext('2d')
    wctx.fillStyle = '#000'
    wctx.fillRect(0, 0, w, h)
    if (wobVal < 0.02) {
      wctx.drawImage(px.hackB, 0, 0)
    } else {
      const bw = w / WOB_BANDS
      for (let c = 0; c < WOB_BANDS; c++) {
        const x = Math.floor(c * bw), ww = Math.ceil(bw)
        const dy = Math.sin(c * 0.8 + t * 1.9) * wobVal * h * 0.06
        wctx.drawImage(px.hackB, x, 0, ww, h, x, dy, ww, h)
      }
    }

    // base + chroma split (ghosts read the fully-hacked image)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(px.hackA, 0, 0)
    if (splitVal >= 0.02) {
      const off = splitVal * w * 0.02 + (tearing ? 2 : 0)
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.35
      ctx.filter = 'hue-rotate(120deg)'
      ctx.drawImage(px.hackA, off, 0)
      ctx.filter = 'hue-rotate(240deg)'
      ctx.drawImage(px.hackA, -off, 0)
      ctx.filter = 'none'
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }

    // vhs: tracking band at the bottom + random dropout streaks
    if (vhsVal >= 0.02) {
      const bandH = Math.max(2, Math.round(h * 0.07 * vhsVal))
      const jitter = (Math.random() - 0.5) * w * 0.12 * vhsVal
      ctx.drawImage(px.hackA, 0, h - bandH, w, bandH, jitter, h - bandH, w, bandH)
      const streaks = Math.round(vhsVal * 5 * Math.random())
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      for (let s = 0; s < streaks; s++) {
        ctx.fillRect(Math.random() * w * 0.7, Math.random() * h, w * (0.05 + Math.random() * 0.25), 1 + Math.random())
      }
    }

    // crt dress: scanlines + vignette (both cached at resize)
    if (crtVal >= 0.02) {
      ctx.globalAlpha = crtVal * 0.35
      ctx.drawImage(px.scan, 0, 0)
      ctx.globalAlpha = crtVal * 0.7
      ctx.drawImage(px.vig, 0, 0)
      ctx.globalAlpha = 1
    }
  })

  return <SlitEchoPanel canvasRef={canvasRef} trail={trail} echo={echo} space={space} fade={fade} slit={slit} bands={bands} axis={axis} skew={skew} roll={roll} split={split} wob={wob} spin={spin} crt={crt} vhs={vhs} enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onTrail={setTrail} onEcho={setEcho} onSpace={setSpace} onFade={setFade} onSlit={setSlit} onBands={setBands} onAxis={setAxis} onSkew={setSkew} onRoll={setRoll} onSplit={setSplit} onWob={setWob} onSpin={setSpin} onCrt={setCrt} onVhs={setVhs}
    inConn={cp.has('in')} inRef={inSigRef} penConn={cp.has('pen')} penRef={penInRef} trigConn={cp.has('trig')} trigRef={trigInRef} sltConn={cp.has('slt')} sltRef={sltInRef} skwConn={cp.has('skw')} skwRef={skwInRef} rllConn={cp.has('rll')} rllRef={rllInRef} splConn={cp.has('spl')} splRef={splInRef} wobConn={cp.has('wob')} wobRef={wobInRef} />
}
