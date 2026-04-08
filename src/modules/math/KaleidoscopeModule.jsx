// KaleidoscopeModule — radial mirror for points geometry
// 12HP 3U. Replicates input shapes N times around center with alternating reflections.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

// --- Pure geometry transform ---

function kaleidoscopePoints(srcPts, srcEdges, params) {
  const { segments, rotation, zoom, offset, fold, mirror, cut } = params
  const segAngle = (Math.PI * 2) / segments
  const halfWedge = (segAngle / 2) * fold
  const N = srcPts.length
  const E = srcEdges ? srcEdges.length : 0
  const hasOffset = offset !== 0

  // Pre-allocate to exact size
  const allPts = new Array(segments * N)
  const allEdges = E > 0 ? new Array(segments * E) : null
  let pi = 0, ei = 0

  // Precompute cut boundary trig
  const sinH = cut ? Math.sin(halfWedge) : 0
  const cosH = cut ? Math.cos(halfWedge) : 0

  for (let s = 0; s < segments; s++) {
    const angle = rotation + s * segAngle
    const shouldMirror = mirror && (s % 2 === 1)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const ox = hasOffset ? offset * cos + 0.5 : 0.5
    const oy = hasOffset ? offset * sin + 0.5 : 0.5
    const baseIdx = s * N

    for (let i = 0; i < N; i++) {
      let px = (srcPts[i].x - 0.5) * zoom
      let py = (srcPts[i].y - 0.5) * zoom * fold

      // Cut: clamp points to wedge boundary (preserves polygon closure for fill)
      if (cut) {
        // Fast inside check via cross-product: |py| * cosH <= px * sinH (when px > 0)
        const absPy = py < 0 ? -py : py
        if (px < 0 || absPy * cosH > px * sinH) {
          const r = Math.sqrt(px * px + py * py)
          const ptAngle = Math.atan2(py, px)
          const clamped = ptAngle < -halfWedge ? -halfWedge : halfWedge
          px = r * Math.cos(clamped)
          py = r * Math.sin(clamped)
        }
      }

      if (shouldMirror) px = -px

      allPts[pi++] = {
        x: px * cos - py * sin + ox,
        y: px * sin + py * cos + oy,
      }
    }

    if (allEdges) {
      for (let e = 0; e < E; e++) {
        allEdges[ei++] = [srcEdges[e][0] + baseIdx, srcEdges[e][1] + baseIdx]
      }
    }
  }

  return { pts: allPts, edges: allEdges }
}

// --- UI Panel ---

function KaleidoscopePanel({
  seg, rot, zm, ofs, spd, fold, opa, mir, ani, cut, fil,
  enabled, onToggle, id,
  onSegChange, onRotChange, onZmChange, onOfsChange, onSpdChange, onFoldChange, onOpaChange,
  onMirChange, onAniChange, onCutChange, onFilChange,
  inConn, inRef, penConn, penInRef, clrConn, clrInRef, clkConn, clkInRef,
  segCvConn, segCvRef, rotCvConn, rotCvRef, zmCvConn, zmCvRef,
  outRef,
}) {
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }

  return (
    <Module label="Kaleido" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0', gap: 2,
      }}>
        {/* Row 1 — seg + rot (both CV) */}
        <div style={rowStyle}>
          <CvKnob port="segCV" moduleId={id} active={segCvConn} signalRef={segCvRef} value={seg} onChange={onSegChange} label="seg" />
          <CvKnob port="rotCV" moduleId={id} active={rotCvConn} signalRef={rotCvRef} value={rot} onChange={onRotChange} label="rot" />
        </div>

        {/* Row 2 — zm (CV) + ofs */}
        <div style={rowStyle}>
          <CvKnob port="zmCV" moduleId={id} active={zmCvConn} signalRef={zmCvRef} value={zm} onChange={onZmChange} label="zm" />
          <Knob value={ofs} onChange={onOfsChange} label="ofs" bipolar />
        </div>

        {/* Row 3 — spd + fold + opa */}
        <div style={rowStyle}>
          <Knob value={spd} onChange={onSpdChange} label="spd" />
          <Knob value={fold} onChange={onFoldChange} label="fold" />
          <Knob value={opa} onChange={onOpaChange} label="opa" />
        </div>

        <Divider className="px-3" />

        {/* Toggles 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', justifyItems: 'center' }}>
          <Toggle value={mir} onChange={onMirChange} label="mir" size="sm" horizontal />
          <Toggle value={cut} onChange={onCutChange} label="cut" size="sm" horizontal />
          <Toggle value={fil} onChange={onFilChange} label="fil" size="sm" horizontal />
          <Toggle value={ani} onChange={onAniChange} label="ani" size="sm" horizontal />
        </div>

        <Divider className="px-3" />

        {/* Jacks */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
          <LabeledJack type="in" port="pen" moduleId={id} active={penConn} signalRef={penInRef} label="pen" />
          <LabeledJack type="in" port="clr" moduleId={id} active={clrConn} signalRef={clrInRef} label="clr" />
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkInRef} label="clk" />
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

