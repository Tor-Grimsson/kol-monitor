// MagnetoModule — Four head tape echo processor
// 14HP 3U. Psychedelic analog video feedback. 4 delay heads with per-head
// rotation/scale/delay. Tape degradation (age/crinkle/wow/flutter/spring).
// Feedback transport. Inspired by Strymon Magneto.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import IconButton from '../controls/IconButton'
import FlipToggle from '../controls/FlipToggle'
import LabeledControl from '../controls/LabeledControl'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const BUF_SIZE = 120 // 2 seconds at 60fps
const NUM_HEADS = 4

const HEAD_COLORS = [
  { r: 1, g: 0.1, b: 0.1 },    // head 1: red
  { r: 0.1, g: 1, b: 0.1 },    // head 2: green
  { r: 0.2, g: 0.2, b: 1 },    // head 3: blue
  { r: 1, g: 0.85, b: 0.2 },   // head 4: amber
]

// Per-head chromatic offset — like CRT convergence drift
const HEAD_OFFSETS = [
  { x: -0.008, y: -0.005 },    // red drifts upper-left
  { x:  0.008, y: -0.003 },    // green drifts upper-right
  { x:  0.003, y:  0.008 },    // blue drifts lower-right
  { x: -0.004, y:  0.006 },    // amber drifts lower-left
]

const HEAD_DELAY_PATTERNS = [
  [0.15, 0.30, 0.55, 0.85],  // even
  [0.12, 0.25, 0.37, 0.75],  // triplet
  [0.10, 0.20, 0.40, 0.90],  // shift
]
const PAN_SIGNS = [
  [1, -1, 1, -1],   // LRLR — alternating counter-rotation
  [1, 1, 1, 1],     // center — all same direction
  [1, 1, -1, -1],   // LRRL — paired counter-rotation
]

function hslToRgb(h, s, l) {
  if (s === 0) return { r: l, g: l, b: l }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return { r: hue2rgb(p, q, h + 1/3), g: hue2rgb(p, q, h), b: hue2rgb(p, q, h - 1/3) }
}

function transformPoints(srcPts, srcEdges, rot, scl, jitterX, jitterY, drop) {
  if (!srcPts || srcPts.length === 0) return null
  const cos = rot === 0 ? 1 : Math.cos(rot)
  const sin = rot === 0 ? 0 : Math.sin(rot)
  const pts = []
  const edges = []
  const base = 0
  for (let i = 0; i < srcPts.length; i++) {
    // Random vertex dropout (tape age)
    if (drop > 0 && Math.random() < drop) continue
    const ox = srcPts[i].x - 0.5
    const oy = srcPts[i].y - 0.5
    const rx = cos * ox - sin * oy
    const ry = sin * ox + cos * oy
    pts.push({
      x: rx * scl + 0.5 + jitterX,
      y: ry * scl + 0.5 + jitterY,
    })
  }
  // Rebuild edges for surviving points (skip if dropout removed vertices)
  if (drop <= 0 && srcEdges) {
    for (const [a, b] of srcEdges) {
      if (a < pts.length && b < pts.length) edges.push([a, b])
    }
  }
  return { pts, edges }
}

// --- UI ---

