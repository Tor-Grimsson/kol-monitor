// ModuleDesign — visual mockup page for module panel layouts
// Access at /design

import Module from '../../modules/utility/Module'
import JackSocket from '../../modules/utility/JackSocket'
import LabeledJack from '../../modules/parametric/LabeledJack'
import Knob from '../../modules/parametric/Knob'
import CvKnob from '../../modules/parametric/CvKnob'
import Slider from '../../modules/parametric/Slider'
import FlipToggle from '../../modules/parametric/FlipToggle'
import Toggle from '../../modules/parametric/Toggle'
import IconButton from '../../modules/parametric/IconButton'
import LED from '../../modules/parametric/LED'
import Divider from '../../components/atoms/Divider'
import Icon from '../../icons/Icon'
import { HP_PX, TOTAL_HP, ASPECT } from '../../modules/utility/eurorack'
import { PatchRoutingProvider } from '../../hooks/usePatchRouting.jsx'
import { ModuleRegistryProvider } from '../../hooks/useModuleRegistry.jsx'
import { CasePowerProvider } from '../../hooks/useCasePower.jsx'

function Panel({ hp = 20, u = 1, label, children }) {
  const aspectDiv = u === 1 ? 12 : 4
  return (
    <div style={{
      width: hp * HP_PX,
      aspectRatio: `${hp * aspectDiv} / ${TOTAL_HP}`,
      overflow: 'hidden',
    }}>
      <Module label={label} enabled={false} onToggle={() => {}} u={u}>
        {children}
      </Module>
    </div>
  )
}

function NoiseToolsDesign() {
  const nullRef = { current: null }
  return (
    <Panel hp={22} u={1} label="Noise">
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 16 }}>

        {/* Pulse Rate knob */}
        <Knob value={50} onChange={() => {}} label="pulse rate" />

        {/* Clock/Random + Noise outputs — bottom-aligned pair */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
              <FlipToggle value={false} onChange={() => {}} labelA="clk" labelB="rnd" />
              <div style={{ position: 'absolute', left: -10, bottom: 12, transform: 'translateY(-50%)' }}>
                <LED active={true} color="yellow" />
              </div>
            </div>
            <LabeledJack type="out" port="pink" moduleId="design" label="pink" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <LabeledJack type="out" port="pulse" moduleId="design" label="pls" />
            <LabeledJack type="out" port="white" moduleId="design" label="wht" />
          </div>
        </div>

        <Divider variant="vertical" />

        {/* S&H — bottom-aligned pair */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <LabeledJack type="in" port="trig" moduleId="design" label="trig" />
            <LabeledJack type="in" port="shIn" moduleId="design" label="in" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
              <FlipToggle value={false} onChange={() => {}} labelA="smp" labelB="trk" />
              <div style={{ position: 'absolute', right: -10, bottom: 12, transform: 'translateY(-50%)' }}>
                <LED active={false} color="white" />
              </div>
            </div>
            <LabeledJack type="out" port="hold" moduleId="design" label="hold" />
          </div>
        </div>

        <Divider variant="vertical" />

        {/* Slew in + out stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <LabeledJack type="in" port="slewIn" moduleId="design" label="in" />
          <LabeledJack type="out" port="slew" moduleId="design" label="slew" />
        </div>

        {/* Slew Time knob */}
        <Knob value={50} onChange={() => {}} label="slew time" />

      </div>
    </Panel>
  )
}

