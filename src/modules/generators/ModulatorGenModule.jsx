// ModulatorGenModule — frequency modulation circle generator
// 12HP 3U. Ports DialRotation from kol-modulator into modular signal path.
// Breathing concentric circles with wave distortion → points output.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar, readCv } from '../../hooks/signals'
import { sinLut, cosLut } from '../../hooks/trigLut'
import { newClockSyncState, advanceClockSync } from '../../hooks/clockSync'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import CvSlider from '../controls/CvSlider'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

// --- Math ported from kol-modulator/DialRotation.jsx ---

function generateCirclePoints(radius, amp, freq, drift, phaseOffset, quantize, scaleF, numPoints) {
  const pts = []
  const shouldQuantize = quantize

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2

    let wavePhase
    if (shouldQuantize) {
      const cyclesPerCircle = Math.round(freq / 10)
      wavePhase = angle * cyclesPerCircle + ((drift + phaseOffset) * 0.1)
    } else {
      wavePhase = ((angle / (Math.PI * 2) * 180 + drift + phaseOffset) / 60) * freq
    }

    const waveOffset = amp * sinLut(wavePhase)
    const r = (radius + waveOffset) * scaleF

    pts.push({
      x: 0.5 + cosLut(angle) * r,
      y: 0.5 + sinLut(angle) * r,
    })
  }

  // Closed loop edges
  const edges = []
  for (let i = 0; i < pts.length; i++) {
    edges.push([i, (i + 1) % pts.length])
  }

  return { pts, edges }
}

// --- UI Panel ---

function ModulatorGenPanel({
  intensity, frequency, separation, scale, circles,
  breathTime, breathAmp, speed,
  quantize, absolute, freeze, resolution,
  enabled, onToggle, id,
  onIntensityChange, onFrequencyChange, onSeparationChange,
  onScaleChange, onCirclesChange, onResolutionChange,
  onBreathTimeChange, onBreathAmpChange, onSpeedChange,
  onQuantizeChange, onAbsoluteChange, onFreezeChange,
  intConn, intRef, frqConn, frqRef, sepConn, sepRef,
  sclConn, sclRef, cirConn, cirRef, resConn, resRef,
  brtConn, brtRef, bamConn, bamRef, spdConn, spdRef,
  strConn, strInRef, clkConn, clkRef, outRef,
}) {


  return (
    <Module label="Mod" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 4, padding: '2px 0' }}>

        {/* Group 1 — toggles + sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', padding: '0 4px' }}>
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Shape</span>
          <CvSlider port="int" moduleId={id} active={intConn} signalRef={intRef} value={intensity} onChange={onIntensityChange} label="Int" />
          <CvSlider port="frq" moduleId={id} active={frqConn} signalRef={frqRef} value={frequency} onChange={onFrequencyChange} label="Frq" />
          <CvSlider port="sep" moduleId={id} active={sepConn} signalRef={sepRef} value={separation} onChange={onSeparationChange} label="Sep" />
          <CvSlider port="scl" moduleId={id} active={sclConn} signalRef={sclRef} value={scale} onChange={onScaleChange} label="Scl" />
          <CvSlider port="cir" moduleId={id} active={cirConn} signalRef={cirRef} value={circles} onChange={onCirclesChange} label="Cir" />
          <CvSlider port="res" moduleId={id} active={resConn} signalRef={resRef} value={resolution} onChange={onResolutionChange} label="Res" />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Toggle value={absolute} onChange={onAbsoluteChange} label="Int A/B" size="sm" horizontal />
            <Toggle value={quantize} onChange={onQuantizeChange} label="Quantize" size="sm" horizontal />
          </div>
        </div>

        <Divider className="px-3" />

        {/* Group 2 — breath (internal LFO) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', padding: '0 4px' }}>
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Breath</span>
          <CvSlider port="brt" moduleId={id} active={brtConn} signalRef={brtRef} value={breathTime} onChange={onBreathTimeChange} label="Brt" />
          <CvSlider port="bam" moduleId={id} active={bamConn} signalRef={bamRef} value={breathAmp} onChange={onBreathAmpChange} label="Bam" />
          <CvSlider port="spd" moduleId={id} active={spdConn} signalRef={spdRef} value={speed} onChange={onSpeedChange} label="Spd" />
          <Toggle value={freeze} onChange={onFreezeChange} label="Freeze" size="sm" horizontal />
        </div>

        <Divider className="px-3" />

        {/* Group 3 — output */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <LabeledJack type="in" port="str" moduleId={id} active={strConn} signalRef={strInRef} label="str" />
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkRef} label="clk" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