function MagnetoPanel({
  mode, dry, wet, speedPitch, tap,
  recLvl, headLevels, headOn, repeats,
  fbInf, fbRev, fbFwd, fbPlay, fbPause,
  lowCut, tapeAge, crinkle, wow, spring, heads, pan,
  enabled, onToggle, id,
  onModeChange, onDryChange, onWetChange, onSpeedPitchChange, onTap,
  onRecLvlChange, onHeadLevelChange, onHeadToggle, onRepeatsChange,
  onFbInf, onFbRev, onFbFwd, onFbPlay, onFbPause,
  onLowCutChange, onTapeAgeChange, onCrinkleChange, onWowChange, onSpringChange,
  onHeadsChange, onPanChange,
  inConn, inRef, clrConn, clrRef,
  wetRef, dryOutRef,
  clk1Ref, clk2Ref, clk3Ref, clk4Ref,
  clkConn, clkRef, cp,
}) {
  return (
    <Module label="Magneto" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* LEFT — 8 input jacks stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 8px' }}>
            <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" dim={!inConn} />
            <LabeledJack type="in" port="clr" moduleId={id} active={clrConn} signalRef={clrRef} label="clr" dim={!clrConn} />
            <LabeledJack type="in" port="dryCV" moduleId={id} label="dry" dim={!cp?.has('dryCV')} />
            <LabeledJack type="in" port="spdCV" moduleId={id} label="spd" dim={!cp?.has('spdCV')} />
            <LabeledJack type="in" port="recCV" moduleId={id} label="rec" dim={!cp?.has('recCV')} />
            <LabeledJack type="in" port="rptCV" moduleId={id} label="rpt" dim={!cp?.has('rptCV')} />
            <LabeledJack type="in" port="sclCV" moduleId={id} label="scl" />
            <LabeledJack type="in" port="ofsCV" moduleId={id} label="ofs" />
            <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkRef} label="clk" />
            <LabeledJack type="in" port="gate" moduleId={id} label="gate" dim={!cp?.has('gate')} />
          </div>

          {/* CENTER — 3-column content: left knobs | center | right knobs */}
          <div style={{ display: 'flex', flex: 1, gap: 4, padding: '2px 0' }}>

            {/* CENTER — all content in flex-col */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 4 }}>

              {/* TOP ROW: DRY | MODES | SPD(xl) | TAP | WET */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px' }}>
                <Knob value={dry} onChange={onDryChange} label="dry" size="lg" />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flex: 1, padding: '0 8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 16 }}>
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>modes</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Toggle value={true} onChange={() => { const modes = ['echo','loop','smpl']; onModeChange(modes[(modes.indexOf(mode) + 1) % 3]) }} size="md" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {['echo', 'loop', 'smpl'].map(m => (
                          <span key={m} className="kol-helper-xxxxs" style={{
                            color: mode === m ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                            textTransform: 'uppercase', lineHeight: 1,
                          }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Knob value={speedPitch} onChange={onSpeedPitchChange} label="spd/pitch" size="xl" />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 16 }}>
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>tap</span>
                    <Toggle value={true} onChange={onTap} size="md" momentary />
                    <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>splice</span>
                    <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>hold</span>
                    <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', lineHeight: 1 }}>(pitch quantize)</span>
                  </div>
                </div>
                <Knob value={wet} onChange={onWetChange} label="wet" size="lg" />
              </div>

              {/* PLAYBACK ROW: REC LVL | 4 heads | REPEATS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Knob value={recLvl} onChange={onRecLvlChange} label="rec lvl" size="lg" />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e74c3c', opacity: recLvl > 0 ? 1 : 0.3 }} />
                  </div>
                  <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>heads</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>even</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>triplet</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>shift</span>
                      </div>
                      <FlipToggle value={heads} onChange={onHeadsChange} positions={3} />
                    </div>
                  </div>
                </div>

                {/* 4 heads */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', paddingTop: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Knob value={headLevels[0]} onChange={v => onHeadLevelChange(0, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>1</span>
                    </div>
                    <Toggle value={headOn[0]} onChange={() => onHeadToggle(0)} size="md" />
                    <IconButton icon="tr-inf" size={24} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Knob value={headLevels[1]} onChange={v => onHeadLevelChange(1, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>2</span>
                    </div>
                    <Toggle value={headOn[1]} onChange={() => onHeadToggle(1)} size="md" />
                    <IconButton icon="tr-carets" size={24} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Knob value={headLevels[2]} onChange={v => onHeadLevelChange(2, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>3</span>
                    </div>
                    <Toggle value={headOn[2]} onChange={() => onHeadToggle(2)} size="md" />
                    <IconButton icon="tr-skip" size={24} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Knob value={headLevels[3]} onChange={v => onHeadLevelChange(3, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>4</span>
                    </div>
                    <Toggle value={headOn[3]} onChange={() => onHeadToggle(3)} size="md" />
                    <IconButton icon="tr-pause" size={24} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Knob value={repeats} onChange={onRepeatsChange} label="repeats" size="lg" />
                  <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>pan</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <FlipToggle value={pan} onChange={onPanChange} positions={3} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>lrlr</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>cntr</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>lrrl</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DEGRADATION ROW: CUT | AGE | CRNK | WOW | SPRNG */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 8px 24px 8px', position: 'relative' }}>
                <Knob value={lowCut} onChange={onLowCutChange} label="cut" size="lg" />
                <Knob value={tapeAge} onChange={onTapeAgeChange} label="age" size="lg" />
                <div style={{ position: 'absolute', left: '38%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <LabeledControl label="transport" labelClass="kol-helper-xxxxs">
                    <Toggle momentary onChange={onTap} size="md" color="rgba(255,255,255,0.7)" />
                  </LabeledControl>
                </div>
                <Knob value={crinkle} onChange={onCrinkleChange} label="crnk" size="lg" />
                <Knob value={wow} onChange={onWowChange} label="wow" size="lg" />
                <Knob value={spring} onChange={onSpringChange} label="sprng" size="lg" />
              </div>
            </div>
          </div>

          {/* RIGHT — 8 output jacks stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 8px' }}>
            <LabeledJack type="out" port="spd" moduleId={id} label="spd" />
            <LabeledJack type="out" port="out" moduleId={id} signalRef={wetRef} label="out" />
            <LabeledJack type="out" port="wet" moduleId={id} signalRef={wetRef} label="wet" />
            <LabeledJack type="out" port="dry" moduleId={id} signalRef={dryOutRef} label="dry" />
            <LabeledJack type="out" port="rpt" moduleId={id} label="rpt" />
            <LabeledJack type="out" port="clk1" moduleId={id} signalRef={clk1Ref} label="clk1" />
            <LabeledJack type="out" port="clk2" moduleId={id} signalRef={clk2Ref} label="clk2" />
            <LabeledJack type="out" port="clk3" moduleId={id} signalRef={clk3Ref} label="clk3" />
            <LabeledJack type="out" port="clk4" moduleId={id} signalRef={clk4Ref} label="clk4" />
          </div>
        </div>
        {/* BOTTOM — transport strip: clk in → controls → clk4 out */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 8px', flexShrink: 0 }}>
          <LabeledJack type="in" port="clkB" moduleId={id} label="clk" dim={!cp?.has('clkB')} />
          <LabeledJack type="in" port="recGate" moduleId={id} label="rec" dim={!cp?.has('recGate')} />
          <LabeledJack type="in" port="shift" moduleId={id} label="shft" dim={!cp?.has('shift')} />
          <LabeledJack type="in" port="inf" moduleId={id} icon="tr-inf" dim={!cp?.has('inf')} />
          <LabeledJack type="in" port="rev" moduleId={id} icon="tr-carets" dim={!cp?.has('rev')} />
          <LabeledJack type="in" port="fwd" moduleId={id} icon="tr-skip" dim={!cp?.has('fwd')} />
          <LabeledJack type="in" port="play" moduleId={id} label="▷" dim={!cp?.has('play')} />
          <LabeledJack type="in" port="pause" moduleId={id} icon="tr-pause" dim={!cp?.has('pause')} />
          <LabeledJack type="in" port="tap" moduleId={id} label="tap" dim={!cp?.has('tap')} />
          <LabeledJack type="in" port="sprng" moduleId={id} label="sprng" dim={!cp?.has('sprng')} />
          <LabeledJack type="out" port="clk4B" moduleId={id} signalRef={clk4Ref} label="clk4" dim={!cp?.has('clk4B')} />
        </div>

      </div>
    </Module>
  )
}

// --- Module ---

export default function MagnetoModule({ id = 'mag1', init, preview }) {
  if (preview) return <MagnetoPanel
    mode="echo" dry={50} wet={80} speedPitch={50} tap={false}
    recLvl={80} headLevels={[75, 50, 35, 20]} headOn={[true, true, true, true]} repeats={50}
    fbInf={false} fbRev={false} fbFwd={false} fbPlay={true} fbPause={false}
    lowCut={0} tapeAge={0} crinkle={0} wow={0} spring={0}
    enabled={false} onToggle={() => {}} id={id}
    onModeChange={() => {}} onDryChange={() => {}} onWetChange={() => {}} onSpeedPitchChange={() => {}} onTap={() => {}}
    onRecLvlChange={() => {}} onHeadLevelChange={() => {}} onHeadToggle={() => {}} onRepeatsChange={() => {}}
    onFbInf={() => {}} onFbRev={() => {}} onFbFwd={() => {}} onFbPlay={() => {}} onFbPause={() => {}}
    onLowCutChange={() => {}} onTapeAgeChange={() => {}} onCrinkleChange={() => {}} onWowChange={() => {}} onSpringChange={() => {}}
    heads={0} pan={1} onHeadsChange={() => {}} onPanChange={() => {}}
    inConn={false} inRef={{ current: null }} clrConn={false} clrRef={{ current: null }}
    wetRef={{ current: null }} dryOutRef={{ current: null }}
    clk1Ref={{ current: null }} clk2Ref={{ current: null }} clk3Ref={{ current: null }} clk4Ref={{ current: null }}
    clkConn={false} clkRef={{ current: null }} cp={null}
  />

  const [mode, setMode] = useState(init?.mode ?? 'echo')
  const [dry, setDry] = useState(init?.dry ?? 50)
  const [wet, setWet] = useState(init?.wet ?? 80)
  const [speedPitch, setSpeedPitch] = useState(init?.speedPitch ?? 50)
  const [recLvl, setRecLvl] = useState(init?.recLvl ?? 80)
  const [headLevels, setHeadLevels] = useState(init?.headLevels ?? [75, 50, 35, 20])
  const [headOn, setHeadOn] = useState(init?.headOn ?? [true, true, true, true])
  const [repeats, setRepeats] = useState(init?.repeats ?? 50)
  const [fbInf, setFbInf] = useState(init?.fbInf ?? false)
  const [fbPlay, setFbPlay] = useState(init?.fbPlay ?? true)
  const [fbPause, setFbPause] = useState(init?.fbPause ?? false)
  const [lowCut, setLowCut] = useState(init?.lowCut ?? 0)
  const [tapeAge, setTapeAge] = useState(init?.tapeAge ?? 0)
  const [crinkle, setCrinkle] = useState(init?.crinkle ?? 0)
  const [wow, setWow] = useState(init?.wow ?? 0)
  const [spring, setSpring] = useState(init?.spring ?? 0)
  const [heads, setHeads] = useState(init?.heads ?? 0) // 0=even 1=triplet 2=shift
  const [pan, setPan] = useState(init?.pan ?? 1) // 0=LRLR 1=center 2=LRRL
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  // Refs for process
  const enabledRef = useRef(true)
  const modeRef = useRef('echo')
  const dryRef = useRef(50)
  const wetLvlRef = useRef(80)
  const speedPitchRef = useRef(50)
  const recLvlRef = useRef(80)
  const headLevelsRef = useRef([75, 50, 35, 20])
  const headOnRef = useRef([true, true, true, true])
  const repeatsRef = useRef(50)
  const fbInfRef = useRef(false)
  const fbPlayRef = useRef(true)
  const fbPauseRef = useRef(false)
  const lowCutRef = useRef(0)
  const tapeAgeRef = useRef(0)
  const crinkleRef = useRef(0)
  const wowRef = useRef(0)
  const springRef = useRef(0)
  const headsRef = useRef(0)
  const panRef = useRef(1)

  const bufferRef = useRef(new Array(BUF_SIZE).fill(null))
  const writeHeadRef = useRef(0)
  const tapPhaseRef = useRef(0)
  const prevClkRef = useRef(false)
  const springAccRef = useRef([0, 0, 0, 0]) // per-head spring velocity

  const inRef = useRef(null)
  const clrRef = useRef(null)
  const clkInRef = useRef(null)
  const wetRef = useRef(null)
  const dryOutRef = useRef(null)
  const clk1Ref = useRef(null)
  const clk2Ref = useRef(null)
  const clk3Ref = useRef(null)
  const clk4Ref = useRef(null)

  enabledRef.current = enabled
  modeRef.current = mode
  dryRef.current = dry
  wetLvlRef.current = wet
  speedPitchRef.current = speedPitch
  recLvlRef.current = recLvl
  headLevelsRef.current = headLevels
  headOnRef.current = headOn
  repeatsRef.current = repeats
  fbInfRef.current = fbInf
  fbPlayRef.current = fbPlay
  fbPauseRef.current = fbPause
  lowCutRef.current = lowCut
  tapeAgeRef.current = tapeAge
  crinkleRef.current = crinkle
  wowRef.current = wow
  springRef.current = spring
  headsRef.current = heads
  panRef.current = pan

  const inConn = cp.has('in')
  const clrConn = cp.has('clr')
  const clkConn = cp.has('clk')

  const handleHeadLevel = (h, v) => setHeadLevels(prev => { const next = [...prev]; next[h] = v; return next })
  const handleHeadToggle = (h) => setHeadOn(prev => { const next = [...prev]; next[h] = !next[h]; return next })
  const handleTap = () => { tapPhaseRef.current = 0 }
  const handleFbRev = () => { /* reverse buffer read direction */ }
  const handleFbFwd = () => { /* fast forward */ }

  const saveStateRef = useRef({})
  saveStateRef.current = { mode, dry, wet, speedPitch, recLvl, headLevels, headOn, repeats, fbInf, fbPlay, fbPause, lowCut, tapeAge, crinkle, wow, spring, heads, pan }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { in: { type: 'any' }, clr: { type: 'color' }, clk: { type: 'scalar' }, sclCV: { type: 'scalar' }, ofsCV: { type: 'scalar' } },
    outputs: { out: { type: 'points' }, wet: { type: 'points' }, dry: { type: 'any' }, clk1: { type: 'scalar' }, clk2: { type: 'scalar' }, clk3: { type: 'scalar' }, clk4: { type: 'scalar' } },
    process: (inputs, dt) => {
      if (!enabledRef.current) {
        wetRef.current = null; dryOutRef.current = null
        clk1Ref.current = null; clk2Ref.current = null; clk3Ref.current = null; clk4Ref.current = null
        return { out: null, wet: null, dry: null, clk1: null, clk2: null, clk3: null, clk4: null }
      }
      inRef.current = inputs.in
      clrRef.current = inputs.clr
      clkInRef.current = inputs.clk

      const input = inputs.in
      const buf = bufferRef.current
      const spd = speedPitchRef.current / 50 + readScalar(inputs.clk) / 100
      const age = tapeAgeRef.current / 100
      const crnk = crinkleRef.current / 100
      const wowAmt = wowRef.current / 100
      const sprng = springRef.current / 100
      const rpt = Math.max(1, Math.round(1 + (repeatsRef.current / 100) * 7))
      const rec = recLvlRef.current / 100

      // CV inputs
      const sclCV = readScalar(inputs.sclCV) / 100  // 0-1, comp scale before output
      const ofsCV = readScalar(inputs.ofsCV) / 100   // 0-1, playhead offset

      // CLK syncs playheads — rising edge resets phase
      const clkHigh = readScalar(inputs.clk) > 0
      if (clkHigh && !prevClkRef.current) tapPhaseRef.current = 0
      prevClkRef.current = clkHigh

      // Write to buffer — rec lvl gates recording, independent of dry
      if (fbPlayRef.current && !fbPauseRef.current && input && rec > 0.01) {
        buf[writeHeadRef.current] = input
        writeHeadRef.current = (writeHeadRef.current + 1) % BUF_SIZE
      }

      // Dry passthrough
      dryOutRef.current = input
      if (!input || input.type !== 'points') {
        wetRef.current = null
        return { out: null, wet: null, dry: input, clk1: null, clk2: null, clk3: null, clk4: null }
      }

      // Dry signal — fades with knob
      const dryMix = dryRef.current / 100
      const dryPts = []
      const dryEdges = []
      if (dryMix > 0.01 && input.value) {
        for (const pt of input.value) dryPts.push(pt)
        if (input.edges) for (const [a, b] of input.edges) dryEdges.push([a, b])
      }

      // Per-head delay taps — each head accumulates all repeats into one group
      const headDelays = HEAD_DELAY_PATTERNS[headsRef.current] || HEAD_DELAY_PATTERNS[0]
      const panSigns = PAN_SIGNS[panRef.current] || PAN_SIGNS[1]
      const hueRate = lowCutRef.current / 100
      tapPhaseRef.current += dt * spd

      const groups = []

      for (let h = 0; h < NUM_HEADS; h++) {
        if (!headOnRef.current[h]) continue
        const lvl = headLevelsRef.current[h] / 100
        if (lvl < 0.01) continue

        const baseDelay = Math.round(headDelays[h] * BUF_SIZE * (2 - spd) * (1 + ofsCV))
        const headSign = panSigns[h]

        const m = modeRef.current
        const doFill = m === 'loop' || m === 'smpl'
        const doStroke = m === 'echo' || m === 'smpl'
        const wetMix = wetLvlRef.current / 100

        for (let r = 0; r < rpt; r++) {
          const tapDelay = baseDelay * (r + 1)
          const readPos = ((writeHeadRef.current - 1 - tapDelay) % BUF_SIZE + BUF_SIZE) % BUF_SIZE
          const tap = buf[readPos]
          if (!tap || tap.type !== 'points' || !tap.value) continue

          // Chromatic offset — built-in per-head CRT drift + wow amplifies it
          const chroma = HEAD_OFFSETS[h]
          const drift = (1 + wowAmt * 3) * (r + 1)
          const jx = chroma.x * drift
          const jy = chroma.y * drift
          // Subtle rotation — crinkle adds gentle twist per repeat
          const headRot = crnk * (Math.PI / 24) * (r + 1) * headSign
          // Subtle scale — spring adds slight zoom per repeat, sclCV scales composite
          const headScl = (1 - sprng * 0.02 * (r + 1)) * (0.5 + sclCV)
          // Tape degradation — vertex dropout on later repeats
          const dropRate = age * 0.3 * (r / rpt)

          const xformed = transformPoints(tap.value, tap.edges, headRot, headScl, jx, jy, dropRate)
          if (!xformed) continue

          const decay = Math.pow(fbInfRef.current ? 0.98 : 0.7, r) * lvl

          groups.push({
            pts: xformed.pts,
            edges: xformed.edges.length > 0 ? xformed.edges : null,
            color: HEAD_COLORS[h],
            opacity: decay * wetMix,
            fill: doFill,
            stroke: doStroke,
          })
        }
      }

      // Wet = groups only (no dry)
      const wetOut = points([], null)
      wetOut.strokeWidth = input.strokeWidth ?? 1
      wetOut.groups = groups
      wetRef.current = wetOut

      // Out = dry + wet combined
      const out = points(dryPts, dryEdges.length > 0 ? dryEdges : null)
      out.strokeWidth = input.strokeWidth ?? 1
      out.opacity = dryMix
      out.groups = groups
      if (inputs.clr?.type === 'color') out.color = inputs.clr.value
      else if (input.color) out.color = input.color

      // Background — cut knob controls hue (0 = off, >0 = colored bg)
      const bgHue = lowCutRef.current / 100
      if (bgHue > 0.01) {
        out.bg = hslToRgb(bgHue, 0.6, 0.08)
        wetOut.bg = out.bg
      }

      // CLK outputs per head — free-running at head delay rate
      const clkRefs = [clk1Ref, clk2Ref, clk3Ref, clk4Ref]
      for (let h = 0; h < NUM_HEADS; h++) {
        if (!headOnRef.current[h]) { clkRefs[h].current = scalar(0); continue }
        const interval = Math.max(2, Math.round(headDelays[h] * BUF_SIZE * (2 - spd)))
        springAccRef.current[h] = (springAccRef.current[h] + 1) % interval
        clkRefs[h].current = scalar(springAccRef.current[h] < interval * 0.3 ? 100 : 0)
      }

      return { out, wet: out, dry: input, clk1: clk1Ref.current, clk2: clk2Ref.current, clk3: clk3Ref.current, clk4: clk4Ref.current }
    },
  })

  return <MagnetoPanel
    mode={mode} dry={dry} wet={wet} speedPitch={speedPitch} tap={false}
    recLvl={recLvl} headLevels={headLevels} headOn={headOn} repeats={repeats}
    fbInf={fbInf} fbRev={false} fbFwd={false} fbPlay={fbPlay} fbPause={fbPause}
    lowCut={lowCut} tapeAge={tapeAge} crinkle={crinkle} wow={wow} spring={spring}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onModeChange={setMode} onDryChange={setDry} onWetChange={setWet} onSpeedPitchChange={setSpeedPitch} onTap={handleTap}
    onRecLvlChange={setRecLvl} onHeadLevelChange={handleHeadLevel} onHeadToggle={handleHeadToggle} onRepeatsChange={setRepeats}
    onFbInf={() => setFbInf(!fbInf)} onFbRev={handleFbRev} onFbFwd={handleFbFwd} onFbPlay={() => setFbPlay(!fbPlay)} onFbPause={() => setFbPause(!fbPause)}
    onLowCutChange={setLowCut} onTapeAgeChange={setTapeAge} onCrinkleChange={setCrinkle} onWowChange={setWow} onSpringChange={setSpring}
    heads={heads} pan={pan} onHeadsChange={setHeads} onPanChange={setPan}
    inConn={inConn} inRef={inRef} clrConn={clrConn} clrRef={clrRef}
    wetRef={wetRef} dryOutRef={dryOutRef}
    clk1Ref={clk1Ref} clk2Ref={clk2Ref} clk3Ref={clk3Ref} clk4Ref={clk4Ref}
    clkConn={clkConn} clkRef={clkInRef} cp={cp}
  />
}
