// MagnetoModule — Four head tape echo processor
// 14HP 3U. Psychedelic analog video feedback. 4 delay heads with per-head
// rotation/scale/delay. Tape degradation (age/crinkle/wow/flutter/spring).
// Feedback transport. Inspired by Strymon Magneto.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, points, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import CvKnob from '../parametric/CvKnob'
import Knob from '../parametric/Knob'
import Toggle from '../parametric/Toggle'
import IconButton from '../parametric/IconButton'
import FlipToggle from '../parametric/FlipToggle'
import LabeledControl from '../parametric/LabeledControl'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const BUF_SIZE = 120 // ring-buffer slot count
const MAX_DELAY_SECONDS = 2.0 // total time window the buffer represents (FPS-independent)
const NUM_HEADS = 4

// Palette presets — selectable via the `palette` toggle (4 colors per palette, one per head)
const PALETTES = [
  // 70s — VHS/Vasulka warm, default
  [
    { r: 1, g: 0.1, b: 0.1 },     // head 1: red
    { r: 0.1, g: 1, b: 0.1 },     // head 2: green
    { r: 0.2, g: 0.2, b: 1 },     // head 3: blue
    { r: 1, g: 0.85, b: 0.2 },    // head 4: amber
  ],
  // neon — punchy CMYK + white
  [
    { r: 0.0, g: 1.0, b: 1.0 },   // head 1: cyan
    { r: 1.0, g: 0.0, b: 1.0 },   // head 2: magenta
    { r: 1.0, g: 1.0, b: 0.0 },   // head 3: yellow
    { r: 1.0, g: 1.0, b: 1.0 },   // head 4: white
  ],
  // mono — greyscale, 4 brightnesses
  [
    { r: 1.0, g: 1.0, b: 1.0 },   // head 1: white
    { r: 0.7, g: 0.7, b: 0.7 },   // head 2: light grey
    { r: 0.4, g: 0.4, b: 0.4 },   // head 3: mid grey
    { r: 0.2, g: 0.2, b: 0.2 },   // head 4: dark grey
  ],
]
// Backward-compat alias for any code still referencing HEAD_COLORS as the default
const HEAD_COLORS = PALETTES[0]

// Per-head chromatic offset — like CRT convergence drift
const HEAD_OFFSETS = [
  { x: -0.008, y: -0.005 },    // red drifts upper-left
  { x:  0.008, y: -0.003 },    // green drifts upper-right
  { x:  0.003, y:  0.008 },    // blue drifts lower-right
  { x: -0.004, y:  0.006 },    // amber drifts lower-left
]

