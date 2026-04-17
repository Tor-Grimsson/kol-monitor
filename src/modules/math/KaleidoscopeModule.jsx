// KaleidoscopeModule — radial mirror for points geometry
// 12HP 3U. Replicates input shapes N times around center with alternating reflections.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModuleBypass } from '../../hooks/useModuleBypass.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar, readCv } from '../../hooks/signals'
import { sinLut, cosLut } from '../../hooks/trigLut'
import { newClockSyncState, advanceClockSync } from '../../hooks/clockSync'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

// --- Pure geometry transform ---
//
// New approach: compute ONE canonical wedge (at rotation=0, no mirror, no offset) and
// emit it with `signal.instances` describing how to replay it N times with canvas
// transforms. Cuts per-vertex JS work by `segments`× at the cost of a handful of
// matrix transforms in drawSignal. See drawSignal's instance-loop for the exact
// transform order (mirror → offset → rotate around centre).

function canonicalWedge(srcPts, srcEdges, { zoom, fold, cut, halfWedge }) {
  const N = srcPts.length
  const sinH = cut ? sinLut(halfWedge) : 0
  const cosH = cut ? cosLut(halfWedge) : 0

  const allPts = new Array(N)
  for (let i = 0; i < N; i++) {
    let px = (srcPts[i].x - 0.5) * zoom
    let py = (srcPts[i].y - 0.5) * zoom * fold

    if (cut) {
      // Fast inside check via cross-product: |py| * cosH <= px * sinH (when px > 0)
      const absPy = py < 0 ? -py : py
      if (px < 0 || absPy * cosH > px * sinH) {
        const r = Math.sqrt(px * px + py * py)
        const ptAngle = Math.atan2(py, px)
        const signY = ptAngle < -halfWedge ? -1 : 1
        px = r * cosH
        py = r * sinH * signY
      }
    }

    allPts[i] = { x: px + 0.5, y: py + 0.5 }
  }

  // Edges are unchanged — wedge has the same vertex count and ordering as the source.
  return { pts: allPts, edges: srcEdges || null }
}

// --- UI Panel ---

function KaleidoscopePanel({
  seg, rot, zm, ofs, spd, fold, opa, mir, ani, cut, fil,
  enabled, onToggle, bypass, onBypass, id,
  onSegChange, onRotChange, onZmChange, onOfsChange, onSpdChange, onFoldChange, onOpaChange,
  onMirChange, onAniChange, onCutChange, onFilChange,
  inConn, inRef, penConn, penInRef, clrConn, clrInRef, clkConn, clkInRef,
  segCvConn, segCvRef, rotCvConn, rotCvRef, zmCvConn, zmCvRef,
  outRef,
}) {
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }

  return (
    <Module label="Kaleido" enabled={enabled} onToggle={onToggle} bypass={bypass} onBypass={onBypass}>
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
  const [bypass, setBypass] = useModuleBypass(init?.bypass ?? false)
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

  const syncRef = useRef(newClockSyncState())

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
  saveStateRef.current = { seg, rot, zm, ofs, spd, fold, opa, mir, ani, cut, fil, bypass }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'points' },
      pen: { type: 'pen' },
      clr: { type: 'color' },
      clk: { type: 'scalar' },
      segCV: { type: 'scalar', cv: 'offset' },
      rotCV: { type: 'scalar', cv: 'offset' },
      zmCV: { type: 'scalar', cv: 'offset' },
    },
    outputs: { out: { type: 'points' } },
    bypass: { in: 'in', out: 'out' },
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

      // Sync animation phase to clock when patched; free-run at spd knob otherwise.
      // Fallback rate: spd knob drives rotation cycles. At spd=50, one full rotation
      // in 2π seconds (baseline). Phase ∈ [0,1) is scaled to radians below.
      const fallbackHz = (spdRef.current / 50) / (2 * Math.PI)
      if (aniRef.current) {
        advanceClockSync(syncRef.current, inputs.clk, t, dt, fallbackHz)
      }

      // Read params — CV merged with knob (offset default)
      const segRaw = readCv(inputs.segCV, segRef.current)
      const rotRaw = readCv(inputs.rotCV, rotRef.current)
      const zmRaw = readCv(inputs.zmCV, zmRef.current)

      // Map 0-100 knob ranges to internal values
      const segments = Math.max(2, Math.round(2 + (segRaw / 100) * 14))
      const rotation = (rotRaw / 100) * Math.PI * 2 + syncRef.current.phase * 2 * Math.PI
      const zoom = 0.1 + (zmRaw / 100) * 2.9
      const offset = ((ofsRef.current - 50) / 50) * 0.5
      const foldVal = 0.5 + (foldRef.current / 100) * 1.0
      const mirror = mirRef.current

      const segAngle = (Math.PI * 2) / segments
      const halfWedge = (segAngle / 2) * foldVal
      const wedgeParams = { zoom, fold: foldVal, cut: cutRef.current, halfWedge }

      // Canonical wedge (one segment's worth of geometry, centred at 0.5, no rotation/mirror)
      const result = canonicalWedge(inputs.in.value, inputs.in.edges, wedgeParams)

      const out = points(result.pts, result.edges)

      // Preserve metadata from input
      if (inputs.in.strokeWidth != null) out.strokeWidth = inputs.in.strokeWidth
      out.fill = filRef.current || inputs.in.fill
      if (inputs.in.grid) out.grid = inputs.in.grid
      // Aspect lock is required for undistorted radial rotation — force it on our output.
      out.aspectLock = true
      out.opacity = opaRef.current / 100

      // Groups: each group becomes its own canonical wedge. Instance replay (below)
      // applies the same rotation/mirror/offset to all groups uniformly.
      if (inputs.in.groups) {
        const srcGroups = inputs.in.groups
        const outGroups = new Array(srcGroups.length)
        for (let gi = 0; gi < srcGroups.length; gi++) {
          const g = srcGroups[gi]
          if (!g.pts || g.pts.length === 0) { outGroups[gi] = g; continue }
          const gResult = canonicalWedge(g.pts, g.edges, wedgeParams)
          outGroups[gi] = {
            pts: gResult.pts,
            edges: gResult.edges,
            color: g.color,
            opacity: g.opacity,
            fill: g.fill,
            stroke: g.stroke,
          }
        }
        out.groups = outGroups
      }

      // Instances — one per segment. drawSignal applies these as canvas transforms
      // in order: mirror → translate(offsetX, 0) → rotate around centre.
      const instances = new Array(segments)
      for (let s = 0; s < segments; s++) {
        instances[s] = {
          rotation: rotation + s * segAngle,
          mirror: mirror && (s % 2 === 1),
          offsetX: offset,
        }
      }
      out.instances = instances

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
    enabled={enabled} onToggle={() => setEnabled(!enabled)} bypass={bypass} onBypass={() => setBypass(!bypass)} id={id}
    onSegChange={setSeg} onRotChange={setRot} onZmChange={setZm} onOfsChange={setOfs}
    onSpdChange={setSpd} onFoldChange={setFold} onOpaChange={setOpa} onMirChange={setMir} onAniChange={setAni} onCutChange={setCut} onFilChange={setFil}
    inConn={inConn} inRef={inRef} penConn={penConn} penInRef={penInRef}
    clrConn={clrConn} clrInRef={clrInRef} clkConn={clkConn} clkInRef={clkInRef}
    segCvConn={segCvConn} segCvRef={segCvRef} rotCvConn={rotCvConn} rotCvRef={rotCvRef}
    zmCvConn={zmCvConn} zmCvRef={zmCvRef} outRef={outRef}
  />
}
