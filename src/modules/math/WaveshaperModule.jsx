// WaveshaperModule — signal curve shaper
// 6HP 3U. Shape selector, amount + symmetry knobs with CV.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, color, points, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import IconSelect from '../controls/IconSelect'
import Toggle from '../controls/Toggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const MODES = ['exp', 'log', 'scurve', 'clip', 'fold', 'wrap', 'step', 'sine']

function makeShaper(mode, sym) {
  const s = sym * 2
  const pow_exp = s + 0.5
  const pow_log = 1 / (s + 0.5)
  const k = 1 + s * 4
  const scale = 1 + s
  const steps = Math.max(2, Math.round(2 + s * 8))
  const invSteps = 1 / steps
  const sinScale = Math.PI * (0.5 + s)

  switch (mode) {
    case 'exp': return (x) => Math.pow(x, pow_exp)
    case 'log': return (x) => Math.pow(x, pow_log)
    case 'scurve': return (x) => 1 / (1 + Math.exp(-k * (x - 0.5)))
    case 'clip': return (x) => { const v = x * scale; return v < 0 ? 0 : v > 1 ? 1 : v }
    case 'fold': return (x) => {
      let v = x * scale
      for (let i = 0; i < 4; i++) {
        if (v > 1) v = 2 - v
        else if (v < 0) v = -v
        else break
      }
      return v
    }
    case 'wrap': return (x) => ((x * scale) % 1 + 1) % 1
    case 'step': return (x) => Math.round(x * steps) * invSteps
    case 'sine': return (x) => (Math.sin((x - 0.5) * sinScale) + 1) / 2
    default: return (x) => x
  }
}

