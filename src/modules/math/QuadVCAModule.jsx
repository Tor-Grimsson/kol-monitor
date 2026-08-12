// QuadVCAModule — 4-channel polymorphic voltage-controlled amplifier
// 14HP 3U. Modelled on Intellijel Quad VCA — per-channel CV attenuverter,
// response curve knob, boost switch, level knob. Handles scalar + points +
// color + pen signals: gain scales the value / opacity / alpha as appropriate.
// Output normalling: unpatched OUT N sums into OUT N+1 (patch only OUT 4 for
// a 4-channel mix). CV chain: CV1 normalises to CV2/3/4 when those are
// unpatched. Design doc: .kol/llm-plan/04-quad-vca-dev.md

import { useState, useRef, useEffect } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModuleBypass } from '../../hooks/useModuleBypass.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, color, pen, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import FlipToggle from '../parametric/FlipToggle'
import IconButton from '../parametric/IconButton'
import LED from '../parametric/LED'
import Divider from '../../components/atoms/Divider'
import Icon from '../../icons/Icon'
import { useConnectedPorts, usePatchRouting } from '../../hooks/usePatchRouting.jsx'

const NULL_REF = { current: null }
const CHS = [1, 2, 3, 4]

function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n }
function lerp(a, b, t) { return a + (b - a) * t }

// Polymorphic signal scaler. gain is unitless; typically [0, 2].
function scaleSignal(sig, gain) {
  if (!sig || gain <= 0) return null
  if (sig.type === 'scalar') return scalar(sig.value * gain)
  if (sig.type === 'points') {
    const baseOpacity = sig.opacity != null ? sig.opacity : 1
    return { ...sig, opacity: Math.min(1, baseOpacity * gain) }
  }
  if (sig.type === 'color') {
    const { r, g, b, a = 1 } = sig.value
    return color(r, g, b, Math.min(1, a * gain))
  }
  if (sig.type === 'pen') {
    const p = sig.value
    return pen({ ...p, opacity: Math.min(100, (p.opacity ?? 100) * gain) })
  }
  return sig
}

// Merge two points signals into one multi-group points signal. Preserves per-source
// opacity/color by putting each into its own group — drawSignal's groups branch
// renders them as independent layers.
function mergePointsAsGroups(a, b) {
  const aGroups = a.groups || [{ pts: a.value, edges: a.edges, color: a.color, opacity: a.opacity }]
  const bGroups = b.groups || [{ pts: b.value, edges: b.edges, color: b.color, opacity: b.opacity }]
  const groups = [...aGroups, ...bGroups]

  const value = []
  const edges = []
  let offset = 0
  for (const g of groups) {
    if (g.pts) value.push(...g.pts)
    if (g.edges) for (const [i, j] of g.edges) edges.push([i + offset, j + offset])
    offset += (g.pts?.length || 0)
  }

  return {
    ...a,
    value,
    edges: edges.length ? edges : null,
    groups,
  }
}

function sumSignals(a, b) {
  if (!a) return b
  if (!b) return a
  if (a.type !== b.type) {
    // Mixed-type cascade: points wins (visual layer priority)
    return a.type === 'points' ? a : b.type === 'points' ? b : a
  }
  if (a.type === 'scalar') return scalar(a.value + b.value)
  if (a.type === 'points') return mergePointsAsGroups(a, b)
  if (a.type === 'color') {
    const av = a.value, bv = b.value
    return color(
      Math.min(1, av.r + bv.r),
      Math.min(1, av.g + bv.g),
      Math.min(1, av.b + bv.b),
      Math.max(av.a ?? 1, bv.a ?? 1),
    )
  }
  return a
}

// Extract a single 0-1 intensity value from any signal for the LED indicator.
function signalIntensity(sig) {
  if (!sig) return 0
  if (sig.type === 'scalar') return Math.min(1, Math.abs(sig.value) / 100)
  if (sig.type === 'points') return sig.opacity ?? 1
  if (sig.type === 'color') {
    const { r, g, b } = sig.value
    return Math.max(r, g, b)
  }
  if (sig.type === 'pen') return (sig.value?.opacity ?? 100) / 100
  return 0
}

// Shared rAF loop for channel LEDs — throttled to ~15fps, dirty-checked
const ledCallbacks = new Set()
let ledRafId = null
let ledFrame = 0
function ledTick() {
  ledFrame++
  if (ledFrame % 4 === 0) {
    for (const cb of ledCallbacks) cb()
  }
  ledRafId = requestAnimationFrame(ledTick)
}
function startLedLoop() {
  if (ledRafId == null) ledRafId = requestAnimationFrame(ledTick)
}
function stopLedLoop() {
  if (ledRafId != null) { cancelAnimationFrame(ledRafId); ledRafId = null }
}