// SHIFT mode per-head scale ratios — vector analogue of Strymon's pitch shift
// h1 = +octave+5th (3×), h2 = +octave (2×), h3 = sub-octave (0.5×), h4 = no shift (1×)
const SHIFT_RATIOS = [3.0, 2.0, 0.5, 1.0]

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
  scl, ofs,
  transportMode, rev, order, layer, palette, tapMode, tapEditMode,
  enabled, onToggle, id,
  onModeChange, onDryChange, onWetChange, onSpeedPitchChange, onTap,
  onRecLvlChange, onHeadLevelChange, onHeadToggle, onRepeatsChange,
  onFbInf, onFbRev, onFbFwd, onFbPlay, onFbPause,
  onLowCutChange, onTapeAgeChange, onCrinkleChange, onWowChange, onSpringChange,
  onHeadsChange, onPanChange,
  onSclChange, onOfsChange,
  onTransportMode, onHeadTransport, onOrderChange, onLayerChange, onPaletteChange, onTapModeCycle, onTapEditToggle,
  inConn, inRef, clrConn, clrRef,
  wetRef, dryOutRef,
  clk1Ref, clk2Ref, clk3Ref, clk4Ref,
  h1Ref, h2Ref, h3Ref, h4Ref,
  invRef, expRef,
  clkConn, clkRef, cp,
}) {
  return (
    <Module label="Magneto" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* LEFT — 8 input jacks stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 8px 10px 8px' }}>
            <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
            <LabeledJack type="in" port="clr" moduleId={id} active={clrConn} signalRef={clrRef} label="clr" />
            <LabeledJack type="in" port="dryCV" moduleId={id} label="dry" />
            <LabeledJack type="in" port="spdCV" moduleId={id} label="spd" />
            <LabeledJack type="in" port="recCV" moduleId={id} label="rec" />
            <LabeledJack type="in" port="rptCV" moduleId={id} label="rpt" />
            <LabeledJack type="in" port="sclCV" moduleId={id} label="scl" />
            <LabeledJack type="in" port="ofsCV" moduleId={id} label="ofs" />
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
                      <Toggle value={true} onChange={() => { const modes = ['echo','slit','smear']; onModeChange(modes[(modes.indexOf(mode) + 1) % 3]) }} size="md" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {['echo', 'slit', 'smear'].map(m => (
                          <span key={m} className="kol-helper-xxxxs" style={{
                            color: mode === m ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                            textTransform: 'uppercase', lineHeight: 1,
                          }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 16 }} title="Palette: 70s / neon / mono">
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>palette</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Toggle value={true} onChange={() => onPaletteChange((palette + 1) % 3)} size="md" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {['70s', 'neon', 'mono'].map((p, i) => (
                          <span key={p} className="kol-helper-xxxxs" style={{
                            color: palette === i ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                            textTransform: 'uppercase', lineHeight: 1,
                          }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Knob value={speedPitch} onChange={onSpeedPitchChange} label="spd/pitch" size="xl" />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 16 }}>
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>tap</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Toggle value={true} onChange={tapEditMode ? () => onTapModeCycle() : onTap} size="md" momentary blink={!tapEditMode} blinkPeriodMs={Math.max(40, 0.3 * (2 - speedPitch / 50) * 1000)} forceLit={tapEditMode} color={tapEditMode ? '#497DA2' : '#FFE32E'} onLongPress={onTapEditToggle} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {['splice', 'hold', 'quantize'].map((t, i) => (
                          <span key={t} className="kol-helper-xxxxs" style={{
                            color: tapMode === i ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                            textTransform: 'uppercase', lineHeight: 1,
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <Knob value={wet} onChange={onWetChange} label="wet" size="lg" />
              </div>

              {/* PLAYBACK ROW: REC LVL | 4 heads | REPEATS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Knob value={recLvl} onChange={onRecLvlChange} label="rec lvl" size="lg" />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: recLvl >= 90 ? '#e74c3c' : recLvl >= 60 ? '#FFE32E' : '#66A44C', opacity: (recLvl > 0 && fbPlay && !fbPause && !fbInf && inConn) ? 1 : 0.3, transition: 'opacity 0.1s, background-color 0.15s' }} />
                  </div>
                  <div style={{ paddingTop: 24, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>heads</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <FlipToggle value={heads} onChange={onHeadsChange} positions={3} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>even</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>triplet</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>shift</span>
                      </div>
                    </div>
                  </div>
                  {/* Layer — head z-order within wet trails */}
                  <div style={{ paddingTop: 8, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }} title="Head z-order: 1234 / 4321 / alternating">
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>layer</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <FlipToggle value={layer} onChange={onLayerChange} positions={3} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>1234</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>4321</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>alt</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 heads */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', paddingTop: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <LabeledJack type="out" port="h1" moduleId={id} signalRef={h1Ref} size="sm" />
                    <Knob value={headLevels[0]} onChange={v => onHeadLevelChange(0, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>1</span>
                    </div>
                    <Toggle value={headOn[0]} onChange={() => onHeadToggle(0)} size="md" />
                    <IconButton icon="tr-inf" active={fbInf} onClick={() => onHeadTransport(0)} disabled={!transportMode} title="Infinite (toggle)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <LabeledJack type="out" port="h2" moduleId={id} signalRef={h2Ref} size="sm" />
                    <Knob value={headLevels[1]} onChange={v => onHeadLevelChange(1, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>2</span>
                    </div>
                    <Toggle value={headOn[1]} onChange={() => onHeadToggle(1)} size="md" />
                    <IconButton icon="tr-carets" active={rev} onClick={() => onHeadTransport(1)} disabled={!transportMode} title="Reverse (toggle)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <LabeledJack type="out" port="h3" moduleId={id} signalRef={h3Ref} size="sm" />
                    <Knob value={headLevels[2]} onChange={v => onHeadLevelChange(2, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>3</span>
                    </div>
                    <Toggle value={headOn[2]} onChange={() => onHeadToggle(2)} size="md" />
                    <IconButton icon="tr-skip" momentary onClick={() => onHeadTransport(2)} disabled={!transportMode} title="Restart (trigger)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <LabeledJack type="out" port="h4" moduleId={id} signalRef={h4Ref} size="sm" />
                    <Knob value={headLevels[3]} onChange={v => onHeadLevelChange(3, v)} size="lg" />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="kol-helper-xxxs" style={{ color: '#1a1a1a', lineHeight: 1 }}>4</span>
                    </div>
                    <Toggle value={headOn[3]} onChange={() => onHeadToggle(3)} size="md" />
                    <IconButton icon="tr-pause" active={fbPause} onClick={() => onHeadTransport(3)} disabled={!transportMode} title="Pause (toggle)" />
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
                  {/* Order — controls z-layering of dry vs wet trails */}
                  <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }} title="Layer order: wet on top / mix (tbd) / dry on top (disco)">
                    <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>order</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <FlipToggle value={order} onChange={onOrderChange} positions={3} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>wet</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>mix</span>
                        <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>dry</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DEGRADATION ROW: CUT | AGE | SCL | OFS | CRNK | WOW | SPRNG */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 8px 24px 8px', position: 'relative' }}>
                <Knob value={lowCut} onChange={onLowCutChange} label="clr" size="lg" />
                <Knob value={tapeAge} onChange={onTapeAgeChange} label="age" size="lg" />
                <div style={{ position: 'absolute', left: '38%', top: '50%', transform: 'translate(calc(-50% + 18px), calc(-50% + 22px))' }}>
                  <LabeledControl label="transport" labelClass="kol-helper-xxxxs">
                    <Toggle value={transportMode} onChange={onTransportMode} size="md" color="rgba(255,255,255,0.7)" />
                  </LabeledControl>
                </div>
                <Knob value={scl} onChange={onSclChange} label="scl" size="lg" />
                <Knob value={ofs} onChange={onOfsChange} label="ofs" size="lg" />
                <Knob value={crinkle} onChange={onCrinkleChange} label="crnk" size="lg" />
                <Knob value={wow} onChange={onWowChange} label="wow" size="lg" />
                <Knob value={spring} onChange={onSpringChange} label="sprng" size="lg" />
              </div>
            </div>
          </div>

          {/* RIGHT — 8 output jacks stacked (clk4 moved to bottom strip; pad-bottom keeps spacing) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 8px 10px 8px' }}>
            <LabeledJack type="out" port="inv" moduleId={id} signalRef={invRef} label="inv" />
            <LabeledJack type="out" port="out" moduleId={id} signalRef={wetRef} label="out" />
            <LabeledJack type="out" port="wet" moduleId={id} signalRef={wetRef} label="wet" />
            <LabeledJack type="out" port="dry" moduleId={id} signalRef={dryOutRef} label="dry" />
            <LabeledJack type="out" port="exp" moduleId={id} signalRef={expRef} label="exp" />
            <LabeledJack type="out" port="clk1" moduleId={id} signalRef={clk1Ref} label="clk1" />
            <LabeledJack type="out" port="clk2" moduleId={id} signalRef={clk2Ref} label="clk2" />
            <LabeledJack type="out" port="clk3" moduleId={id} signalRef={clk3Ref} label="clk3" />
          </div>
        </div>
        {/* BOTTOM — transport strip: clk in → controls → clk4 out */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 8px', flexShrink: 0 }}>
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkRef} label="clk" />
          <LabeledJack type="in" port="cutCV" moduleId={id} label="clr" />
          <LabeledJack type="in" port="recGate" moduleId={id} label="rec" />
          <LabeledJack type="in" port="shift" moduleId={id} label="shft" />
          <LabeledJack type="in" port="inf" moduleId={id} icon="tr-inf" />
          <LabeledJack type="in" port="rev" moduleId={id} icon="tr-carets" />
          <LabeledJack type="in" port="fwd" moduleId={id} icon="tr-skip" />
          <LabeledJack type="in" port="pause" moduleId={id} icon="tr-pause" />
          <LabeledJack type="in" port="wowCV" moduleId={id} label="wow" />
          <LabeledJack type="in" port="tap" moduleId={id} label="tap" />
          <LabeledJack type="in" port="sprng" moduleId={id} label="sprng" />
          <LabeledJack type="out" port="clk4" moduleId={id} signalRef={clk4Ref} label="clk4" />
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
    scl={50} ofs={0}
    transportMode={false} rev={false} order={0} layer={0} palette={0} tapMode={0} tapEditMode={false}
    enabled={false} onToggle={() => {}} id={id}
    onModeChange={() => {}} onDryChange={() => {}} onWetChange={() => {}} onSpeedPitchChange={() => {}} onTap={() => {}}
    onRecLvlChange={() => {}} onHeadLevelChange={() => {}} onHeadToggle={() => {}} onRepeatsChange={() => {}}
    onFbInf={() => {}} onFbRev={() => {}} onFbFwd={() => {}} onFbPlay={() => {}} onFbPause={() => {}}
    onLowCutChange={() => {}} onTapeAgeChange={() => {}} onCrinkleChange={() => {}} onWowChange={() => {}} onSpringChange={() => {}}
    heads={0} pan={1} onHeadsChange={() => {}} onPanChange={() => {}}
    onSclChange={() => {}} onOfsChange={() => {}}
    onTransportMode={() => {}} onHeadTransport={() => {}} onOrderChange={() => {}} onLayerChange={() => {}} onPaletteChange={() => {}} onTapModeCycle={() => {}} onTapEditToggle={() => {}}
    inConn={false} inRef={{ current: null }} clrConn={false} clrRef={{ current: null }}
    wetRef={{ current: null }} dryOutRef={{ current: null }}
    clk1Ref={{ current: null }} clk2Ref={{ current: null }} clk3Ref={{ current: null }} clk4Ref={{ current: null }}
    h1Ref={{ current: null }} h2Ref={{ current: null }} h3Ref={{ current: null }} h4Ref={{ current: null }}
    invRef={{ current: null }} expRef={{ current: null }}
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
  const [scl, setScl] = useState(init?.scl ?? 50) // 50 → 1.0× composite scale
  const [ofs, setOfs] = useState(init?.ofs ?? 0)  // 0 → no playhead offset
  const [transportMode, setTransportMode] = useState(init?.transportMode ?? false) // off=per-head fb, on=global transport
  const [rev, setRev] = useState(init?.rev ?? false) // false=forward, true=reverse playback
  const [order, setOrder] = useState(init?.order ?? 0) // 0=wet on top, 1=mix (TODO), 2=dry on top (disco)
  const [layer, setLayer] = useState(init?.layer ?? 0) // 0=1234, 1=4321, 2=alt (1,3,2,4) — head z-order within wet
  const [palette, setPalette] = useState(init?.palette ?? 0) // 0=70s, 1=neon, 2=mono
  const [shift, setShift] = useState(init?.shift ?? false) // SHIFT mode: per-head scale ratios (3×/2×/0.5×/1×)
  const [tapMode, setTapMode] = useState(init?.tapMode ?? 0) // 0=splice, 1=hold, 2=quantize — selected tap action; behaviour TBD
  const [tapEditMode, setTapEditMode] = useState(init?.tapEditMode ?? false) // false=red (tap-tempo on click), true=blue (cycle tapMode on click)
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
  const sclRef = useRef(50)
  const ofsRef = useRef(0)
  const transportModeRef = useRef(false)
  const revRef = useRef(false)
  const orderRef = useRef(0)
  const layerRef = useRef(0)
  const paletteRef = useRef(0)
  const shiftRef = useRef(false)
  const tapModeRef = useRef(0)

  const bufferRef = useRef(new Array(BUF_SIZE).fill(null))
  const writeHeadRef = useRef(0)
  const tapPhaseRef = useRef(0)
  const prevClkRef = useRef(false)
  const springAccRef = useRef([0, 0, 0, 0]) // per-head spring velocity
  // Rising-edge tracking for transport CV gates
  const prevTransportRef = useRef({ pause: false, inf: false, rev: false, fwd: false, tap: false, shift: false })
  // Tap-tempo: track time of last tap (button + CV both feed it)
  const lastTapTimeRef = useRef(0)

  const inRef = useRef(null)
  const clrRef = useRef(null)
  const clkInRef = useRef(null)
  const wetRef = useRef(null)
  const dryOutRef = useRef(null)
  const clk1Ref = useRef(null)
  const clk2Ref = useRef(null)
  const clk3Ref = useRef(null)
  const clk4Ref = useRef(null)
  const h1Ref = useRef(null)
  const h2Ref = useRef(null)
  const h3Ref = useRef(null)
  const h4Ref = useRef(null)
  const invRef = useRef(null)
  const expRef = useRef(null)

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
  sclRef.current = scl
  ofsRef.current = ofs
  transportModeRef.current = transportMode
  revRef.current = rev
  orderRef.current = order
  layerRef.current = layer
  paletteRef.current = palette
  shiftRef.current = shift
  tapModeRef.current = tapMode

  const inConn = cp.has('in')
  const clrConn = cp.has('clr')
  const clkConn = cp.has('clk')

  const handleHeadLevel = (h, v) => setHeadLevels(prev => { const next = [...prev]; next[h] = v; return next })
  const handleHeadToggle = (h) => setHeadOn(prev => { const next = [...prev]; next[h] = !next[h]; return next })
  // TAP behaviour by tapMode:
  // 0 (splice) = tap-tempo: derive speedPitch from interval between two taps (within 2s)
  // 1 (hold) = toggle fbInf (freeze buffer / release)
  // 2 (quantize) = snap current speedPitch to nearest musical division (1/2, 1/4, 1/8, 1/16 sec)
  const recordTap = () => {
    const tm = tapModeRef.current
    if (tm === 1) {
      setFbInf(i => !i)
      return
    }
    if (tm === 2) {
      // Snap head1 baseDelay (= 0.3 * (2 - speedPitch/50)) to nearest division
      const currentBase = 0.3 * (2 - speedPitchRef.current / 50)
      const divisions = [0.5, 0.25, 0.125, 0.0625]
      let nearest = divisions[0]
      let minDiff = Math.abs(currentBase - nearest)
      for (const d of divisions) {
        const diff = Math.abs(currentBase - d)
        if (diff < minDiff) { minDiff = diff; nearest = d }
      }
      // Solve back: speedPitch = (2 - nearest / 0.3) * 50
      const newSpeedPitch = Math.max(0, Math.min(100, (2 - nearest / 0.3) * 50))
      setSpeedPitch(newSpeedPitch)
      return
    }
    // splice — tap-tempo (default)
    const now = performance.now() / 1000
    const last = lastTapTimeRef.current
    if (last > 0 && now - last < 2.0) {
      const interval = now - last
      const newSpeedPitch = Math.max(0, Math.min(100, 100 - interval / 0.006))
      setSpeedPitch(newSpeedPitch)
    }
    lastTapTimeRef.current = now
    tapPhaseRef.current = 0
  }
  const handleTap = () => recordTap()
  const handleFbRev = () => setRev(r => !r)
  const handleFbFwd = () => { writeHeadRef.current = 0; tapPhaseRef.current = 0 } // RESTART per Strymon
  const handleTransportMode = () => setTransportMode(m => !m)
  // Per-head IconButton actions when transportMode is on (per Strymon: head1=inf, 2=rev, 3=restart, 4=pause)
  const handleHeadTransport = (h) => {
    if (h === 0) setFbInf(i => !i)
    else if (h === 1) setRev(r => !r)
    else if (h === 2) { writeHeadRef.current = 0; tapPhaseRef.current = 0 } // restart
    else if (h === 3) setFbPause(p => !p)
  }

  const saveStateRef = useRef({})
  saveStateRef.current = { mode, dry, wet, speedPitch, recLvl, headLevels, headOn, repeats, fbInf, fbPlay, fbPause, lowCut, tapeAge, crinkle, wow, spring, heads, pan, scl, ofs, transportMode, rev, order, layer, palette, shift, tapMode, tapEditMode }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'any' },
      clr: { type: 'color' },
      clk: { type: 'scalar' },
      dryCV: { type: 'scalar', cv: 'offset' },
      spdCV: { type: 'scalar', cv: 'offset' },
      recCV: { type: 'scalar', cv: 'offset' },
      rptCV: { type: 'scalar', cv: 'attenuate' },
      sclCV: { type: 'scalar', cv: 'offset' },
      ofsCV: { type: 'scalar', cv: 'offset' },
      // Bottom transport strip — rising-edge gates
      pause: { type: 'scalar' },
      inf: { type: 'scalar' },
      rev: { type: 'scalar' },
      fwd: { type: 'scalar' },
      tap: { type: 'scalar' },
      // Bottom strip extras (declared so JackSocket can render; behaviour TODO)
      recGate: { type: 'scalar' },
      shift: { type: 'scalar' },
      sprng: { type: 'scalar', cv: 'offset' },
      cutCV: { type: 'scalar', cv: 'offset' },
      wowCV: { type: 'scalar', cv: 'offset' },
    },
    outputs: { out: { type: 'points' }, wet: { type: 'points' }, dry: { type: 'any' }, inv: { type: 'points' }, exp: { type: 'scalar' }, clk1: { type: 'scalar' }, clk2: { type: 'scalar' }, clk3: { type: 'scalar' }, clk4: { type: 'scalar' }, h1: { type: 'points' }, h2: { type: 'points' }, h3: { type: 'points' }, h4: { type: 'points' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) {
        wetRef.current = null; dryOutRef.current = null
        clk1Ref.current = null; clk2Ref.current = null; clk3Ref.current = null; clk4Ref.current = null
        h1Ref.current = null; h2Ref.current = null; h3Ref.current = null; h4Ref.current = null
        invRef.current = null; expRef.current = null
        return { out: null, wet: null, dry: null, inv: null, exp: null, clk1: null, clk2: null, clk3: null, clk4: null, h1: null, h2: null, h3: null, h4: null }
      }
      inRef.current = inputs.in
      clrRef.current = inputs.clr
      clkInRef.current = inputs.clk

      // Transport CV — rising-edge detection
      const checkEdge = (port, cb) => {
        const high = readScalar(inputs[port]) > 0
        const prev = prevTransportRef.current[port]
        if (high && !prev) cb()
        prevTransportRef.current[port] = high
      }
      checkEdge('pause', () => setFbPause(p => !p))
      checkEdge('inf', () => setFbInf(i => !i))
      checkEdge('rev', () => setRev(r => !r))
      checkEdge('fwd', () => { writeHeadRef.current = 0; tapPhaseRef.current = 0 }) // restart per Strymon
      checkEdge('tap', () => recordTap())
      checkEdge('shift', () => setShift(s => !s))

      const input = inputs.in
      const buf = bufferRef.current
      // CV+knob merges (offset by default; rpt is attenuate)
      const spdVal = readCv(inputs.spdCV, speedPitchRef.current)
      const spd = spdVal / 50 + readScalar(inputs.clk) / 100
      const age = tapeAgeRef.current / 100
      const crnk = crinkleRef.current / 100
      const wowAmt = readCv(inputs.wowCV, wowRef.current) / 100
      const sprng = readCv(inputs.sprng, springRef.current) / 100
      const rptVal = readCv(inputs.rptCV, repeatsRef.current, 'attenuate')
      const rpt = Math.max(1, Math.round(1 + (rptVal / 100) * 7))
      const rec = readCv(inputs.recCV, recLvlRef.current) / 100
      const sclVal = readCv(inputs.sclCV, sclRef.current) / 100  // 0-1, composite scale
      const ofsVal = readCv(inputs.ofsCV, ofsRef.current) / 100  // 0-1, playhead offset

      // CLK syncs playheads — rising edge resets phase
      const clkHigh = readScalar(inputs.clk) > 0
      if (clkHigh && !prevClkRef.current) tapPhaseRef.current = 0
      prevClkRef.current = clkHigh

      // Write to buffer — rec lvl gates recording AND overdrives at high settings
      // rec > 0.01 = recording armed (green LED); rec > 0.6 = overdrive begins (yellow); rec > 0.9 = max (red)
      // Skip writes when fbInf is true (existing material loops without overwrite)
      // recGate (when patched) overrides fbPlay — high=record, low=don't
      // Each slot stores { data, t } — read via timestamp (FPS-independent)
      const recArmed = inputs.recGate ? readScalar(inputs.recGate) > 0 : fbPlayRef.current
      if (recArmed && !fbPauseRef.current && !fbInfRef.current && input && rec > 0.01) {
        let recordedInput = input
        if (rec > 0.6 && input.value && input.type === 'points') {
          // Overdrive: scale vertices outward from center (1.0 at rec=0.6, ~1.2 at rec=1.0, ~1.45 at rec=1.5)
          const overdrive = 1 + (rec - 0.6) * 0.5
          const scaledPts = input.value.map(pt => ({
            x: 0.5 + (pt.x - 0.5) * overdrive,
            y: 0.5 + (pt.y - 0.5) * overdrive,
          }))
          recordedInput = { ...input, value: scaledPts }
        }
        buf[writeHeadRef.current] = { data: recordedInput, t: t }
        writeHeadRef.current = (writeHeadRef.current + 1) % BUF_SIZE
      }

      // Read the most recent slot whose timestamp is <= targetT (linear scan backward from newest)
      const readAtTime = (targetT) => {
        for (let i = 0; i < BUF_SIZE; i++) {
          const idx = (writeHeadRef.current - 1 - i + BUF_SIZE) % BUF_SIZE
          const slot = buf[idx]
          if (slot && slot.t <= targetT) return slot.data
        }
        return null
      }

      // EXP — personality scalar, always live (derived from settings, not input)
      // Tap-tempo pulse × head activity × tape-character damping
      const tempoHz = 1 / Math.max(0.04, 0.3 * (2 - speedPitchRef.current / 50))
      const expPulse = (Math.sin(t * Math.PI * 2 * tempoHz) + 1) / 2
      let expActivity = 0, expCount = 0
      for (let i = 0; i < NUM_HEADS; i++) {
        if (headOnRef.current[i]) { expActivity += headLevelsRef.current[i]; expCount++ }
      }
      expActivity = expCount > 0 ? expActivity / expCount / 100 : 0
      const expTape = (tapeAgeRef.current + crinkleRef.current + wowRef.current + springRef.current) / 400
      expRef.current = scalar(expPulse * expActivity * (1 - expTape * 0.5) * 100)

      // Dry passthrough
      dryOutRef.current = input
      if (!input || input.type !== 'points') {
        wetRef.current = null
        h1Ref.current = null; h2Ref.current = null; h3Ref.current = null; h4Ref.current = null
        invRef.current = null
        return { out: null, wet: null, dry: input, inv: null, exp: expRef.current, clk1: null, clk2: null, clk3: null, clk4: null, h1: null, h2: null, h3: null, h4: null }
      }

      // Dry signal — fades with knob (+ CV)
      const dryMix = readCv(inputs.dryCV, dryRef.current) / 100
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

      // Determine head iteration order based on layer toggle (z-order within wet trails)
      // 0=1234 (default, head 1 first/back, head 4 last/front)
      // 1=4321 (reversed)
      // 2=alt (1,3,2,4 — alternating warm/cool)
      const HEAD_ORDERS = [[0, 1, 2, 3], [3, 2, 1, 0], [0, 2, 1, 3]]
      const headOrder = HEAD_ORDERS[layerRef.current] || HEAD_ORDERS[0]

      const groups = []
      const headGroups = [[], [], [], []] // per-head groups for individual h1-h4 outputs
      const fxMode = modeRef.current
      const wetMix = wetLvlRef.current / 100
      const dirSign = revRef.current ? -1 : 1

      for (let oi = 0; oi < NUM_HEADS; oi++) {
        const h = headOrder[oi]
        if (!headOnRef.current[h]) continue
        const lvl = headLevelsRef.current[h] / 100
        if (lvl < 0.01) continue

        // Time-based delay: head pattern position × max-window × speed × playhead offset
        const baseDelaySeconds = headDelays[h] * MAX_DELAY_SECONDS * (2 - spd) * (1 + ofsVal)
        const headSign = panSigns[h]
        const chroma = HEAD_OFFSETS[h]

        if (fxMode === 'slit') {
          // SLIT-SCAN — per-row time-slicing
          // Output[row r] = past_frame[time(r)].vertices_that_were_at_that_row
          // Band count fixed at 32 (smooth without fragmentation)
          // Slit window capped to buffer length so no wrap-repeat
          // Keep edges if at least one endpoint is in-band (avoids broken wireframes)
          const NUM_BANDS = 32
          const slitMaxSeconds = Math.min(baseDelaySeconds * rpt, MAX_DELAY_SECONDS)
          const sclMul = (0.5 + sclVal) * (shiftRef.current ? SHIFT_RATIOS[h] : 1)  // composite scale × SHIFT ratio
          for (let b = 0; b < NUM_BANDS; b++) {
            const yMin = b / NUM_BANDS
            const yMax = (b + 1) / NUM_BANDS
            const tNorm = b / Math.max(1, NUM_BANDS - 1)
            // forward: top band (b=0) = oldest; rev flips
            const delayRatio = revRef.current ? tNorm : (1 - tNorm)
            const targetT = t - delayRatio * slitMaxSeconds
            const past = readAtTime(targetT)
            if (!past || past.type !== 'points' || !past.value) continue

            // Build vertex list — keep ALL past vertices (so edges work)
            // Apply composite scale around center (0.5, 0.5) + chromatic offset
            // Mark which are in-band; only render edges that touch the band
            const pastValueSlit = past.value
            const chromaX = chroma.x
            const chromaY = chroma.y
            const bandPts = new Array(pastValueSlit.length)
            for (let i = 0; i < pastValueSlit.length; i++) {
              const pt = pastValueSlit[i]
              bandPts[i] = {
                x: 0.5 + (pt.x - 0.5) * sclMul + chromaX,
                y: 0.5 + (pt.y - 0.5) * sclMul + chromaY,
              }
            }
            const inBand = new Uint8Array(past.value.length)
            let anyInBand = false
            for (let i = 0; i < past.value.length; i++) {
              if (past.value[i].y >= yMin && past.value[i].y < yMax) {
                inBand[i] = 1
                anyInBand = true
              }
            }
            if (!anyInBand) continue

            // Keep edges that touch the band (at least one endpoint inside)
            // — this preserves wireframe continuity at band boundaries
            const bandEdges = []
            if (past.edges) {
              for (const [a, e] of past.edges) {
                if (inBand[a] || inBand[e]) bandEdges.push([a, e])
              }
            }

            const grp = {
              pts: bandPts,
              edges: bandEdges.length > 0 ? bandEdges : null,
              color: (PALETTES[paletteRef.current] || PALETTES[0])[h],
              opacity: lvl * wetMix,
              fill: false,
              stroke: true,
            }
            groups.push(grp)
            headGroups[h].push(grp)
          }
        } else if (fxMode === 'smear') {
          // SMEAR — dense uniform 1-frame taps, low opacity each, single chromatic head
          // Stacks many faint past-frame copies = continuous motion-blur trail
          const numSmears = Math.max(2, rpt * 4)
          const sclMul = (0.5 + sclVal) * (shiftRef.current ? SHIFT_RATIOS[h] : 1)  // composite scale × SHIFT ratio
          // Smear distributes its samples across baseDelaySeconds (one head's worth of buffer)
          // Reverse flips the time direction
          const smearStepSeconds = baseDelaySeconds / numSmears
          for (let s = 0; s < numSmears; s++) {
            const targetT = t - (s + 1) * smearStepSeconds * dirSign
            const past = readAtTime(targetT)
            if (!past || past.type !== 'points' || !past.value) continue
            const dropFactor = (1 - s / numSmears)
            const chromaOffX = chroma.x * (s + 1) * 0.3
            const chromaOffY = chroma.y * (s + 1) * 0.3
            const pastValue = past.value
            const offsetPts = new Array(pastValue.length)
            for (let i = 0; i < pastValue.length; i++) {
              const pt = pastValue[i]
              offsetPts[i] = {
                x: 0.5 + (pt.x - 0.5) * sclMul + chromaOffX,
                y: 0.5 + (pt.y - 0.5) * sclMul + chromaOffY,
              }
            }
            const grp = {
              pts: offsetPts,
              edges: past.edges,
              color: (PALETTES[paletteRef.current] || PALETTES[0])[h],
              opacity: dropFactor * lvl * wetMix,
              fill: false,
              stroke: true,
            }
            groups.push(grp)
            headGroups[h].push(grp)
          }
        } else {
          // ECHO (default — also fallback for legacy 'loop'/'smpl' values)
          // Per-head multi-tap with full tape character
          for (let r = 0; r < rpt; r++) {
            const baseTap = baseDelaySeconds * (r + 1)
            // Reverse: read from opposite time-end (preserves musical reverse-iteration feel)
            const tapDelaySeconds = revRef.current
              ? Math.max(0, MAX_DELAY_SECONDS - baseTap)
              : baseTap
            const tap = readAtTime(t - tapDelaySeconds)
            if (!tap || tap.type !== 'points' || !tap.value) continue

            const drift = (1 + wowAmt * 3) * (r + 1)
            const jx = chroma.x * drift
            const jy = chroma.y * drift
            const headRot = crnk * (Math.PI / 24) * (r + 1) * headSign
            const shiftMul = shiftRef.current ? SHIFT_RATIOS[h] : 1
            const headScl = (1 - sprng * 0.02 * (r + 1)) * (0.5 + sclVal) * shiftMul
            const dropRate = age * 0.3 * (r / rpt)

            const xformed = transformPoints(tap.value, tap.edges, headRot, headScl, jx, jy, dropRate)
            if (!xformed) continue

            const decay = Math.pow(fbInfRef.current ? 0.98 : 0.7, r) * lvl

            const grp = {
              pts: xformed.pts,
              edges: xformed.edges.length > 0 ? xformed.edges : null,
              color: (PALETTES[paletteRef.current] || PALETTES[0])[h],
              opacity: decay * wetMix,
              fill: false,
              stroke: true,
            }
            groups.push(grp)
            headGroups[h].push(grp)
          }
        }
      }

      // Wet = groups only (no dry)
      const wetOut = points([], null)
      wetOut.strokeWidth = input.strokeWidth ?? 1
      wetOut.aspectLock = true
      wetOut.groups = groups
      wetRef.current = wetOut

      // Out = dry + wet combined, ordering controlled by order toggle
      // 0 (wet) = dry rendered first (top-level), wet groups on top
      // 1 (mix) = dry sandwiched: first half of wet behind dry, second half in front
      // 2 (dry/disco) = primary on top: dry pushed as last group, top-level cleared
      let finalGroups = groups
      let outValue = dryPts
      let outEdges = dryEdges.length > 0 ? dryEdges : null
      if (dryPts.length > 0 && (orderRef.current === 1 || orderRef.current === 2)) {
        const dryColor = inputs.clr?.type === 'color' ? inputs.clr.value : (input.color || null)
        const dryGroup = {
          pts: dryPts,
          edges: dryEdges.length > 0 ? dryEdges : null,
          color: dryColor,
          opacity: dryMix,
          fill: false,
          stroke: true,
        }
        if (orderRef.current === 2) {
          // dry on top of all wet
          finalGroups = [...groups, dryGroup]
        } else {
          // mix: split wet groups in half — first half behind dry, second half in front
          const half = Math.floor(groups.length / 2)
          finalGroups = [...groups.slice(0, half), dryGroup, ...groups.slice(half)]
        }
        outValue = []
        outEdges = null
      }
      const out = points(outValue, outEdges)
      out.strokeWidth = input.strokeWidth ?? 1
      out.aspectLock = true
      out.opacity = dryMix
      out.groups = finalGroups
      if (inputs.clr?.type === 'color') out.color = inputs.clr.value
      else if (input.color) out.color = input.color

      // Background — clr knob controls hue (0 = off, >0 = colored bg)
      const bgHue = readCv(inputs.cutCV, lowCutRef.current) / 100
      if (bgHue > 0.01) {
        out.bg = hslToRgb(bgHue, 0.6, 0.08)
        wetOut.bg = out.bg
      }

      // CLK outputs per head — free-running at head delay rate (now time-based, FPS-independent)
      const clkRefs = [clk1Ref, clk2Ref, clk3Ref, clk4Ref]
      for (let h = 0; h < NUM_HEADS; h++) {
        if (!headOnRef.current[h]) { clkRefs[h].current = scalar(0); continue }
        const intervalSeconds = Math.max(0.033, headDelays[h] * MAX_DELAY_SECONDS * (2 - spd))
        springAccRef.current[h] = (springAccRef.current[h] + dt) % intervalSeconds
        clkRefs[h].current = scalar(springAccRef.current[h] < intervalSeconds * 0.3 ? 100 : 0)
      }

      // Per-head points outputs — each contains only that head's wet groups
      const hRefs = [h1Ref, h2Ref, h3Ref, h4Ref]
      for (let h = 0; h < NUM_HEADS; h++) {
        const hOut = points([], null)
        hOut.strokeWidth = input.strokeWidth ?? 1
        hOut.aspectLock = true
        hOut.groups = headGroups[h]
        hRefs[h].current = hOut
      }

      // INV — same geometry as OUT but all colors negated
      const invertColor = (c) => c ? { r: 1 - c.r, g: 1 - c.g, b: 1 - c.b, a: c.a } : null
      const invOut = points(outValue, outEdges)
      invOut.strokeWidth = out.strokeWidth
      invOut.aspectLock = true
      invOut.opacity = out.opacity
      const invGroups = new Array(finalGroups.length)
      for (let i = 0; i < finalGroups.length; i++) {
        const g = finalGroups[i]
        invGroups[i] = {
          pts: g.pts,
          edges: g.edges,
          color: invertColor(g.color),
          opacity: g.opacity,
          fill: g.fill,
          stroke: g.stroke,
        }
      }
      invOut.groups = invGroups
      if (out.color) invOut.color = invertColor(out.color)
      if (out.bg) invOut.bg = invertColor(out.bg)
      invRef.current = invOut

      return { out, wet: out, dry: input, inv: invRef.current, exp: expRef.current, clk1: clk1Ref.current, clk2: clk2Ref.current, clk3: clk3Ref.current, clk4: clk4Ref.current, h1: h1Ref.current, h2: h2Ref.current, h3: h3Ref.current, h4: h4Ref.current }
    },
  })

  return <MagnetoPanel
    mode={mode} dry={dry} wet={wet} speedPitch={speedPitch} tap={false}
    recLvl={recLvl} headLevels={headLevels} headOn={headOn} repeats={repeats}
    fbInf={fbInf} fbRev={false} fbFwd={false} fbPlay={fbPlay} fbPause={fbPause}
    lowCut={lowCut} tapeAge={tapeAge} crinkle={crinkle} wow={wow} spring={spring}
    scl={scl} ofs={ofs}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    onModeChange={setMode} onDryChange={setDry} onWetChange={setWet} onSpeedPitchChange={setSpeedPitch} onTap={handleTap}
    onRecLvlChange={setRecLvl} onHeadLevelChange={handleHeadLevel} onHeadToggle={handleHeadToggle} onRepeatsChange={setRepeats}
    onFbInf={() => setFbInf(!fbInf)} onFbRev={handleFbRev} onFbFwd={handleFbFwd} onFbPlay={() => setFbPlay(!fbPlay)} onFbPause={() => setFbPause(!fbPause)}
    onLowCutChange={setLowCut} onTapeAgeChange={setTapeAge} onCrinkleChange={setCrinkle} onWowChange={setWow} onSpringChange={setSpring}
    heads={heads} pan={pan} onHeadsChange={setHeads} onPanChange={setPan}
    onSclChange={setScl} onOfsChange={setOfs}
    transportMode={transportMode} rev={rev} order={order} layer={layer} palette={palette} tapMode={tapMode} tapEditMode={tapEditMode}
    onTransportMode={handleTransportMode} onHeadTransport={handleHeadTransport} onOrderChange={setOrder} onLayerChange={setLayer} onPaletteChange={setPalette} onTapModeCycle={() => setTapMode(m => (m + 1) % 3)} onTapEditToggle={() => setTapEditMode(e => !e)}
    inConn={inConn} inRef={inRef} clrConn={clrConn} clrRef={clrRef}
    wetRef={wetRef} dryOutRef={dryOutRef}
    clk1Ref={clk1Ref} clk2Ref={clk2Ref} clk3Ref={clk3Ref} clk4Ref={clk4Ref}
    h1Ref={h1Ref} h2Ref={h2Ref} h3Ref={h3Ref} h4Ref={h4Ref}
    invRef={invRef} expRef={expRef}
    clkConn={clkConn} clkRef={clkInRef} cp={cp}
  />
}
