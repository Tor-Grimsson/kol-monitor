// RadialGenModule — harmonic radial shape generator
// 12HP 3U. Ports wavyCircleMath from kol-radial into modular signal path.
// Shape presets → parametric wave distortion → points output.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Toggle from '../controls/Toggle'
import IconSelect from '../controls/IconSelect'
import Divider from '../../components/atoms/Divider'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

// --- Math ported from kol-radial/wavyCircleMath.js ---

const SHAPE_PRESETS = {
  default:  { radius: 60, amplitude: 25, frequency: 50, resolution: 40, scale: 50, rotate: 0 },
  circle:   { radius: 60, amplitude: 25, frequency: 5, resolution: 4, scale: 50, rotate: 0 },
  triangle: { radius: 80, amplitude: 50, frequency: 3, resolution: 4, scale: 35, rotate: 0 },
  rect:     { radius: 64, amplitude: 20, frequency: 4, resolution: 8, scale: 50, rotate: 22 },
  star:     { radius: 70, amplitude: 70, frequency: 8, resolution: 4, scale: 50, rotate: 0 },
  hex:      { radius: 80, amplitude: 15, frequency: 6, resolution: 8, scale: 40, rotate: 15 },
  random:   null, // randomized on select
}

function getLfoValue(phase, waveType) {
  switch (waveType) {
    case 'sine': return Math.sin(phase)
    case 'triangle': return (2 / Math.PI) * Math.asin(Math.sin(phase))
    case 'square': return Math.sin(phase) >= 0 ? 1 : -1
    case 'random': {
      const seed = Math.floor(phase / (Math.PI / 4))
      return (Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453) % 2 - 1
    }
    default: return Math.sin(phase)
  }
}

function generateRadialPoints(params) {
  const {
    radius, amplitude, frequency, resolution, scale,
    rotate, lfoAmount, lfoFrequency, lfoSync, lfoWaveType,
    mirrorX, mirrorY, strokeWidth, fill,
  } = params

  const totalNodes = Math.max(3, frequency * resolution)
  const syncedLfoFreq = lfoSync ? Math.round(lfoFrequency) : lfoFrequency
  const scaleF = scale / 50 // 0-100 knob → 0-2 multiplier
  const rotateRad = (rotate / 100) * Math.PI * 2

  const pts = []

  for (let i = 0; i < totalNodes; i++) {
    const theta = (i / totalNodes) * Math.PI * 2

    // LFO modulation on frequency
    const lfoPhase = syncedLfoFreq * theta
    const lfoValue = getLfoValue(lfoPhase, lfoWaveType)
    const freqMod = frequency + lfoAmount * lfoValue

    // Mirror symmetry
    let mirrorTheta = theta
    if (mirrorX && mirrorY) {
      const quadrant = Math.floor((theta / (Math.PI / 2)) % 4)
      const baseTheta = theta % (Math.PI / 2)
      mirrorTheta = quadrant % 2 === 0 ? baseTheta : (Math.PI / 2) - baseTheta
    } else if (mirrorX) {
      const half = Math.floor((theta / Math.PI) % 2)
      const baseTheta = theta % Math.PI
      mirrorTheta = half === 0 ? baseTheta : (Math.PI * 2) - baseTheta
    } else if (mirrorY) {
      const half = Math.floor((theta / Math.PI) % 2)
      mirrorTheta = half === 0 ? theta : (Math.PI * 2) - theta
    }

    const wavePhase = freqMod * mirrorTheta
    const r = (radius + amplitude * Math.sin(wavePhase)) * scaleF / 200 // normalize to ~0-1 range
    const angle = theta + rotateRad

    pts.push({
      x: 0.5 + r * Math.cos(angle),
      y: 0.5 + r * Math.sin(angle),
    })
  }

  // Build edges as a closed loop
  const edges = []
  for (let i = 0; i < pts.length; i++) {
    edges.push([i, (i + 1) % pts.length])
  }

  return { pts, edges, strokeWidth, fill }
}