// LED bound to a signal ref — brightness tracks signal intensity.
// Green palette (#2ecc71) to match our LED component's 'green' color.
function SignalLED({ signalRef }) {
  const divRef = useRef(null)
  useEffect(() => {
    let prev = -1
    const cb = () => {
      const n = signalIntensity(signalRef.current)
      if (Math.abs(n - prev) < 0.02) return
      prev = n
      const el = divRef.current
      if (!el) return
      const alpha = n.toFixed(2)
      el.style.backgroundColor = n > 0.02 ? `rgba(46, 204, 113, ${alpha})` : 'rgba(180,175,165,0.15)'
      el.style.boxShadow = n > 0.02 ? `0 0 4px rgba(46, 204, 113, ${alpha})` : 'none'
    }
    ledCallbacks.add(cb)
    startLedLoop()
    return () => {
      ledCallbacks.delete(cb)
      if (ledCallbacks.size === 0) stopLedLoop()
    }
  }, [signalRef])
  return <div ref={divRef} style={{
    width: 6, height: 6, borderRadius: '50%',
    backgroundColor: 'rgba(180,175,165,0.15)',
    transition: 'background-color 0.05s, box-shadow 0.05s',
    flexShrink: 0,
  }} />
}

function DashedSpacer() {
  return (
    <div style={{
      flex: 1, height: 1,
      background: 'repeating-linear-gradient(to right, rgba(255,255,255,0.20) 0 2px, transparent 2px 5px)',
    }} />
  )
}

function Channel({ ch, level, atten, curve, boost,
  onLevelChange, onAttenChange, onCurveChange, onBoostChange,
  id, cvConn, cvRef, outRef,
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 6px',
      borderBottom: ch < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none',
    }}>
      {/* Left cluster: CV jack (sm) · CV LED · CV atten knob.
          LED reflects the CV arriving at this channel's CV jack — not the output. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <LabeledJack type="in" port={`cv${ch}`} moduleId={id} active={cvConn} signalRef={cvRef} size="sm" />
        <SignalLED signalRef={cvRef} />
        <Knob value={atten} onChange={onAttenChange} bipolar size="sm" />
      </div>

      <DashedSpacer />

      {/* Middle column: BOOST (LED + flip toggle row) above response row */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LED active={boost} color="red" size="sm" />
          <FlipToggle value={boost} onChange={onBoostChange} variant="horizontal" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="curve-log" size={8} style={{ color: 'var(--kol-palette-red)' }} />
          <Knob value={curve} onChange={onCurveChange} size="sm" />
          <Icon name="curve-exp" size={8} style={{ color: 'var(--kol-palette-red)' }} />
        </div>
      </div>

      <DashedSpacer />

      {/* Right: LEVEL big knob with channel label below */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Knob value={level} onChange={onLevelChange} size="lg" />
        <span className="kol-helper-8" style={{
          color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1,
        }}>{`channel ${ch}`}</span>
      </div>
    </div>
  )
}

