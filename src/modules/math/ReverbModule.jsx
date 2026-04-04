// ReverbModule — multi-tap delay reverb
// 6HP

import { useState, useRef } from 'react'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, color, points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import ModuleLayout, { ModuleControls, ModuleRow, ModuleJacks } from '../utility/ModuleLayout'
import Divider from '../../components/atoms/Divider'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

const TAP_PRIMES = [7, 13, 23, 37, 53, 71, 97, 113, 137, 157, 179, 199]

function ReverbPanel({ size, decay, mix, freeze, bypass, bypassFx, enabled, onToggle, onSizeChange, onDecayChange, onMixChange, onFreezeChange, onBypassChange, onBypassFxChange, id, sizeCvConn, sizeCvRef, decayCvConn, decayCvRef, inConnected, inRef, outRef }) {
  return (
    <Module label="Reverb" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Left: CV + knobs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <ModuleRow>
              <Knob value={mix} onChange={onMixChange} label="mix" variant="row-right" />
            </ModuleRow>
            <ModuleRow>
              <JackSocket type="in" port="sizeCV" moduleId={id} active={sizeCvConn} signalRef={sizeCvRef} size="sm" />
              <Knob value={size} onChange={onSizeChange} label="size" variant="row-right" />
            </ModuleRow>
            <ModuleRow>
              <JackSocket type="in" port="decayCV" moduleId={id} active={decayCvConn} signalRef={decayCvRef} size="sm" />
              <Knob value={decay} onChange={onDecayChange} label="decay" variant="row-right" />
            </ModuleRow>
          </div>
          {/* Right: toggles + jacks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Toggle horizontal value={freeze} onChange={onFreezeChange} label="frz" size="sm" />
              <Toggle horizontal value={bypass} onChange={onBypassChange} label="src" size="sm" />
              <Toggle horizontal value={bypassFx} onChange={onBypassFxChange} label="byp" size="sm" />
            </div>
            <Divider className="pt-1" />
            <ModuleJacks>
              <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
              <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
            </ModuleJacks>
          </div>
        </div>
      </div>
    </Module>
  )
}

export default function ReverbModule({ id = 'verb1', preview }) {
  if (preview) return <ReverbPanel size={50} decay={50} mix={50} freeze={false} bypass={false} bypassFx={false} enabled={false} onToggle={() => {}} onSizeChange={() => {}} onDecayChange={() => {}} onMixChange={() => {}} onFreezeChange={() => {}} onBypassChange={() => {}} onBypassFxChange={() => {}} id={id} sizeCvConn={false} sizeCvRef={{ current: null }} decayCvConn={false} decayCvRef={{ current: null }} inConnected={false} inRef={{ current: null }} outRef={{ current: null }} />

  const [size, setSize] = useState(50)
  const [decay, setDecay] = useState(50)
  const [mix, setMix] = useState(50)
  const [freeze, setFreeze] = useState(false)
  const [bypass, setBypass] = useState(false)
  const [bypassFx, setBypassFx] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const routing = usePatchRouting()

  const sizeRef = useRef(50)
  const decayRef = useRef(50)
  const mixRef = useRef(50)
  const freezeRef = useRef(false)
  const bypassRef = useRef(false)
  const bypassFxRef = useRef(false)
  const enabledRef = useRef(true)
  const bufferRef = useRef(new Array(256).fill(null))
  const writeHeadRef = useRef(0)
  const outRef = useRef(null)
  const inRef = useRef(null)
  const sizeCvRef = useRef(null)
  const decayCvRef = useRef(null)

  sizeRef.current = size
  decayRef.current = decay
  mixRef.current = mix
  freezeRef.current = freeze
  bypassRef.current = bypass
  bypassFxRef.current = bypassFx
  enabledRef.current = enabled

  const conns = routing?.connections || []
  const inConnected = conns.some(c => c.toModuleId === id && c.toPort === 'in')
  const sizeCvConn = conns.some(c => c.toModuleId === id && c.toPort === 'sizeCV')
  const decayCvConn = conns.some(c => c.toModuleId === id && c.toPort === 'decayCV')

  useModule({
    id,
    inputs: { in: { type: 'any' }, sizeCV: { type: 'scalar' }, decayCV: { type: 'scalar' } },
    outputs: { out: { type: 'any' } },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      if (bypassFxRef.current) { outRef.current = inputs.in; return { out: inputs.in } }
      sizeCvRef.current = inputs.sizeCV
      decayCvRef.current = inputs.decayCV

      const buf = bufferRef.current
      const len = buf.length
      const input = inputs.in
      const sizeScale = (inputs.sizeCV ? readScalar(inputs.sizeCV) : sizeRef.current) / 100
      const decayAmt = (inputs.decayCV ? readScalar(inputs.decayCV) : decayRef.current) / 100
      const wet = mixRef.current / 100

      // Write current signal to buffer (unless frozen)
      if (!freezeRef.current) {
        buf[writeHeadRef.current] = input || null
        writeHeadRef.current = (writeHeadRef.current + 1) % len
      }

      if (!input && !freezeRef.current) { outRef.current = null; return { out: null } }

      // Read from 4 taps at prime-spaced positions
      const taps = []
      for (let i = 0; i < TAP_PRIMES.length; i++) {
        const tapLen = Math.max(1, Math.round(TAP_PRIMES[i] * sizeScale))
        const readPos = ((writeHeadRef.current - 1 - tapLen) % len + len) % len
        const tap = buf[readPos]
        if (tap) taps.push({ signal: tap, decay: Math.pow(decayAmt, i + 1) })
      }

      const byp = bypassRef.current

      // Points: merge dry + wet trails
      if (input && input.type === 'points') {
        const allPts = []
        const allEdges = []
        // Dry: current frame (unless bypass)
        if (!byp) {
          for (const pt of input.value) allPts.push(pt)
          if (input.edges) for (const [a, b] of input.edges) allEdges.push([a, b])
        }
        // Wet: tapped frames with decay * mix
        for (const { signal, decay } of taps) {
          if (signal.type !== 'points') continue
          const offset = allPts.length
          for (const pt of signal.value) allPts.push({ ...pt, a: (pt.a ?? 1) * decay * wet })
          if (signal.edges) for (const [a, b] of signal.edges) allEdges.push([a + offset, b + offset])
        }
        const out = points(allPts, allEdges.length > 0 ? allEdges : null)
        outRef.current = out
        return { out }
      }

      // Color: blend dry with wet taps
      if (input && input.type === 'color') {
        const c = input.value
        let r = byp ? 0 : c.r, g = byp ? 0 : c.g, bl = byp ? 0 : c.b, total = byp ? 0 : 1
        for (const { signal, decay } of taps) {
          if (signal.type !== 'color') continue
          const w = decay * wet
          r += signal.value.r * w
          g += signal.value.g * w
          bl += signal.value.b * w
          total += w
        }
        if (total === 0) total = 1
        const out = color(r / total, g / total, bl / total, c.a)
        outRef.current = out
        return { out }
      }

      // Scalar: dry + wet average
      if (input && input.type === 'scalar') {
        const dry = byp ? 0 : input.value
        let wetSum = 0, wetCount = 0
        for (const { signal, decay } of taps) {
          if (signal.type !== 'scalar') continue
          wetSum += signal.value * decay
          wetCount += decay
        }
        const wetAvg = wetCount > 0 ? wetSum / wetCount : 0
        const out = scalar(byp ? wetAvg * wet : dry + wetAvg * wet)
        outRef.current = out
        return { out }
      }

      // Fallback: pass through
      outRef.current = input
      return { out: input }
    },
  })

  return <ReverbPanel size={size} decay={decay} mix={mix} freeze={freeze} bypass={bypass} bypassFx={bypassFx} enabled={enabled} onToggle={() => setEnabled(!enabled)} onSizeChange={setSize} onDecayChange={setDecay} onMixChange={setMix} onFreezeChange={setFreeze} onBypassChange={setBypass} onBypassFxChange={setBypassFx} id={id} sizeCvConn={sizeCvConn} sizeCvRef={sizeCvRef} decayCvConn={decayCvConn} decayCvRef={decayCvRef} inConnected={inConnected} inRef={inRef} outRef={outRef} />
}
