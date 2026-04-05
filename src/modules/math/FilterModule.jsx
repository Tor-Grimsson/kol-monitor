// FilterModule — video signal filter (LP/HP/BP/Notch)
// 6HP 3U. Cutoff + resonance with CV, type selector.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, color, points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import IconSelect from '../controls/IconSelect'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

const FILTER_ITEMS = [
  { value: 'lp', icon: 'filter-lp', label: 'low-pass' },
  { value: 'hp', icon: 'filter-hp', label: 'high-pass' },
  { value: 'bp', icon: 'filter-bp', label: 'band-pass' },
  { value: 'notch', icon: 'filter-notch' },
]

function FilterPanel({ mode, cutoff, resonance, enabled, onToggle, onModeChange, onCutoffChange, onResonanceChange, id, inConn, inRef, cutCvConn, cutCvRef, resCvConn, resCvRef, outRef }) {
  return (
    <Module label="Filter" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <IconSelect value={mode} onChange={onModeChange} columns={2} items={FILTER_ITEMS} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <JackSocket type="in" port="cutCV" moduleId={id} active={cutCvConn} signalRef={cutCvRef} size="sm" />
          <Knob value={cutoff} onChange={onCutoffChange} label="cut" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <JackSocket type="in" port="resCV" moduleId={id} active={resCvConn} signalRef={resCvRef} size="sm" />
          <Knob value={resonance} onChange={onResonanceChange} label="res" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }

export default function FilterModule({ id = 'filt1', preview }) {
  if (preview) return <FilterPanel mode="lp" cutoff={50} resonance={0} enabled={false} onToggle={() => {}} onModeChange={() => {}} onCutoffChange={() => {}} onResonanceChange={() => {}} id={id} inConn={false} inRef={NULL_REF} cutCvConn={false} cutCvRef={NULL_REF} resCvConn={false} resCvRef={NULL_REF} outRef={NULL_REF} />

  const [mode, setMode] = useState('lp')
  const [cutoff, setCutoff] = useState(50)
  const [resonance, setResonance] = useState(0)
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()

  const modeRef = useRef('lp')
  const cutoffRef = useRef(50)
  const resonanceRef = useRef(0)
  const enabledRef = useRef(true)
  const inRef = useRef(null)
  const cutCvRef = useRef(null)
  const resCvRef = useRef(null)
  const outRef = useRef(null)

  // Filter state — SVF (state variable filter) for LP/HP/BP/Notch
  const lpRef = useRef(0)
  const bpRef = useRef(0)

  // For points: per-point Y filter state
  const ptLpRef = useRef(new Float32Array(256))
  const ptBpRef = useRef(new Float32Array(256))

  // For color: per-channel filter state
  const clrLpRef = useRef({ r: 0, g: 0, b: 0 })
  const clrBpRef = useRef({ r: 0, g: 0, b: 0 })

  modeRef.current = mode
  cutoffRef.current = cutoff
  resonanceRef.current = resonance
  enabledRef.current = enabled

  const conns = routing?.connections || []
  const inConn = conns.some(c => c.toModuleId === id && c.toPort === 'in')
  const cutCvConn = conns.some(c => c.toModuleId === id && c.toPort === 'cutCV')
  const resCvConn = conns.some(c => c.toModuleId === id && c.toPort === 'resCV')

  useModule({
    id,
    inputs: { in: { type: 'any' }, cutCV: { type: 'scalar' }, resCV: { type: 'scalar' } },
    outputs: { out: { type: 'any' } },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      cutCvRef.current = inputs.cutCV
      resCvRef.current = inputs.resCV

      const input = inputs.in
      if (!input) { outRef.current = null; return { out: null } }

      const cut = (inputs.cutCV ? readScalar(inputs.cutCV) : cutoffRef.current) / 100
      const res = (inputs.resCV ? readScalar(inputs.resCV) : resonanceRef.current) / 100
      const f = Math.max(0.001, cut * 0.5) // frequency coefficient
      const q = 1 - res * 0.95 // damping (lower = more resonance)
      const m = modeRef.current

      // SVF step function
      const svf = (input, lp, bp) => {
        const hp = input - lp - q * bp
        const newBp = bp + f * hp
        const newLp = lp + f * newBp
        const notch = hp + lp
        return { lp: newLp, bp: newBp, hp, notch }
      }

      const pick = (s) => {
        switch (m) {
          case 'lp': return s.lp
          case 'hp': return s.hp
          case 'bp': return s.bp
          case 'notch': return s.notch
          default: return s.lp
        }
      }

      // Scalar
      if (input.type === 'scalar') {
        const v = input.value / 100
        const s = svf(v, lpRef.current, bpRef.current)
        lpRef.current = s.lp
        bpRef.current = s.bp
        const out = scalar(Math.max(0, Math.min(100, pick(s) * 100)))
        outRef.current = out
        return { out }
      }

      // Color: filter each channel independently
      if (input.type === 'color') {
        const c = input.value
        const clp = clrLpRef.current
        const cbp = clrBpRef.current
        const sr = svf(c.r, clp.r, cbp.r)
        const sg = svf(c.g, clp.g, cbp.g)
        const sb = svf(c.b, clp.b, cbp.b)
        clrLpRef.current = { r: sr.lp, g: sg.lp, b: sb.lp }
        clrBpRef.current = { r: sr.bp, g: sg.bp, b: sb.bp }
        const out = color(
          Math.max(0, Math.min(1, pick(sr))),
          Math.max(0, Math.min(1, pick(sg))),
          Math.max(0, Math.min(1, pick(sb))),
          c.a
        )
        outRef.current = out
        return { out }
      }

      // Points: filter each point's Y value
      if (input.type === 'points') {
        const plp = ptLpRef.current
        const pbp = ptBpRef.current
        const filtered = input.value.map((pt, i) => {
          if (i >= plp.length) return pt
          const s = svf(pt.y, plp[i], pbp[i])
          plp[i] = s.lp
          pbp[i] = s.bp
          return { ...pt, y: pick(s) }
        })
        const out = points(filtered, input.edges)
        outRef.current = out
        return { out }
      }

      // Fallback
      outRef.current = input
      return { out: input }
    },
  })

  return <FilterPanel mode={mode} cutoff={cutoff} resonance={resonance} enabled={enabled} onToggle={() => setEnabled(!enabled)} onModeChange={setMode} onCutoffChange={setCutoff} onResonanceChange={setResonance} id={id} inConn={inConn} inRef={inRef} cutCvConn={cutCvConn} cutCvRef={cutCvRef} resCvConn={resCvConn} resCvRef={resCvRef} outRef={outRef} />
}