// --- Module logic ---

export default function KaleidoscopeModule({ id = 'kal1', init, preview }) {
  if (preview) return <KaleidoscopePanel
    seg={16} rot={0} zm={50} ofs={50} spd={25} fold={50} opa={100} mir={true} ani={false} cut={false} fil={false}
    enabled={false} onToggle={() => {}} id={id}
    onSegChange={() => {}} onRotChange={() => {}} onZmChange={() => {}} onOfsChange={() => {}}
    onSpdChange={() => {}} onFoldChange={() => {}} onOpaChange={() => {}} onMirChange={() => {}} onAniChange={() => {}} onCutChange={() => {}} onFilChange={() => {}}
    inConn={false} inRef={{ current: null }} penConn={false} penInRef={{ current: null }}
    clrConn={false} clrInRef={{ current: null }} clkConn={false} clkInRef={{ current: null }}
    segCvConn={false} segCvRef={{ current: null }} rotCvConn={false} rotCvRef={{ current: null }}
    zmCvConn={false} zmCvRef={{ current: null }} outRef={{ current: null }}
  />

  const [seg, setSeg] = useState(init?.seg ?? 16)
  const [rot, setRot] = useState(init?.rot ?? 0)
  const [zm, setZm] = useState(init?.zm ?? 50)
  const [ofs, setOfs] = useState(init?.ofs ?? 50)
  const [spd, setSpd] = useState(init?.spd ?? 25)
  const [fold, setFold] = useState(init?.fold ?? 50)
  const [opa, setOpa] = useState(init?.opa ?? 100)
  const [mir, setMir] = useState(init?.mir ?? true)
  const [ani, setAni] = useState(init?.ani ?? false)
  const [cut, setCut] = useState(init?.cut ?? false)
  const [fil, setFil] = useState(init?.fil ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const segRef = useRef(16)
  const rotRef = useRef(0)
  const zmRef = useRef(50)
  const ofsRef = useRef(50)
  const spdRef = useRef(25)
  const foldRef = useRef(50)
  const opaRef = useRef(100)
  const mirRef = useRef(true)
  const aniRef = useRef(false)
  const cutRef = useRef(false)
  const filRef = useRef(false)

  const outRef = useRef(null)
  const inRef = useRef(null)
  const penInRef = useRef(null)
  const clrInRef = useRef(null)
  const clkInRef = useRef(null)
  const segCvRef = useRef(null)
  const rotCvRef = useRef(null)
  const zmCvRef = useRef(null)

  const animPhaseRef = useRef(0)
  const prevClkRef = useRef(false)

  enabledRef.current = enabled
  segRef.current = seg
  rotRef.current = rot
  zmRef.current = zm
  ofsRef.current = ofs
  spdRef.current = spd
  foldRef.current = fold
  opaRef.current = opa
  mirRef.current = mir
  aniRef.current = ani
  cutRef.current = cut
  filRef.current = fil

  const inConn = cp.has('in')
  const penConn = cp.has('pen')
  const clrConn = cp.has('clr')
  const clkConn = cp.has('clk')
  const segCvConn = cp.has('segCV')
  const rotCvConn = cp.has('rotCV')
  const zmCvConn = cp.has('zmCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { seg, rot, zm, ofs, spd, fold, opa, mir, ani, cut, fil }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'points' },
      pen: { type: 'pen' },
      clr: { type: 'color' },
      clk: { type: 'scalar' },
      segCV: { type: 'scalar' },
      rotCV: { type: 'scalar' },
      zmCV: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }

      inRef.current = inputs.in
      penInRef.current = inputs.pen
      clrInRef.current = inputs.clr
      clkInRef.current = inputs.clk
      segCvRef.current = inputs.segCV
      rotCvRef.current = inputs.rotCV
      zmCvRef.current = inputs.zmCV

      if (!inputs.in || inputs.in.type !== 'points') {
        outRef.current = null
        return { out: null }
      }

      // Clock rising edge resets animation phase
      const clkHigh = readScalar(inputs.clk) > 50
      if (clkHigh && !prevClkRef.current) animPhaseRef.current = 0
      prevClkRef.current = clkHigh

      // Animation accumulation
      if (aniRef.current) {
        animPhaseRef.current += dt * (spdRef.current / 50)
      }

      // Read params — CV overrides knob
      const segRaw = inputs.segCV ? readScalar(inputs.segCV) : segRef.current
      const rotRaw = inputs.rotCV ? readScalar(inputs.rotCV) : rotRef.current
      const zmRaw = inputs.zmCV ? readScalar(inputs.zmCV) : zmRef.current

      // Map 0-100 knob ranges to internal values
      const segments = Math.max(2, Math.round(2 + (segRaw / 100) * 14))
      const rotation = (rotRaw / 100) * Math.PI * 2 + animPhaseRef.current
      const zoom = 0.1 + (zmRaw / 100) * 2.9
      const offset = ((ofsRef.current - 50) / 50) * 0.5
      const foldVal = 0.5 + (foldRef.current / 100) * 1.0
      const mirror = mirRef.current

      const result = kaleidoscopePoints(
        inputs.in.value, inputs.in.edges,
        { segments, rotation, zoom, offset, fold: foldVal, mirror, cut: cutRef.current }
      )

      const out = points(result.pts, result.edges)

      // Preserve metadata from input
      if (inputs.in.strokeWidth != null) out.strokeWidth = inputs.in.strokeWidth
      out.fill = filRef.current || inputs.in.fill
      if (inputs.in.grid) out.grid = inputs.in.grid
      if (inputs.in.aspectLock) out.aspectLock = inputs.in.aspectLock
      out.opacity = opaRef.current / 100
      if (inputs.in.groups) out.groups = inputs.in.groups
      if (inputs.in.bg) out.bg = inputs.in.bg

      // Color override
      if (inputs.clr?.type === 'color') out.color = inputs.clr.value
      else if (inputs.in.color) out.color = inputs.in.color

      outRef.current = out
      return { out }
    },
  })

  return <KaleidoscopePanel
    seg={seg} rot={rot} zm={zm} ofs={ofs} spd={spd} fold={fold} opa={opa} mir={mir} ani={ani} cut={cut} fil={fil}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onSegChange={setSeg} onRotChange={setRot} onZmChange={setZm} onOfsChange={setOfs}
    onSpdChange={setSpd} onFoldChange={setFold} onOpaChange={setOpa} onMirChange={setMir} onAniChange={setAni} onCutChange={setCut} onFilChange={setFil}
    inConn={inConn} inRef={inRef} penConn={penConn} penInRef={penInRef}
    clrConn={clrConn} clrInRef={clrInRef} clkConn={clkConn} clkInRef={clkInRef}
    segCvConn={segCvConn} segCvRef={segCvRef} rotCvConn={rotCvConn} rotCvRef={rotCvRef}
    zmCvConn={zmCvConn} zmCvRef={zmCvRef} outRef={outRef}
  />
}