function WaveshaperPanel({ mode, amount, symmetry, smooth, smoothFold, enabled, onToggle, onModeChange, onAmountChange, onSymmetryChange, onSmoothChange, onSmoothFoldChange, id, inConnected, inRef, amtCvConn, amtCvRef, symCvConn, symCvRef, smCvConn, smCvRef, outRef }) {
  return (
    <Module label="Shaper" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <IconSelect value={mode} onChange={onModeChange} columns={2} items={[
          { value: 'exp', icon: 'shaper-exp' }, { value: 'log', icon: 'shaper-log' },
          { value: 'scurve', icon: 'shaper-scurve', label: 's-curve' }, { value: 'clip', icon: 'shaper-clip' },
          { value: 'fold', icon: 'shaper-fold' }, { value: 'wrap', icon: 'shaper-wrap' },
          { value: 'step', icon: 'shaper-step' }, { value: 'sine', icon: 'shaper-sine' },
        ]} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <JackSocket type="in" port="amtCV" moduleId={id} active={amtCvConn} signalRef={amtCvRef} size="sm" />
          <Knob value={amount} onChange={onAmountChange} label="amt" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <JackSocket type="in" port="symCV" moduleId={id} active={symCvConn} signalRef={symCvRef} size="sm" />
          <Knob value={symmetry} onChange={onSymmetryChange} label="sym" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <JackSocket type="in" port="smCV" moduleId={id} active={smCvConn} signalRef={smCvRef} size="sm" />
          <Knob value={smooth} onChange={onSmoothChange} label="smo" />
          <Toggle horizontal value={smoothFold} onChange={onSmoothFoldChange} label="hm" size="sm" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

const NULL_REF = { current: null }

export default function WaveshaperModule({ id = 'wshp1', init, preview }) {
  if (preview) return <WaveshaperPanel mode="exp" amount={50} symmetry={50} smooth={0} smoothFold={false} enabled={false} onToggle={() => {}} onModeChange={() => {}} onAmountChange={() => {}} onSymmetryChange={() => {}} onSmoothChange={() => {}} onSmoothFoldChange={() => {}} id={id} inConnected={false} inRef={NULL_REF} amtCvConn={false} amtCvRef={NULL_REF} symCvConn={false} symCvRef={NULL_REF} smCvConn={false} smCvRef={NULL_REF} outRef={NULL_REF} />

  const [mode, setMode] = useState(init?.mode ?? 'exp')
  const [amount, setAmount] = useState(init?.amount ?? 50)
  const [symmetry, setSymmetry] = useState(init?.symmetry ?? 50)
  const [smooth, setSmooth] = useState(init?.smooth ?? 0)
  const [smoothFold, setSmoothFold] = useState(init?.smoothFold ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const modeRef = useRef('exp')
  const amountRef = useRef(50)
  const symmetryRef = useRef(50)
  const smoothRef = useRef(0)
  const smoothFoldRef = useRef(false)
  const enabledRef = useRef(true)
  const outRef = useRef(null)
  const inRef = useRef(null)
  const amtCvRef = useRef(null)
  const symCvRef = useRef(null)
  const smCvRef = useRef(null)

  modeRef.current = mode
  amountRef.current = amount
  symmetryRef.current = symmetry
  smoothRef.current = smooth
  smoothFoldRef.current = smoothFold
  enabledRef.current = enabled

  const inConnected = cp.has('in')
  const amtCvConn = cp.has('amtCV')
  const symCvConn = cp.has('symCV')
  const smCvConn = cp.has('smCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { mode, amount, symmetry, smooth, smoothFold }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { in: { type: 'any' }, amtCV: { type: 'scalar', cv: 'attenuate' }, symCV: { type: 'scalar', cv: 'offset' }, smCV: { type: 'scalar', cv: 'attenuate' } },
    outputs: { out: { type: 'any' } },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      amtCvRef.current = inputs.amtCV
      symCvRef.current = inputs.symCV
      smCvRef.current = inputs.smCV

      const input = inputs.in
      if (!input) { outRef.current = null; return { out: null } }

      const amt = readCv(inputs.amtCV, amountRef.current, 'attenuate') / 100
      const sym = readCv(inputs.symCV, symmetryRef.current) / 100
      const smo = readCv(inputs.smCV, smoothRef.current, 'attenuate') / 100
      const shaper = makeShaper(modeRef.current, sym)
      const fold = smoothFoldRef.current

      const mix = (v) => {
        const shaped = v * (1 - amt) + shaper(v) * amt
        if (smo === 0) return shaped
        if (fold) {
          // Harmonic fold: multiply deviation from center, fold back on overflow
          const dev = (shaped - 0.5) * (1 + smo * 4)
          let f = dev
          for (let i = 0; i < 4; i++) {
            if (f > 0.5) f = 1 - f
            else if (f < -0.5) f = -1 - f
            else break
          }
          return 0.5 + f
        }
        // Compress: pull toward center
        return 0.5 + (shaped - 0.5) * (1 - smo)
      }

      // Points: shape each point's y value
      if (input.type === 'points') {
        const shaped = input.value.map(pt => ({ ...pt, y: mix(pt.y) }))
        const out = points(shaped, input.edges)
        outRef.current = out
        return { out }
      }

      // Color: shape each channel
      if (input.type === 'color') {
        const c = input.value
        const out = color(mix(c.r), mix(c.g), mix(c.b), c.a)
        outRef.current = out
        return { out }
      }

      // Scalar: map signed [-100, 100] to [0, 1] for the shaper, then back
      if (input.type === 'scalar') {
        const normalized = (input.value + 100) / 200
        const shaped = mix(normalized)
        const out = scalar(shaped * 200 - 100)
        outRef.current = out
        return { out }
      }

      // Fallback
      outRef.current = input
      return { out: input }
    },
  })

  return <WaveshaperPanel mode={mode} amount={amount} symmetry={symmetry} smooth={smooth} smoothFold={smoothFold} enabled={enabled} onToggle={() => setEnabled(!enabled)} onModeChange={setMode} onAmountChange={setAmount} onSymmetryChange={setSymmetry} onSmoothChange={setSmooth} onSmoothFoldChange={setSmoothFold} id={id} inConnected={inConnected} inRef={inRef} amtCvConn={amtCvConn} amtCvRef={amtCvRef} symCvConn={symCvConn} symCvRef={symCvRef} smCvConn={smCvConn} smCvRef={smCvRef} outRef={outRef} />
}
