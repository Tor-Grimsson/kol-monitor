// ReverbModule — multi-tap delay reverb
// 6HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, color, points, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import ModuleLayout, { ModuleControls, ModuleRow, ModuleJacks } from '../utility/ModuleLayout'
import Divider from '../../components/atoms/Divider'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const TAP_PRIMES = [7, 13, 23, 37, 53, 71, 97, 113, 137, 157, 179, 199]

function ReverbPanel({ size, decay, mix, freeze, bypass, bypassFx, enabled, onToggle, onSizeChange, onDecayChange, onMixChange, onFreezeChange, onBypassChange, onBypassFxChange, id, sizeCvConn, sizeCvRef, decayCvConn, decayCvRef, inConnected, inRef, outRef }) {
  return (
    <Module label="Ghost" enabled={enabled} onToggle={onToggle} u={1}>
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

export default function ReverbModule({ id = 'verb1', init, preview }) {
  if (preview) return <ReverbPanel size={50} decay={50} mix={50} freeze={false} bypass={false} bypassFx={false} enabled={false} onToggle={() => {}} onSizeChange={() => {}} onDecayChange={() => {}} onMixChange={() => {}} onFreezeChange={() => {}} onBypassChange={() => {}} onBypassFxChange={() => {}} id={id} sizeCvConn={false} sizeCvRef={{ current: null }} decayCvConn={false} decayCvRef={{ current: null }} inConnected={false} inRef={{ current: null }} outRef={{ current: null }} />

  const [size, setSize] = useState(init?.size ?? 50)
  const [decay, setDecay] = useState(init?.decay ?? 50)
  const [mix, setMix] = useState(init?.mix ?? 50)
  const [freeze, setFreeze] = useState(init?.freeze ?? false)
  const [bypass, setBypass] = useState(init?.bypass ?? false)
  const [bypassFx, setBypassFx] = useState(init?.bypassFx ?? false)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

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

  const inConnected = cp.has('in')
  const sizeCvConn = cp.has('sizeCV')
  const decayCvConn = cp.has('decayCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { size, decay, mix, freeze, bypass, bypassFx }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { in: { type: 'any' }, sizeCV: { type: 'scalar', cv: 'offset' }, decayCV: { type: 'scalar', cv: 'offset' } },
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
      const sizeScale = readCv(inputs.sizeCV, sizeRef.current) / 100
      const decayAmt = readCv(inputs.decayCV, decayRef.current) / 100
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
        for (let ti = 0; ti < taps.length; ti++) {
          const signal = taps[ti].signal
          const decay = taps[ti].decay
          if (signal.type !== 'points') continue
          const offset = allPts.length
          const tapAlphaBase = decay * wet
          const sv = signal.value
          for (let pi = 0; pi < sv.length; pi++) {
            const pt = sv[pi]
            allPts.push({ x: pt.x, y: pt.y, a: (pt.a ?? 1) * tapAlphaBase })
          }
          if (signal.edges) {
            const se = signal.edges
            for (let ei = 0; ei < se.length; ei++) {
              const e = se[ei]
              allEdges.push([e[0] + offset, e[1] + offset])
            }
          }
        }
        const out = points(allPts, allEdges.length > 0 ? allEdges : null)
        out.strokeWidth = input.strokeWidth ?? 1
        if (input.color) out.color = input.color
        // Pass upstream groups through unchanged — Reverb doesn't transform group geometry;
        // this keeps e.g. Magneto's wet trails visible downstream. Dropped in bypass mode.
        if (!byp && input.groups) out.groups = input.groups
        if (input.bg) out.bg = input.bg
        if (input.aspectLock) out.aspectLock = input.aspectLock
        if (input.aspectFill) out.aspectFill = input.aspectFill
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