function randomPreset() {
  return {
    radius: 30 + Math.random() * 70,
    amplitude: Math.random() * 80,
    frequency: 2 + Math.floor(Math.random() * 10),
    resolution: 2 + Math.floor(Math.random() * 14),
    scale: 20 + Math.random() * 60,
    rotate: Math.random() * 100,
  }
}

// --- UI Panel ---

function RadialGenPanel({
  shape, radius, amplitude, frequency, resolution, scale, rotate,
  lfoAmount, lfoFrequency, lfoWaveType, lfoSync,
  strokeWidth, mirrorX, mirrorY, fill, grid, aspectLock,
  enabled, onToggle, id,
  onShapeChange, onRadiusChange, onAmplitudeChange, onFrequencyChange,
  onResolutionChange, onScaleChange, onRotateChange,
  onLfoAmountChange, onLfoFrequencyChange, onLfoWaveTypeChange, onLfoSyncChange,
  onStrokeWidthChange, onMirrorXChange, onMirrorYChange, onFillChange, onGridChange, onAspectLockChange,
  radConn, radInRef, ampConn, ampInRef, frqConn, frqInRef,
  resConn, resInRef, sclConn, sclInRef, rotConn, rotInRef,
  lfoAmtConn, lfoAmtInRef, lfoFrqConn, lfoFrqInRef,
  strConn, strInRef, outRef,
}) {


  return (
    <Module label="Radial" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 4, padding: '2px 0' }}>

        {/* Group 1 — shapes + main knobs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-start' }}>
          <IconSelect value={shape} onChange={onShapeChange} columns={2} items={[
            { value: 'default', icon: 'radial-default' },
            { value: 'circle', icon: 'radial-circle' },
            { value: 'triangle', icon: 'radial-triangle' },
            { value: 'rect', icon: 'radial-rect' },
            { value: 'star', icon: 'radial-star' },
            { value: 'hex', icon: 'radial-hex' },
            { value: 'random', icon: 'radial-random' },
          ]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <CvKnob port="rad" moduleId={id} active={radConn} signalRef={radInRef} value={radius} onChange={onRadiusChange} label="rad" />
            <CvKnob port="amp" moduleId={id} active={ampConn} signalRef={ampInRef} value={amplitude} onChange={onAmplitudeChange} label="amp" />
            <CvKnob port="scl" moduleId={id} active={sclConn} signalRef={sclInRef} value={scale} onChange={onScaleChange} label="scl" />
            <CvKnob port="rot" moduleId={id} active={rotConn} signalRef={rotInRef} value={rotate} onChange={onRotateChange} label="rot" />
            <CvKnob port="frq" moduleId={id} active={frqConn} signalRef={frqInRef} value={frequency} onChange={onFrequencyChange} label="frq" />
            <CvKnob port="res" moduleId={id} active={resConn} signalRef={resInRef} value={resolution} onChange={onResolutionChange} label="res" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            <Toggle value={fill} onChange={onFillChange} label="fil" size="sm" horizontal />
            <Toggle value={grid} onChange={onGridChange} label="grd" size="sm" horizontal />
            <Toggle value={aspectLock} onChange={onAspectLockChange} label="1:1" size="sm" horizontal />
          </div>
        </div>

        <Divider className="px-3" />

        {/* Group 2 — wave icons left, LFO knobs right, toggles row last */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-start' }}>
          <IconSelect value={lfoWaveType} onChange={onLfoWaveTypeChange} columns={2} items={[
            { value: 'sine', icon: 'wave-sin' },
            { value: 'triangle', icon: 'wave-tri' },
            { value: 'square', icon: 'wave-sqr' },
            { value: 'random', icon: 'wave-rnd' },
          ]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <CvKnob port="lfoAmt" moduleId={id} active={lfoAmtConn} signalRef={lfoAmtInRef} value={lfoAmount} onChange={onLfoAmountChange} label="amt" />
            <CvKnob port="lfoFrq" moduleId={id} active={lfoFrqConn} signalRef={lfoFrqInRef} value={lfoFrequency} onChange={onLfoFrequencyChange} label="frq" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            <Toggle value={lfoSync} onChange={onLfoSyncChange} label="syn" size="sm" horizontal />
            <Toggle value={mirrorX} onChange={onMirrorXChange} label="sym x" size="sm" horizontal />
            <Toggle value={mirrorY} onChange={onMirrorYChange} label="sym y" size="sm" horizontal />
          </div>
        </div>

        <Divider className="px-3" />

        {/* Group 3 — stroke + output */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <LabeledJack type="in" port="str" moduleId={id} active={strConn} signalRef={strInRef} label="str" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

// --- Module logic ---

export default function RadialGenModule({ id = 'radial1', init, preview }) {
  if (preview) return <RadialGenPanel
    shape="default" radius={60} amplitude={25} frequency={50} resolution={40}
    scale={50} rotate={0} lfoAmount={0} lfoFrequency={20} lfoWaveType="sine" lfoSync={false}
    strokeWidth={40} mirrorX={false} mirrorY={false} fill={false} grid={false} aspectLock={true}
    enabled={false} onToggle={() => {}} id={id}
    onShapeChange={() => {}} onRadiusChange={() => {}} onAmplitudeChange={() => {}} onFrequencyChange={() => {}}
    onResolutionChange={() => {}} onScaleChange={() => {}} onRotateChange={() => {}}
    onLfoAmountChange={() => {}} onLfoFrequencyChange={() => {}} onLfoWaveTypeChange={() => {}} onLfoSyncChange={() => {}}
    onStrokeWidthChange={() => {}} onMirrorXChange={() => {}} onMirrorYChange={() => {}} onFillChange={() => {}} onGridChange={() => {}} onAspectLockChange={() => {}}
    radConn={false} radInRef={{ current: null }} ampConn={false} ampInRef={{ current: null }}
    frqConn={false} frqInRef={{ current: null }} resConn={false} resInRef={{ current: null }}
    sclConn={false} sclInRef={{ current: null }} rotConn={false} rotInRef={{ current: null }}
    lfoAmtConn={false} lfoAmtInRef={{ current: null }} lfoFrqConn={false} lfoFrqInRef={{ current: null }}
    strConn={false} strInRef={{ current: null }} outRef={{ current: null }}
  />

  const [shape, setShape] = useState(init?.shape ?? 'default')
  const [radius, setRadius] = useState(init?.radius ?? 60)
  const [amplitude, setAmplitude] = useState(init?.amplitude ?? 25)
  const [frequency, setFrequency] = useState(init?.frequency ?? 50)
  const [resolution, setResolution] = useState(init?.resolution ?? 40)
  const [scale, setScale] = useState(init?.scale ?? 50)
  const [rotate, setRotate] = useState(init?.rotate ?? 0)
  const [lfoAmount, setLfoAmount] = useState(init?.lfoAmount ?? 0)
  const [lfoFrequency, setLfoFrequency] = useState(init?.lfoFrequency ?? 20)
  const [lfoWaveType, setLfoWaveType] = useState(init?.lfoWaveType ?? 'sine')
  const [lfoSync, setLfoSync] = useState(init?.lfoSync ?? false)
  const [strokeWidth, setStrokeWidth] = useState(init?.strokeWidth ?? 40)
  const [mirrorX, setMirrorX] = useState(init?.mirrorX ?? false)
  const [mirrorY, setMirrorY] = useState(init?.mirrorY ?? false)
  const [fill, setFill] = useState(init?.fill ?? false)
  const [grid, setGrid] = useState(init?.grid ?? false)
  const [aspectLock, setAspectLock] = useState(init?.aspectLock ?? true)
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()

  // Refs for process()
  const enabledRef = useRef(true)
  const shapeRef = useRef('default')
  const radiusRef = useRef(60)
  const amplitudeRef = useRef(25)
  const frequencyRef = useRef(50)
  const resolutionRef = useRef(40)
  const scaleRef = useRef(50)
  const rotateRef = useRef(0)
  const lfoAmountRef = useRef(0)
  const lfoFrequencyRef = useRef(20)
  const lfoWaveTypeRef = useRef('sine')
  const lfoSyncRef = useRef(false)
  const strokeWidthRef = useRef(40)
  const mirrorXRef = useRef(false)
  const mirrorYRef = useRef(false)
  const fillRef = useRef(false)
  const gridRef = useRef(false)
  const aspectLockRef = useRef(true)

  const outRef = useRef(null)
  const radInRef = useRef(null)
  const ampInRef = useRef(null)
  const frqInRef = useRef(null)
  const resInRef = useRef(null)
  const sclInRef = useRef(null)
  const rotInRef = useRef(null)
  const lfoAmtInRef = useRef(null)
  const lfoFrqInRef = useRef(null)
  const strInRef = useRef(null)

  enabledRef.current = enabled
  shapeRef.current = shape
  radiusRef.current = radius
  amplitudeRef.current = amplitude
  frequencyRef.current = frequency
  resolutionRef.current = resolution
  scaleRef.current = scale
  rotateRef.current = rotate
  lfoAmountRef.current = lfoAmount
  lfoFrequencyRef.current = lfoFrequency
  lfoWaveTypeRef.current = lfoWaveType
  lfoSyncRef.current = lfoSync
  strokeWidthRef.current = strokeWidth
  mirrorXRef.current = mirrorX
  mirrorYRef.current = mirrorY
  fillRef.current = fill
  gridRef.current = grid
  aspectLockRef.current = aspectLock

  const conns = routing?.connections || []
  const radConn = conns.some(c => c.toModuleId === id && c.toPort === 'rad')
  const ampConn = conns.some(c => c.toModuleId === id && c.toPort === 'amp')
  const frqConn = conns.some(c => c.toModuleId === id && c.toPort === 'frq')
  const resConn = conns.some(c => c.toModuleId === id && c.toPort === 'res')
  const sclConn = conns.some(c => c.toModuleId === id && c.toPort === 'scl')
  const rotConn = conns.some(c => c.toModuleId === id && c.toPort === 'rot')
  const lfoAmtConn = conns.some(c => c.toModuleId === id && c.toPort === 'lfoAmt')
  const lfoFrqConn = conns.some(c => c.toModuleId === id && c.toPort === 'lfoFrq')
  const strConn = conns.some(c => c.toModuleId === id && c.toPort === 'str')

  // Shape change applies preset values
  const handleShapeChange = (newShape) => {
    setShape(newShape)
    const preset = newShape === 'random' ? randomPreset() : SHAPE_PRESETS[newShape]
    if (preset) {
      setRadius(Math.round(preset.radius))
      setAmplitude(Math.round(preset.amplitude))
      setFrequency(Math.round(preset.frequency))
      setResolution(Math.round(preset.resolution))
      setScale(Math.round(preset.scale))
      setRotate(Math.round(preset.rotate))
    }
  }

  useModule({
    id,
    inputs: {
      rad: { type: 'scalar' },
      amp: { type: 'scalar' },
      frq: { type: 'scalar' },
      res: { type: 'scalar' },
      scl: { type: 'scalar' },
      rot: { type: 'scalar' },
      lfoAmt: { type: 'scalar' },
      lfoFrq: { type: 'scalar' },
      str: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }

      // Store CV inputs for jack glow
      radInRef.current = inputs.rad
      ampInRef.current = inputs.amp
      frqInRef.current = inputs.frq
      resInRef.current = inputs.res
      sclInRef.current = inputs.scl
      rotInRef.current = inputs.rot
      lfoAmtInRef.current = inputs.lfoAmt
      lfoFrqInRef.current = inputs.lfoFrq
      strInRef.current = inputs.str

      // Read knob or CV — knob is 0-100, CV overrides
      const rad = inputs.rad ? readScalar(inputs.rad) : radiusRef.current
      const amp = inputs.amp ? readScalar(inputs.amp) : amplitudeRef.current
      const frqKnob = inputs.frq ? readScalar(inputs.frq) : frequencyRef.current
      const resKnob = inputs.res ? readScalar(inputs.res) : resolutionRef.current
      const scl = inputs.scl ? readScalar(inputs.scl) : scaleRef.current
      const rot = inputs.rot ? readScalar(inputs.rot) : rotateRef.current
      const lfoAmt = inputs.lfoAmt ? readScalar(inputs.lfoAmt) / 10 : lfoAmountRef.current / 10
      const lfoFrq = inputs.lfoFrq ? readScalar(inputs.lfoFrq) / 8.3 : lfoFrequencyRef.current / 8.3
      const str = inputs.str ? readScalar(inputs.str) : strokeWidthRef.current

      // Map 0-100 knobs to actual ranges
      const freq = Math.max(1, Math.round(1 + (frqKnob / 100) * 11))
      const res = Math.max(1, Math.round(1 + (resKnob / 100) * 15))

      const result = generateRadialPoints({
        radius: rad,
        amplitude: amp,
        frequency: freq,
        resolution: res,
        scale: scl,
        rotate: rot,
        lfoAmount: lfoAmt,
        lfoFrequency: lfoFrq,
        lfoSync: lfoSyncRef.current,
        lfoWaveType: lfoWaveTypeRef.current,
        mirrorX: mirrorXRef.current,
        mirrorY: mirrorYRef.current,
        strokeWidth: 0.5 + (str / 100) * 4.5, // 0.5-5 range
        fill: fillRef.current,
      })

      // Attach stroke/fill metadata to points signal
      const out = points(result.pts, result.edges)
      out.strokeWidth = result.strokeWidth
      out.fill = result.fill
      out.grid = gridRef.current
      out.aspectLock = aspectLockRef.current
      outRef.current = out
      return { out }
    },
  })

  return <RadialGenPanel
    shape={shape} radius={radius} amplitude={amplitude} frequency={frequency}
    resolution={resolution} scale={scale} rotate={rotate}
    lfoAmount={lfoAmount} lfoFrequency={lfoFrequency} lfoWaveType={lfoWaveType} lfoSync={lfoSync}
    strokeWidth={strokeWidth} mirrorX={mirrorX} mirrorY={mirrorY} fill={fill} grid={grid} aspectLock={aspectLock}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onShapeChange={handleShapeChange} onRadiusChange={setRadius} onAmplitudeChange={setAmplitude}
    onFrequencyChange={setFrequency} onResolutionChange={setResolution}
    onScaleChange={setScale} onRotateChange={setRotate}
    onLfoAmountChange={setLfoAmount} onLfoFrequencyChange={setLfoFrequency}
    onLfoWaveTypeChange={setLfoWaveType} onLfoSyncChange={setLfoSync}
    onStrokeWidthChange={setStrokeWidth} onMirrorXChange={setMirrorX}
    onMirrorYChange={setMirrorY} onFillChange={setFill} onGridChange={setGrid} onAspectLockChange={setAspectLock}
    radConn={radConn} radInRef={radInRef} ampConn={ampConn} ampInRef={ampInRef}
    frqConn={frqConn} frqInRef={frqInRef} resConn={resConn} resInRef={resInRef}
    sclConn={sclConn} sclInRef={sclInRef} rotConn={rotConn} rotInRef={rotInRef}
    lfoAmtConn={lfoAmtConn} lfoAmtInRef={lfoAmtInRef} lfoFrqConn={lfoFrqConn} lfoFrqInRef={lfoFrqInRef}
    strConn={strConn} strInRef={strInRef} outRef={outRef}
  />
}
