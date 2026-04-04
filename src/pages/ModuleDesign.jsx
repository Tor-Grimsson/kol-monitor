// ModuleDesign — visual mockup page for module panel layouts
// Access at /design

import Module from '../modules/utility/Module'
import JackSocket from '../modules/utility/JackSocket'
import LabeledJack from '../modules/controls/LabeledJack'
import Knob from '../modules/controls/Knob'
import FlipToggle from '../modules/controls/FlipToggle'
import LED from '../modules/controls/LED'
import Divider from '../components/atoms/Divider'
import Icon from '../components/icons/Icon'
import { HP_PX, TOTAL_HP, ASPECT } from '../modules/utility/eurorack'
import { PatchRoutingProvider } from '../hooks/usePatchRouting.jsx'
import { ModuleRegistryProvider } from '../hooks/useModuleRegistry.jsx'
import { CasePowerProvider } from '../hooks/useCasePower.jsx'

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

export default function ModuleDesign() {
  return (
    <ModuleRegistryProvider>
      <PatchRoutingProvider>
        <CasePowerProvider>
          <div className="min-h-screen bg-surface-primary p-8">
            <h1 className="kol-helper-xs text-fg-48 uppercase mb-8">Module Design</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

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

            </div>
          </div>
        </CasePowerProvider>
      </PatchRoutingProvider>
    </ModuleRegistryProvider>
  )
}