function QuadVCAPanel({
  levels, attens, curves, boosts,
  enabled, onToggle, bypass, onBypass, id,
  onLevelChange, onAttenChange, onCurveChange, onBoostChange,
  cvConns, cvRefs, inConns, inRefs, outRefs,
}) {
  return (
    <Module label="QVCA" enabled={enabled} onToggle={onToggle} u={3} bypass={bypass} onBypass={onBypass}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', gap: 4,
      }}>
        {/* Channels — flex:1, distribute vertically */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {CHS.map((ch) => (
            <Channel
              key={ch}
              ch={ch}
              level={levels[ch - 1]} atten={attens[ch - 1]} curve={curves[ch - 1]} boost={boosts[ch - 1]}
              onLevelChange={v => onLevelChange(ch, v)}
              onAttenChange={v => onAttenChange(ch, v)}
              onCurveChange={v => onCurveChange(ch, v)}
              onBoostChange={v => onBoostChange(ch, v)}
              id={id}
              cvConn={cvConns[ch]} cvRef={cvRefs[ch]} outRef={outRefs[ch]}
            />
          ))}
        </div>

        <Divider className="px-2" />

        {/* ABCD-style in/out matrix — adapted from AttenuatorModule */}
        <div style={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(4, auto)',
          columnGap: 20, rowGap: 16,
          justifyContent: 'center',
          padding: '6px 0',
        }}>
          {CHS.map(ch => (
            <div key={`in${ch}`} style={{ position: 'relative' }}>
              <LabeledJack type="in" port={`in${ch}`} moduleId={id} active={inConns[ch]} signalRef={inRefs[ch]} label={`${ch}`} labelPosition="top" />
              <Icon name="caret-down" size={8} style={{
                color: 'rgba(255,255,255,0.25)',
                position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
              }} />
            </div>
          ))}
          {CHS.map((ch, i) => (
            <div key={`out${ch}`} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <JackSocket type="out" port={`out${ch}`} moduleId={id} signalRef={outRefs[ch]} />
              {i < 3 && (
                <Icon name="caret-right" size={8} style={{
                  color: 'rgba(255,255,255,0.25)',
                  position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </Module>
  )
}

export default function QuadVCAModule({ id = 'qvca1', init, preview }) {
  if (preview) return <QuadVCAPanel
    levels={[0, 0, 0, 0]} attens={[0, 0, 0, 0]} curves={[0, 0, 0, 0]} boosts={[false, false, false, false]}
    enabled={false} onToggle={() => {}} id={id}
    onLevelChange={() => {}} onAttenChange={() => {}} onCurveChange={() => {}} onBoostChange={() => {}}
    cvConns={{ 1: false, 2: false, 3: false, 4: false }} cvRefs={{ 1: NULL_REF, 2: NULL_REF, 3: NULL_REF, 4: NULL_REF }}
    inConns={{ 1: false, 2: false, 3: false, 4: false }} inRefs={{ 1: NULL_REF, 2: NULL_REF, 3: NULL_REF, 4: NULL_REF }}
    outRefs={{ 1: NULL_REF, 2: NULL_REF, 3: NULL_REF, 4: NULL_REF }}
  />

  const [level1, setLevel1] = useState(init?.level1 ?? 0)
  const [level2, setLevel2] = useState(init?.level2 ?? 0)
  const [level3, setLevel3] = useState(init?.level3 ?? 0)
  const [level4, setLevel4] = useState(init?.level4 ?? 0)
  const [atten1, setAtten1] = useState(init?.atten1 ?? 0)
  const [atten2, setAtten2] = useState(init?.atten2 ?? 0)
  const [atten3, setAtten3] = useState(init?.atten3 ?? 0)
  const [atten4, setAtten4] = useState(init?.atten4 ?? 0)
  const [curve1, setCurve1] = useState(init?.curve1 ?? 0)
  const [curve2, setCurve2] = useState(init?.curve2 ?? 0)
  const [curve3, setCurve3] = useState(init?.curve3 ?? 0)
  const [curve4, setCurve4] = useState(init?.curve4 ?? 0)
  const [boost1, setBoost1] = useState(init?.boost1 ?? false)
  const [boost2, setBoost2] = useState(init?.boost2 ?? false)
  const [boost3, setBoost3] = useState(init?.boost3 ?? false)
  const [boost4, setBoost4] = useState(init?.boost4 ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const [bypass, setBypass] = useModuleBypass(init?.bypass ?? false)

  const cp = useConnectedPorts(id)
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  enabledRef.current = enabled

  const levelRefs = [useRef(0), useRef(0), useRef(0), useRef(0)]
  const attenRefs = [useRef(0), useRef(0), useRef(0), useRef(0)]
  const curveRefs = [useRef(0), useRef(0), useRef(0), useRef(0)]
  const boostRefs = [useRef(false), useRef(false), useRef(false), useRef(false)]

  levelRefs[0].current = level1; levelRefs[1].current = level2
  levelRefs[2].current = level3; levelRefs[3].current = level4
  attenRefs[0].current = atten1; attenRefs[1].current = atten2
  attenRefs[2].current = atten3; attenRefs[3].current = atten4
  curveRefs[0].current = curve1; curveRefs[1].current = curve2
  curveRefs[2].current = curve3; curveRefs[3].current = curve4
  boostRefs[0].current = boost1; boostRefs[1].current = boost2
  boostRefs[2].current = boost3; boostRefs[3].current = boost4

  const inRefs = { 1: useRef(null), 2: useRef(null), 3: useRef(null), 4: useRef(null) }
  const cvRefs = { 1: useRef(null), 2: useRef(null), 3: useRef(null), 4: useRef(null) }
  const outRefs = { 1: useRef(null), 2: useRef(null), 3: useRef(null), 4: useRef(null) }

  const inConns = { 1: cp.has('in1'), 2: cp.has('in2'), 3: cp.has('in3'), 4: cp.has('in4') }
  const cvConns = { 1: cp.has('cv1'), 2: cp.has('cv2'), 3: cp.has('cv3'), 4: cp.has('cv4') }

  const conns = routing?.connections || []
  const outPatched = [
    conns.some(c => c.fromModuleId === id && c.fromPort === 'out1'),
    conns.some(c => c.fromModuleId === id && c.fromPort === 'out2'),
    conns.some(c => c.fromModuleId === id && c.fromPort === 'out3'),
    conns.some(c => c.fromModuleId === id && c.fromPort === 'out4'),
  ]
  const outPatchedRef = useRef(outPatched)
  outPatchedRef.current = outPatched

  const saveStateRef = useRef({})
  saveStateRef.current = {
    level1, level2, level3, level4,
    atten1, atten2, atten3, atten4,
    curve1, curve2, curve3, curve4,
    boost1, boost2, boost3, boost4,
    bypass,
  }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in1: { type: 'any' }, cv1: { type: 'scalar', cv: 'offset' },
      in2: { type: 'any' }, cv2: { type: 'scalar', cv: 'offset' },
      in3: { type: 'any' }, cv3: { type: 'scalar', cv: 'offset' },
      in4: { type: 'any' }, cv4: { type: 'scalar', cv: 'offset' },
    },
    outputs: {
      out1: { type: 'any' }, out2: { type: 'any' },
      out3: { type: 'any' }, out4: { type: 'any' },
    },
    bypass: [
      { in: 'in1', out: 'out1' }, { in: 'in2', out: 'out2' },
      { in: 'in3', out: 'out3' }, { in: 'in4', out: 'out4' },
    ],
    process: (inputs) => {
      if (!enabledRef.current) {
        for (const ch of CHS) outRefs[ch].current = null
        return { out1: null, out2: null, out3: null, out4: null }
      }

      // Mirror refs for JackSocket animation
      for (const ch of CHS) {
        inRefs[ch].current = inputs[`in${ch}`]
        cvRefs[ch].current = inputs[`cv${ch}`]
      }

      // Per-channel gain stage + CV chain + IN chain.
      // CV chain: unpatched cvN inherits last-patched CV (cv1 → cv2/3/4 normal).
      // IN chain: unpatched inN inherits last-patched signal (in1 → in2/3/4 normal),
      //          matching AttenuatorModule's input cascade convention.
      let cvChain = null
      let inChain = null
      const scaled = [null, null, null, null]
      for (let i = 0; i < 4; i++) {
        const ch = i + 1
        if (inputs[`cv${ch}`]) cvChain = inputs[`cv${ch}`]
        if (inputs[`in${ch}`]) inChain = inputs[`in${ch}`]
        const cvValue = readScalar(cvChain)                      // -100..100 or 0
        const scaledCv = (attenRefs[i].current / 100) * cvValue  // bipolar atten
        const raw = (levelRefs[i].current / 100) + (scaledCv / 100)
        const curved = lerp(raw, raw * raw * raw, curveRefs[i].current / 100)
        const max = boostRefs[i].current ? 2 : 1
        const gain = clamp(curved, 0, max)
        scaled[i] = scaleSignal(inChain, gain)
      }

      // Output cascade: unpatched outputs sum into next channel
      const patched = outPatchedRef.current
      let carry = null
      const out1 = (() => {
        const combined = scaled[0]
        outRefs[1].current = combined
        if (patched[0]) { carry = null } else { carry = combined }
        return combined
      })()
      const out2 = (() => {
        const combined = carry ? sumSignals(carry, scaled[1]) : scaled[1]
        outRefs[2].current = combined
        if (patched[1]) { carry = null } else { carry = combined }
        return combined
      })()
      const out3 = (() => {
        const combined = carry ? sumSignals(carry, scaled[2]) : scaled[2]
        outRefs[3].current = combined
        if (patched[2]) { carry = null } else { carry = combined }
        return combined
      })()
      const out4 = (() => {
        const combined = carry ? sumSignals(carry, scaled[3]) : scaled[3]
        outRefs[4].current = combined
        return combined
      })()

      return { out1, out2, out3, out4 }
    },
  })

  const setLevel = (ch, v) => [setLevel1, setLevel2, setLevel3, setLevel4][ch - 1](v)
  const setAtten = (ch, v) => [setAtten1, setAtten2, setAtten3, setAtten4][ch - 1](v)
  const setCurve = (ch, v) => [setCurve1, setCurve2, setCurve3, setCurve4][ch - 1](v)
  const setBoost = (ch, v) => [setBoost1, setBoost2, setBoost3, setBoost4][ch - 1](v)

  return <QuadVCAPanel
    levels={[level1, level2, level3, level4]}
    attens={[atten1, atten2, atten3, atten4]}
    curves={[curve1, curve2, curve3, curve4]}
    boosts={[boost1, boost2, boost3, boost4]}
    enabled={enabled} onToggle={() => setEnabled(!enabled)}
    bypass={bypass} onBypass={() => setBypass(!bypass)} id={id}
    onLevelChange={setLevel} onAttenChange={setAtten}
    onCurveChange={setCurve} onBoostChange={setBoost}
    cvConns={cvConns} cvRefs={cvRefs}
    inConns={inConns} inRefs={inRefs}
    outRefs={outRefs}
  />
}