// --- Module logic ---

export default function ModulatorGenModule({ id = 'modgen1', init, preview }) {
  if (preview) return <ModulatorGenPanel
    intensity={50} frequency={50} separation={30} scale={50} circles={13}
    breathTime={30} breathAmp={25} speed={50}
    quantize={false} absolute={false} freeze={false} resolution={50}
    enabled={false} onToggle={() => {}} id={id}
    onIntensityChange={() => {}} onFrequencyChange={() => {}} onSeparationChange={() => {}}
    onScaleChange={() => {}} onCirclesChange={() => {}} onResolutionChange={() => {}}
    onBreathTimeChange={() => {}} onBreathAmpChange={() => {}} onSpeedChange={() => {}}
    onQuantizeChange={() => {}} onAbsoluteChange={() => {}} onFreezeChange={() => {}}
    intConn={false} intRef={{ current: null }} frqConn={false} frqRef={{ current: null }}
    sepConn={false} sepRef={{ current: null }} sclConn={false} sclRef={{ current: null }}
    cirConn={false} cirRef={{ current: null }} resConn={false} resRef={{ current: null }}
    brtConn={false} brtRef={{ current: null }} bamConn={false} bamRef={{ current: null }}
    spdConn={false} spdRef={{ current: null }}
    strConn={false} strInRef={{ current: null }} clkConn={false} clkRef={{ current: null }} outRef={{ current: null }}
  />

  const [intensity, setIntensity] = useState(init?.intensity ?? 50)
  const [frequency, setFrequency] = useState(init?.frequency ?? 50)
  const [separation, setSeparation] = useState(init?.separation ?? 30)
  const [scale, setScale] = useState(init?.scale ?? 50)
  const [circles, setCircles] = useState(init?.circles ?? 13)
  const [resolution, setResolution] = useState(init?.resolution ?? 50)
  const [breathTime, setBreathTime] = useState(init?.breathTime ?? 30)
  const [breathAmp, setBreathAmp] = useState(init?.breathAmp ?? 25)
  const [speed, setSpeed] = useState(init?.speed ?? 50)
  const [quantize, setQuantize] = useState(init?.quantize ?? false)
  const [absolute, setAbsolute] = useState(init?.absolute ?? false)
  const [freeze, setFreeze] = useState(false)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  // Refs for process
  const enabledRef = useRef(true)
  const intensityRef = useRef(50)
  const frequencyRef = useRef(50)
  const separationRef = useRef(30)
  const scaleRef = useRef(50)
  const circlesRef = useRef(13)
  const resolutionRef = useRef(50)
  const breathTimeRef = useRef(30)
  const breathAmpRef = useRef(25)
  const speedRef = useRef(50)
  const quantizeRef = useRef(false)
  const absoluteRef = useRef(false)
  const freezeRef = useRef(false)

  // Internal breath state
  const driftRef = useRef(0)
  const breathSyncRef = useRef(newClockSyncState())

  // Signal refs
  const outRef = useRef(null)
  const intCvRef = useRef(null)
  const frqCvRef = useRef(null)
  const sepCvRef = useRef(null)
  const sclCvRef = useRef(null)
  const cirCvRef = useRef(null)
  const resCvRef = useRef(null)
  const brtCvRef = useRef(null)
  const bamCvRef = useRef(null)
  const spdCvRef = useRef(null)
  const strInRef = useRef(null)
  const clkRef = useRef(null)

  enabledRef.current = enabled
  intensityRef.current = intensity
  frequencyRef.current = frequency
  separationRef.current = separation
  scaleRef.current = scale
  circlesRef.current = circles
  resolutionRef.current = resolution
  breathTimeRef.current = breathTime
  breathAmpRef.current = breathAmp
  speedRef.current = speed
  quantizeRef.current = quantize
  absoluteRef.current = absolute
  freezeRef.current = freeze

  const intConn = cp.has('int')
  const frqConn = cp.has('frq')
  const sepConn = cp.has('sep')
  const sclConn = cp.has('scl')
  const cirConn = cp.has('cir')
  const resConn = cp.has('res')
  const brtConn = cp.has('brt')
  const bamConn = cp.has('bam')
  const spdConn = cp.has('spd')
  const strConn = cp.has('str')
  const clkConn = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { intensity, frequency, separation, scale, circles, resolution, breathTime, breathAmp, speed, quantize, absolute, freeze }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      int: { type: 'scalar', cv: 'attenuate' }, frq: { type: 'scalar', cv: 'offset' }, sep: { type: 'scalar', cv: 'offset' },
      scl: { type: 'scalar', cv: 'offset' }, cir: { type: 'scalar', cv: 'offset' }, res: { type: 'scalar', cv: 'offset' },
      brt: { type: 'scalar', cv: 'offset' }, bam: { type: 'scalar', cv: 'attenuate' }, spd: { type: 'scalar', cv: 'offset' },
      str: { type: 'scalar', cv: 'offset' }, clk: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }

      // Store CV inputs for jack glow
      intCvRef.current = inputs.int
      frqCvRef.current = inputs.frq
      sepCvRef.current = inputs.sep
      sclCvRef.current = inputs.scl
      cirCvRef.current = inputs.cir
      resCvRef.current = inputs.res
      brtCvRef.current = inputs.brt
      bamCvRef.current = inputs.bam
      spdCvRef.current = inputs.spd
      strInRef.current = inputs.str
      clkRef.current = inputs.clk

      const int = readCv(inputs.int, intensityRef.current, 'attenuate')
      const frq = readCv(inputs.frq, frequencyRef.current)
      const sep = readCv(inputs.sep, separationRef.current)
      const scl = readCv(inputs.scl, scaleRef.current)
      const cir = Math.max(1, Math.round(1 + (readCv(inputs.cir, circlesRef.current) / 100) * 7))
      const brt = 1 + (readCv(inputs.brt, breathTimeRef.current) / 100) * 9
      const bam = readCv(inputs.bam, breathAmpRef.current, 'attenuate')
      const spd = readCv(inputs.spd, speedRef.current) / 50
      const str = inputs.str ? 0.5 + (readScalar(inputs.str) / 100) * 4.5 : 1.5
      const numPts = Math.round(24 + (readCv(inputs.res, resolutionRef.current) / 100) * 156) // 24-180

      // Internal breath oscillator — syncs to clk when patched, else runs at spd/brt.
      if (!freezeRef.current) {
        advanceClockSync(breathSyncRef.current, inputs.clk, t, dt, spd / Math.max(0.5, brt))
        driftRef.current += (Math.sin(breathSyncRef.current.phase * Math.PI * 2) * 0.5 + 0.5) * 0.5 * spd
      }
      const breathVal = Math.sin(breathSyncRef.current.phase * Math.PI * 2) * 0.5 + 0.5 // 0-1

      // Calculate amplitude and frequency based on mode
      const globalScaleF = scl / 100
      let totalAmp, totalFreq

      if (absoluteRef.current) {
        const breathMod = breathVal * (bam / 100) * 40
        totalAmp = (int * 0.4 + breathMod) * globalScaleF
        totalFreq = (frq * 0.2) * globalScaleF
      } else {
        const baseAmp = int * 0.2
        const breathMod = breathVal * (bam / 100) * 40
        totalAmp = (baseAmp + breathMod) * globalScaleF
        totalFreq = (frq * 0.15) * globalScaleF
      }

      const breathSep = breathVal * (sep / 100) * 60 * globalScaleF

      // Normalize to 0-0.5 coordinate space
      const baseRadius = 0.15
      const normAmp = totalAmp / 400
      const normFreq = Math.max(10, totalFreq * 10)

      // Generate all circles (push instead of concat to avoid O(n²) allocation)
      const allPts = []
      const allEdges = []

      // Main circle
      const main = generateCirclePoints(baseRadius, normAmp, normFreq, driftRef.current, 0, quantizeRef.current, 1, numPts)
      for (let i = 0; i < main.pts.length; i++) allPts.push(main.pts[i])
      for (let i = 0; i < main.edges.length; i++) allEdges.push(main.edges[i])

      // Concentric pairs
      for (let pair = 1; pair < cir; pair++) {
        const baseOffset = pair * (sep / 100) * 0.1 * globalScaleF
        const totalSep = (breathSep / 400) * pair
        const phaseOfs = pair * 15
        const ampVar = normAmp * (1 + pair * 0.1)
        const freqVar = normFreq * (1 + pair * 0.05)

        // Inner
        const innerR = baseRadius - baseOffset - totalSep
        if (innerR > 0.01) {
          const inner = generateCirclePoints(innerR, ampVar, freqVar, driftRef.current, phaseOfs, quantizeRef.current, 1, numPts)
          const offset = allPts.length
          for (let i = 0; i < inner.pts.length; i++) allPts.push(inner.pts[i])
          for (let i = 0; i < inner.edges.length; i++) allEdges.push([inner.edges[i][0] + offset, inner.edges[i][1] + offset])
        }

        // Outer
        const outerR = baseRadius + baseOffset + totalSep
        const outer = generateCirclePoints(outerR, ampVar, freqVar, driftRef.current, phaseOfs, quantizeRef.current, 1, numPts)
        const offset2 = allPts.length
        for (let i = 0; i < outer.pts.length; i++) allPts.push(outer.pts[i])
        for (let i = 0; i < outer.edges.length; i++) allEdges.push([outer.edges[i][0] + offset2, outer.edges[i][1] + offset2])
      }

      const out = points(allPts, allEdges)
      out.strokeWidth = str
      out.aspectLock = true
      outRef.current = out
      return { out }
    },
  })

  return <ModulatorGenPanel
    intensity={intensity} frequency={frequency} separation={separation} scale={scale} circles={circles} resolution={resolution}
    breathTime={breathTime} breathAmp={breathAmp} speed={speed}
    quantize={quantize} absolute={absolute} freeze={freeze}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onIntensityChange={setIntensity} onFrequencyChange={setFrequency} onSeparationChange={setSeparation}
    onScaleChange={setScale} onCirclesChange={setCircles} onResolutionChange={setResolution}
    onBreathTimeChange={setBreathTime} onBreathAmpChange={setBreathAmp} onSpeedChange={setSpeed}
    onQuantizeChange={setQuantize} onAbsoluteChange={setAbsolute} onFreezeChange={setFreeze}
    intConn={intConn} intRef={intCvRef} frqConn={frqConn} frqRef={frqCvRef}
    sepConn={sepConn} sepRef={sepCvRef} sclConn={sclConn} sclRef={sclCvRef}
    cirConn={cirConn} cirRef={cirCvRef} resConn={resConn} resRef={resCvRef}
    brtConn={brtConn} brtRef={brtCvRef} bamConn={bamConn} bamRef={bamCvRef}
    spdConn={spdConn} spdRef={spdCvRef}
    strConn={strConn} strInRef={strInRef} clkConn={clkConn} clkRef={clkRef} outRef={outRef}
  />
}