// Pure visual mockup — no module system, just divs matching the reference image
function NoiseToolsReference() {
  const jack = (label, dark) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {label && <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>}
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        backgroundColor: dark ? 'rgba(40,20,15,0.9)' : 'rgba(20,20,20,0.9)',
        border: '1.5px solid rgba(180,175,165,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
      </div>
    </div>
  )

  const bigJack = (label) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', padding: 3,
        backgroundColor: 'rgba(10,10,10,0.9)', border: '1.5px solid rgba(180,175,165,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
      </div>
      {label && <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>}
    </div>
  )

  const knob = (label) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        backgroundColor: 'rgba(30,30,30,0.9)', border: '1px solid rgba(180,175,165,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 2, height: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
      </div>
      <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )

  const led = (color) => (
    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color }} />
  )

  const toggle = (a, b) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{a}</span>
      <div style={{ width: 8, height: 16, borderRadius: 4, backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', position: 'relative' }}>
        <div style={{ width: 6, height: 8, borderRadius: 3, backgroundColor: 'rgba(180,175,165,0.6)', position: 'absolute', left: 0, top: 0 }} />
      </div>
      <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{b}</span>
    </div>
  )

  const divider = () => (
    <div style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
  )

  return (
    <div style={{
      width: 440, height: 100,
      backgroundColor: 'var(--kol-bg-surface-secondary, #1a1a1a)',
      borderRadius: 2,
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Pulse Rate knob */}
      {knob('pulse rate')}

      {/* Yellow LED + clk/rnd toggle above, pink output below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {led('#f1c40f')}
          {toggle('clk', 'rnd')}
        </div>
        {jack('pink', true)}
      </div>

      {/* Pulse output above, white output below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {jack('pulse', true)}
        {jack('white', true)}
      </div>

      {divider()}

      {/* Trig input above, in below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {jack('trig', false)}
        {jack('in', false)}
      </div>

      {/* LED + sample/track toggle above, hold output below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {led('rgba(255,255,255,0.3)')}
          {toggle('smp', 'trk')}
        </div>
        {jack('hold', true)}
      </div>

      {divider()}

      {/* In above, slew output below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {jack('in', false)}
        {jack('slew', true)}
      </div>

      {/* Slew Time knob */}
      {knob('slew time')}
    </div>
  )
}

function QuadrattDesign() {
  const nullRef = { current: null }

  const channel = (label) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
        <FlipToggle value={false} onChange={() => {}} labelA="uni" labelB="-/+" />
      </div>
      <Knob value={50} onChange={() => {}} label={label} />
    </div>
  )

  return (
    <Panel hp={26} u={1} label="Atten">
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 16 }}>

        {channel('a')}
        <Divider variant="vertical" />
        {channel('b')}
        <Divider variant="vertical" />
        {channel('c')}
        <Divider variant="vertical" />
        {channel('d')}

        <Divider variant="vertical" />

        {/* I/O grid */}
        <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(4, auto)', columnGap: 20, rowGap: 16 }}>
          {['a', 'b', 'c', 'd'].map(ch => (
            <div key={`in-${ch}`} style={{ position: 'relative' }}>
              <LabeledJack type="in" port={ch} moduleId="qatten" label={ch} labelPosition="top" />
              <Icon name="caret-down" size={8} style={{ color: 'rgba(255,255,255,0.25)', position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)' }} />
            </div>
          ))}
          {['a', 'b', 'c', 'd'].map((ch, i) => (
            <div key={`out-${ch}`} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <JackSocket type="out" port={ch} moduleId="qatten" />
              {i < 3 && <Icon name="caret-right" size={8} style={{ color: 'rgba(255,255,255,0.25)', position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)' }} />}
            </div>
          ))}
        </div>

      </div>
    </Panel>
  )
}

function SequencerStepsDesign() {
  const steps = [80, 45, 90, 20, 60, 35, 75, 10, 55, 30, 95, 15, 70, 40, 85, 25]
  const gates = [true, true, false, true, true, false, true, true, true, false, true, true, false, true, true, true]
  const activeStep = 3
  const show16 = false
  const visibleSteps = show16 ? steps : steps.slice(0, 8)
  const visibleGates = show16 ? gates : gates.slice(0, 8)

  const stepFader = (val, i) => {
    const norm = val / 100
    const isActive = i === activeStep
    const gateOn = visibleGates[i]
    return (
      <div key={i} style={{
        flex: 1, height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 2, flex: 1,
          backgroundColor: 'rgba(255,255,255,0.06)',
          position: 'relative',
          opacity: gateOn ? 1 : 0.3,
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${norm * 100}%`,
            backgroundColor: isActive ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: `calc(${norm * 100}% - 3px)`,
            left: -2,
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: isActive ? '#e74c3c' : 'rgba(255,255,255,0.5)',
          }} />
        </div>
        <FlipToggle value={gateOn} onChange={() => {}} />
        <LED active={isActive} size="sm" />
      </div>
    )
  }

  return (
    <Panel hp={16} u={3} label="Seq">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4, padding: '4px 0' }}>
        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.6)' }}>‹</span>
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.6)' }}>1-8</span>
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.6)' }}>›</span>
          <Knob value={8} onChange={() => {}} label="len" variant="row-right" />
          <Toggle value={show16} onChange={() => {}} label="16" size="sm" horizontal />
        </div>
        {/* Step faders */}
        <div style={{ display: 'flex', gap: 3, flex: 1, padding: '0 4px' }}>
          {visibleSteps.map((val, i) => stepFader(val, i))}
        </div>
        <Divider className="px-3 py-2" />
        {/* Jacks */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="clock" moduleId="seqd" label="clk" />
          <LabeledJack type="in" port="reset" moduleId="seqd" label="rst" />
          <LabeledJack type="out" port="out" moduleId="seqd" label="out" />
          <LabeledJack type="out" port="gate" moduleId="seqd" label="gte" />
        </div>
      </div>
    </Panel>
  )
}

function SequencerStepsV2() {
  const steps = [80, 45, 90, 20, 60, 35, 75, 10]
  const gates = [true, true, false, true, true, false, true, true]
  const activeStep = 3

  return (
    <Panel hp={16} u={3} label="Seq v2">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4, padding: '4px 0' }}>
        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          {/* Page buttons */}
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4].map(p => (
              <button key={p} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, padding: 0,
                borderRadius: 3,
                border: p === 1 ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: p === 1 ? 'rgba(231,76,60,0.15)' : 'transparent',
                color: p === 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}>
                <span className="kol-helper-xxxxs">{p}</span>
              </button>
            ))}
          </div>
          <CvKnob port="lenCV" moduleId="seqv2" active={false} signalRef={{ current: null }} value={8} onChange={() => {}} label="len" variant="row-right" />
        </div>
        <Divider className="px-1 pt-2" />
        {/* Step faders — v3 style with spanning lines */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
          {/* Groove area — lines + faders */}
          <div style={{ flex: 1, padding: '8px 0' }}>
            <div style={{ height: '100%', position: 'relative', padding: '0 4px' }}>
              {/* Lines spanning full width */}
              {Array.from({ length: 10 }).map((_, t) => (
                <div key={t} style={{
                  position: 'absolute',
                  bottom: `${((t + 1) / 11) * 100}%`,
                  left: 4, right: 4, height: 1,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }} />
              ))}
              {/* Grooves + thumbs */}
              <div style={{ position: 'relative', display: 'flex', height: '100%', justifyContent: 'space-evenly', zIndex: 1 }}>
              {steps.map((val, i) => {
                const norm = val / 100
                const isActive = i === activeStep
                const gateOn = gates[i]
                return (
                  <div key={i} style={{ width: 8, height: '100%', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                      backgroundColor: '#0a0a0a', borderRadius: 4,
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)', zIndex: 1,
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: `calc(${norm * 100}% - 8px)`,
                      left: -1, right: -1,
                      height: 16, borderRadius: 1,
                      backgroundColor: isActive ? '#e74c3c' : 'rgba(180,175,165,0.7)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)', zIndex: 2,
                      opacity: gateOn ? 1 : 0.3,
                    }} />
                  </div>
                )
              })}
              </div>
            </div>
          </div>
          {/* Toggles + LEDs row */}
          <div style={{ display: 'flex', justifyContent: 'space-evenly', padding: '0 4px' }}>
            {steps.map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <FlipToggle value={gates[i] ? 0 : 1} onChange={() => {}} positions={3} />
                <LED active={i === activeStep} size="sm" />
              </div>
            ))}
          </div>
        </div>
        <Divider className="px-1 py-2" />
        {/* Jacks */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="clock" moduleId="seqv2" label="clk" />
          <LabeledJack type="in" port="reset" moduleId="seqv2" label="rst" />
          <LabeledJack type="out" port="out" moduleId="seqv2" label="out" />
          <LabeledJack type="out" port="gate" moduleId="seqv2" label="gte" />
        </div>
      </div>
    </Panel>
  )
}

// Quad VCA — wireframe reference from Claude Design (a_torg/Quad VCA Wireframe.html).
// Pure visual mockup, non-functional. Uses the HTML div structure verbatim so we can
// iterate on layout before porting to live components.
function QuadVCAReference() {
  const CV_COL = '#6ea8ff'
  const SIG_COL = '#e06b5a'
  const OK_COL = '#7bcf8a'
  const PANEL = '#1a1d22'
  const LINE = '#3a3f47'
  const LINE_STRONG = '#5a616b'
  const INK = '#e7e9ec'
  const MUTED = '#8a8f98'

  const jackStyle = {
    width: 26, height: 26, borderRadius: '50%',
    border: `1.5px solid ${LINE_STRONG}`,
    background: 'radial-gradient(circle, #0b0c0f 40%, #1a1d22 41%)',
    position: 'relative',
  }
  const jackHoleStyle = {
    content: '""', position: 'absolute', inset: 7, borderRadius: '50%',
    background: '#000', border: '1px solid #2a2e35',
  }
  const Jack = () => (
    <div style={jackStyle}>
      <div style={jackHoleStyle} />
    </div>
  )
  const Led = ({ on }) => (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: on ? OK_COL : '#2a2e35',
      border: '1px solid #111',
      boxShadow: on ? `0 0 4px ${OK_COL}` : 'none',
    }} />
  )
  const SmallKnob = () => (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #2a2e35 0%, #0d0f12 70%)',
      border: `1.5px solid ${LINE_STRONG}`,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: '50%', top: 3, width: 1.5, height: 8,
        background: INK, transform: 'translateX(-50%)',
      }} />
    </div>
  )
  const TinyKnob = () => (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #2a2e35 0%, #0d0f12 70%)',
      border: `1.5px solid ${LINE_STRONG}`,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: '50%', top: 2, width: 1.5, height: 7,
        background: INK, transform: 'translateX(-50%)',
      }} />
    </div>
  )
  const BigKnob = () => (
    <div style={{
      width: 54, height: 54, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #f1f3f5 0%, #c7ccd3 55%, #8a8f98 100%)',
      border: '2px solid rgba(0,0,0,0.5)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: '50%', top: 4, width: 2, height: 14,
        background: '#111', transform: 'translateX(-50%)',
      }} />
    </div>
  )
  const BoostSwitch = () => (
    <div style={{
      width: 10, height: 18, display: 'inline-flex', flexDirection: 'column',
      alignItems: 'center', position: 'relative',
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: 2,
        background: 'linear-gradient(#7a2a24, #4a1814)',
        border: '1px solid #2a0e0b',
        position: 'absolute', top: 4,
      }} />
      <span style={{
        width: 2, height: 8, background: '#d0d4da', borderRadius: 1,
        position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.5)',
      }} />
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: '#e7e9ec',
        border: '1px solid rgba(0,0,0,0.4)',
        position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
      }} />
    </div>
  )
  const CurveChip = ({ kind }) => (
    <span style={{
      width: 16, height: 16, border: `1px solid ${SIG_COL}`, borderRadius: 2,
      display: 'grid', placeItems: 'center', background: '#1a0f0d',
    }}>
      <svg width="11" height="11" viewBox="0 0 12 12">
        {kind === 'log' ? (
          <path d="M1 11 C 2 4, 6 1, 11 1" stroke={SIG_COL} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M1 11 C 6 11, 10 8, 11 1" stroke={SIG_COL} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </span>
  )
  const labelMini = {
    fontSize: 9, color: MUTED, letterSpacing: '0.15em',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  }

  const Channel = ({ idx, ledOn }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px 30px 8px 36px 1fr 64px',
      gridTemplateAreas: '"cvtag jack led cvknob mid level"',
      gap: 6,
      alignItems: 'center',
      padding: '14px 4px 10px',
      border: `1px dashed ${LINE}`,
      borderRadius: 4,
      position: 'relative',
    }}>
      {/* dashed signal path */}
      <div style={{
        position: 'absolute', left: 28, right: 84, top: '50%', height: 1,
        background: `repeating-linear-gradient(to right, ${LINE_STRONG} 0 4px, transparent 4px 8px)`,
        zIndex: 0,
      }} />
      <span style={{
        position: 'absolute', top: -7, left: 8, background: PANEL,
        padding: '0 6px', fontSize: 9, color: MUTED, letterSpacing: '0.2em',
      }}>CHANNEL</span>
      <span style={{
        position: 'absolute', top: -7, right: 8, background: PANEL,
        padding: '0 6px', fontSize: 9, color: MUTED, letterSpacing: '0.2em',
      }}>{String(idx).padStart(2, '0')}</span>

      <div style={{
        gridArea: 'cvtag', fontSize: 9, color: CV_COL,
        letterSpacing: '0.15em', fontWeight: 700, textAlign: 'center',
        padding: '2px 0', background: '#1f2636', border: '1px solid #2f3a54',
        borderRadius: 2, zIndex: 1,
      }}>CV</div>
      <div style={{ gridArea: 'jack', display: 'flex', justifyContent: 'center', zIndex: 1 }}>
        <Jack />
      </div>
      <div style={{ gridArea: 'led', display: 'flex', justifyContent: 'center', zIndex: 1 }}>
        <Led on={ledOn} />
      </div>
      <div style={{ gridArea: 'cvknob', display: 'flex', justifyContent: 'center', zIndex: 1 }}>
        <SmallKnob />
      </div>
      <div style={{
        gridArea: 'mid', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, padding: '0 4px', zIndex: 1,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={labelMini}>BOOST</span>
          <BoostSwitch />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CurveChip kind="log" />
          <TinyKnob />
          <CurveChip kind="exp" />
        </div>
      </div>
      <div style={{
        gridArea: 'level', display: 'flex', alignItems: 'center',
        gap: 6, zIndex: 1,
      }}>
        <BigKnob />
        <span style={{ ...labelMini, color: INK, fontWeight: 700, whiteSpace: 'nowrap' }}>LEVEL {idx}</span>
      </div>
    </div>
  )

  return (
    <div style={{
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 13, color: INK,
    }}>
      <div style={{
        background: PANEL, border: `1px solid ${LINE}`, borderRadius: 6,
        padding: '14px 14px 18px', position: 'relative', width: 380,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)',
      }}>
        {/* rack screw stubs */}
        <div style={{
          content: '""', position: 'absolute', left: 0, right: 0, top: -1, height: 10,
          background: `radial-gradient(circle at 12px 50%, #000 2.5px, transparent 3px), radial-gradient(circle at calc(100% - 12px) 50%, #000 2.5px, transparent 3px)`,
        }} />
        <div style={{
          content: '""', position: 'absolute', left: 0, right: 0, bottom: -1, height: 10,
          background: `radial-gradient(circle at 12px 50%, #000 2.5px, transparent 3px), radial-gradient(circle at calc(100% - 12px) 50%, #000 2.5px, transparent 3px)`,
        }} />

        {/* header */}
        <div style={{
          textAlign: 'center', padding: '6px 0 14px',
          borderBottom: `1px dashed ${LINE}`, marginBottom: 12,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.18em' }}>QUAD VCA</div>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.2em', marginTop: 3 }}>
            4 × LEVEL · CV · BOOST · LIN/EXP
          </div>
        </div>

        {/* channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Channel idx={1} ledOn />
          <Channel idx={2} ledOn={false} />
          <Channel idx={3} ledOn />
          <Channel idx={4} ledOn={false} />
        </div>

        {/* footer: IN row + OUT row */}
        <div style={{
          marginTop: 14, borderTop: `1px dashed ${LINE}`,
          paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={`in${n}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Jack />
                <span style={labelMini}>IN {n}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={`out${n}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: '#0d0f12', border: `1px solid ${LINE}`,
                borderRadius: 4, padding: '6px 0',
              }}>
                <Jack />
                <span style={labelMini}>{n === 4 ? 'SUM' : `OUT ${n}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 3U templated QVCA — same wireframe div structure as QuadVCAReference but using:
//  - our <Module> chrome + header
//  - our <LabeledJack>/<JackSocket> for all jacks
//  - our <Knob> for CV attenuverter, response curve, level
//  - our <FlipToggle> (horizontal) for boost, with vertical "BOOST" label stack
//  - our <IconButton> with curve-log / curve-exp icons flanking the response knob
//  - the ABCD in/out matrix layout from AttenuatorModule instead of the two
//    stacked jack rows from the Claude Design wireframe.
// Non-functional mockup — pass no-op handlers + null refs.
function QVCAChannel({ idx, id, ledOn }) {
  const nullRef = { current: null }
  const DashedSpacer = () => (
    <div style={{
      flex: 1, height: 1,
      background: 'repeating-linear-gradient(to right, rgba(255,255,255,0.20) 0 2px, transparent 2px 5px)',
    }} />
  )
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: 6, padding: '8px 6px',
      borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none',
    }}>
      {/* Left cluster: CV jack (sm) · LED · CV knob */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <LabeledJack type="in" port={`cv${idx}`} moduleId={id} active={false} signalRef={nullRef} size="sm" />
        <LED active={ledOn} color="green" size="sm" />
        <Knob value={0} onChange={() => {}} bipolar size="sm" />
      </div>

      {/* dashed flex-1 segment */}
      <DashedSpacer />

      {/* Middle column: BOOST stacked above response row */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LED active={false} color="red" size="sm" />
          <FlipToggle value={false} onChange={() => {}} variant="horizontal" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="curve-log" size={8} style={{ color: 'var(--kol-color-brand-red)' }} />
          <Knob value={50} onChange={() => {}} size="sm" />
          <Icon name="curve-exp" size={8} style={{ color: 'var(--kol-color-brand-red)' }} />
        </div>
      </div>

      {/* dashed flex-1 segment */}
      <DashedSpacer />

      {/* Right: LEVEL big knob with channel label below */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Knob value={100} onChange={() => {}} size="lg" />
        <span className="kol-helper-xxxs" style={{
          color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1,
        }}>{`channel ${idx}`}</span>
      </div>
    </div>
  )
}

function QuadVCATemplated() {
  const id = 'qvca-design'
  const nullRef = { current: null }

  return (
    <Panel hp={16} u={3} label="QVCA">
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', gap: 4,
      }}>
        {/* 4 channels, factored component */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <QVCAChannel idx={1} id={id} ledOn />
          <QVCAChannel idx={2} id={id} ledOn={false} />
          <QVCAChannel idx={3} id={id} ledOn />
          <QVCAChannel idx={4} id={id} ledOn={false} />
        </div>

        <Divider className="px-2" />

        {/* ABCD-style matrix — identical to AttenuatorModule layout */}
        <div style={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(4, auto)',
          columnGap: 20, rowGap: 16,
          justifyContent: 'center',
          padding: '6px 0',
        }}>
          {[1, 2, 3, 4].map(n => (
            <div key={`in${n}`} style={{ position: 'relative' }}>
              <LabeledJack type="in" port={`in${n}`} moduleId={id} active={false} signalRef={nullRef} label={`${n}`} labelPosition="top" />
              <Icon name="caret-down" size={8} style={{
                color: 'rgba(255,255,255,0.25)',
                position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
              }} />
            </div>
          ))}
          {[1, 2, 3, 4].map((n, i) => (
            <div key={`out${n}`} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <JackSocket type="out" port={`out${n}`} moduleId={id} signalRef={nullRef} />
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
    </Panel>
  )
}

export default function ModuleDesign() {
  return (
    <ModuleRegistryProvider>
      <PatchRoutingProvider>
        <CasePowerProvider>
          <div className="min-h-screen bg-surface-primary p-8">
            <h1 className="kol-helper-xs text-fg-48 uppercase mb-8">Module Design</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

              {/* Quad VCA — wireframe reference beside our 3U templated version */}
              <div>
                <span className="kol-helper-xs text-fg-32 uppercase">Quad VCA — wireframe (Claude Design) vs our 3U template</span>
                <div className="mt-4" style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <span className="kol-helper-xxs text-fg-32 uppercase" style={{ display: 'block', marginBottom: 8 }}>Wireframe</span>
                    <QuadVCAReference />
                  </div>
                  <div>
                    <span className="kol-helper-xxs text-fg-32 uppercase" style={{ display: 'block', marginBottom: 8 }}>Our template (3U × 16HP)</span>
                    <QuadVCATemplated />
                  </div>
                </div>
              </div>

              {/* Reference mockup — pure visual */}
              <div>
                <span className="kol-helper-xs text-fg-32 uppercase">Reference — Noise Tools (Intellijel style)</span>
                <div className="mt-4">
                  <NoiseToolsReference />
                </div>
              </div>

              {/* System mockup — using actual components */}
              <div>
                <span className="kol-helper-xs text-fg-32 uppercase">System — Noise Tools 20HP 1U</span>
                <div className="mt-4">
                  <NoiseToolsDesign />
                </div>
              </div>

              {/* Quadratt / Attenuator */}
              <div>
                <span className="kol-helper-xs text-fg-32 uppercase">System — Quadratt (Attenuverter) 22HP 1U</span>
                <div className="mt-4">
                  <QuadrattDesign />
                </div>
              </div>

              {/* I/O grid test */}
              <div>
                <span className="kol-helper-xs text-fg-32 uppercase">I/O Grid</span>
                <div className="mt-4" style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(4, auto)', columnGap: 20, rowGap: 16 }}>
                  {/* Row 1: inputs with down arrows */}
                  {['a', 'b', 'c', 'd'].map(ch => (
                    <div key={`in-${ch}`} style={{ position: 'relative' }}>
                      <LabeledJack type="in" port={ch} moduleId="test" label={ch} labelPosition="top" />
                      <Icon name="caret-down" size={8} style={{ color: 'rgba(255,255,255,0.25)', position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)' }} />
                    </div>
                  ))}
                  {/* Row 2: outputs with right arrows between */}
                  {['a', 'b', 'c', 'd'].map((ch, i) => (
                    <div key={`out-${ch}`} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <JackSocket type="out" port={ch} moduleId="test" />
                      {i < 3 && <Icon name="caret-right" size={8} style={{ color: 'rgba(255,255,255,0.25)', position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)' }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sequencer step faders — v1 + v2 side by side */}
              <div style={{ display: 'flex', gap: 48 }}>
                <div>
                  <span className="kol-helper-xs text-fg-32 uppercase">System — Sequencer v1</span>
                  <div className="mt-4">
                    <SequencerStepsDesign />
                  </div>
                </div>
                <div>
                  <span className="kol-helper-xs text-fg-32 uppercase">System — Sequencer v2</span>
                  <div className="mt-4">
                    <SequencerStepsV2 />
                  </div>
                </div>
              </div>

              {/* StepSlider v1 + v2 side by side */}
              <div style={{ display: 'flex', gap: 48 }}>
                <div>
                  <span className="kol-helper-xs text-fg-32 uppercase">Component — StepSlider v1</span>
                  <div className="mt-4" style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
                    {[80, 45, 20, 60].map((val, i) => {
                      const ticks = 10
                      const norm = val / 100
                      return (
                        <div key={i} style={{ height: 160 }}>
                          <div style={{
                            width: 20, height: '100%', position: 'relative',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.06)',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                          }}>
                            {Array.from({ length: ticks + 1 }).map((_, t) => (
                              <div key={t} style={{
                                position: 'absolute',
                                bottom: `${(t / ticks) * 100}%`,
                                left: 2, right: 2, height: 1,
                                backgroundColor: 'rgba(255,255,255,0.25)',
                              }} />
                            ))}
                            <div style={{
                              position: 'absolute',
                              bottom: `calc(${norm * 100}% - 5px)`,
                              left: 1, right: 1,
                              height: 10, borderRadius: 2,
                              backgroundColor: 'rgba(180,175,165,0.6)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <span className="kol-helper-xs text-fg-32 uppercase">Component — StepSlider v2</span>
                  <div className="mt-4" style={{ height: 160, position: 'relative', width: 200 }}>
                    {Array.from({ length: 11 }).map((_, t) => (
                      <div key={t} style={{
                        position: 'absolute',
                        bottom: `${(t / 10) * 100}%`,
                        left: 0, right: 0, height: 1,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                      }} />
                    ))}
                    <div style={{ position: 'relative', display: 'flex', height: '100%', justifyContent: 'space-around', zIndex: 1 }}>
                      {[80, 45, 20, 60, 90, 30, 55, 70].map((val, i) => {
                        const norm = val / 100
                        return (
                          <div key={i} style={{ width: 20, height: '100%', position: 'relative' }}>
                            <div style={{
                              position: 'absolute',
                              left: '50%', transform: 'translateX(-50%)',
                              top: 0, bottom: 0, width: 4,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              borderRadius: 1,
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: `calc(${norm * 100}% - 5px)`,
                              left: 2, right: 2,
                              height: 10, borderRadius: 2,
                              backgroundColor: 'rgba(180,175,165,0.6)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                            }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="kol-helper-xs text-fg-32 uppercase">Component — StepSlider v3</span>
                  <div className="mt-4" style={{ height: 180, position: 'relative', width: 280, padding: '16px 0' }}>
                    {Array.from({ length: 9 }).map((_, t) => (
                      <div key={t} style={{
                        position: 'absolute',
                        bottom: `calc(16px + ${((t + 1) / 10) * (180 - 32)}px)`,
                        left: 0, right: 0, height: 1,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      }} />
                    ))}
                    <div style={{ position: 'relative', display: 'flex', height: '100%', justifyContent: 'space-evenly', zIndex: 1 }}>
                      {[80, 45, 20, 60, 90, 30, 55, 70].map((val, i) => {
                        const norm = val / 100
                        return (
                          <div key={i} style={{ width: 8, height: '100%', position: 'relative' }}>
                            <div style={{
                              position: 'absolute',
                              left: 0, right: 0,
                              top: 0, bottom: 0,
                              backgroundColor: '#0a0a0a',
                              borderRadius: 2,
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                              zIndex: 1,
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: `calc(${norm * 100}% - 4px)`,
                              left: -1, right: -1,
                              height: 8, borderRadius: 1,
                              backgroundColor: 'rgba(180,175,165,0.7)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              zIndex: 2,
                            }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </CasePowerProvider>
      </PatchRoutingProvider>
    </ModuleRegistryProvider>
  )
}
