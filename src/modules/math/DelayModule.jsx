// DelayModule — time-based delay with dry/wet, copies, feedback
// 6HP — works with any signal type
// For points: copies layer past frames as trailing echoes
// For scalars: feedback creates decaying repeats
//
// Ring buffer is time-keyed (each slot stores its write timestamp). Reads search
// backward for the most recent slot whose timestamp ≤ targetT. This makes behaviour
// FPS-independent — musical timing survives frame drops. Pattern mirrors Magneto.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar, readCv, points } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const BUF_SIZE = 256
const MAX_DELAY_SECONDS = 2.0  // total ring-buffer window
const MAX_BASE_DELAY = 1.0     // knob max; actual tap delay = base * (copy + 1), capped at MAX_DELAY_SECONDS

function DelayPanel({ time, mix, copies, fb, enabled, onToggle, onTimeChange, onMixChange, onCopiesChange, onFbChange, id, inConnected, inRef, timeConn, timeInRef, mixConn, mixInRef, copyConn, copyInRef, fbConn, fbInRef, outRef }) {
  return (
    <Module label="Delay" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '0 2px' }}>
          <LabeledJack type="in" port="tCV" moduleId={id} active={timeConn} signalRef={timeInRef} label="cv" size="sm" />
          <Knob value={time} onChange={onTimeChange} label="time" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '0 2px' }}>
          <LabeledJack type="in" port="mCV" moduleId={id} active={mixConn} signalRef={mixInRef} label="cv" size="sm" />
          <Knob value={mix} onChange={onMixChange} label="mix" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '0 2px' }}>
          <LabeledJack type="in" port="cCV" moduleId={id} active={copyConn} signalRef={copyInRef} label="cv" size="sm" />
          <Knob value={copies} onChange={onCopiesChange} label="copy" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '0 2px' }}>
          <LabeledJack type="in" port="fCV" moduleId={id} active={fbConn} signalRef={fbInRef} label="cv" size="sm" />
          <Knob value={fb} onChange={onFbChange} label="fb" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConnected} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function DelayModule({ id = 'dly1', init, preview }) {
  if (preview) return <DelayPanel time={50} mix={50} copies={30} fb={50} enabled={false} onToggle={() => {}} onTimeChange={() => {}} onMixChange={() => {}} onCopiesChange={() => {}} onFbChange={() => {}} id={id} inConnected={false} inRef={{ current: null }} timeConn={false} timeInRef={{ current: null }} mixConn={false} mixInRef={{ current: null }} copyConn={false} copyInRef={{ current: null }} fbConn={false} fbInRef={{ current: null }} outRef={{ current: null }} />

  const [time, setTime] = useState(init?.time ?? 50)
  const [mix, setMix] = useState(init?.mix ?? 50)
  const [copies, setCopies] = useState(init?.copies ?? 30)
  const [fb, setFb] = useState(init?.fb ?? 50)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const timeRef = useRef(50)
  const mixRef = useRef(50)
  const copiesRef = useRef(30)
  const fbRef = useRef(50)
  const enabledRef = useRef(true)
  // Ring buffer stores { data, t } per slot, where t is the write timestamp in seconds.
  const bufferRef = useRef(new Array(BUF_SIZE).fill(null))
  const writeHeadRef = useRef(0)
  // Precomputed decay weights per copy: decayTable[c] = feedback^(c+1). Rebuilt only
  // when feedback or numCopies change — avoids a Math.pow per tap per frame.
  const decayTableRef = useRef({ feedback: NaN, numCopies: 0, table: new Float32Array(6) })
  const outRef = useRef(null)
  const inRef = useRef(null)

  timeRef.current = time
  mixRef.current = mix
  copiesRef.current = copies
  fbRef.current = fb
  enabledRef.current = enabled

  const timeInRef = useRef(null)
  const mixInRef = useRef(null)
  const copyInRef = useRef(null)
  const fbInRef = useRef(null)

  const inConnected = cp.has('in')
  const timeConn = cp.has('tCV')
  const mixConn = cp.has('mCV')
  const copyConn = cp.has('cCV')
  const fbConn = cp.has('fCV')

  const saveStateRef = useRef({})
  saveStateRef.current = { time, mix, copies, fb }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'any' },
      tCV: { type: 'scalar', cv: 'offset' },
      mCV: { type: 'scalar', cv: 'attenuate' },
      cCV: { type: 'scalar', cv: 'offset' },
      fCV: { type: 'scalar', cv: 'attenuate' },
    },
    outputs: { out: { type: 'any' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      timeInRef.current = inputs.tCV
      mixInRef.current = inputs.mCV
      copyInRef.current = inputs.cCV
      fbInRef.current = inputs.fCV

      const buf = bufferRef.current
      const timeKnob = readCv(inputs.tCV, timeRef.current)
      const m = readCv(inputs.mCV, mixRef.current, 'attenuate')
      const cKnob = readCv(inputs.cCV, copiesRef.current)
      const fKnob = readCv(inputs.fCV, fbRef.current, 'attenuate')
      // Base delay in seconds: 0.01s at knob=0, up to MAX_BASE_DELAY at knob=100.
      // Actual tap at copy c is (c+1) * baseDelay, capped at MAX_DELAY_SECONDS.
      const baseDelay = 0.01 + (timeKnob / 100) * (MAX_BASE_DELAY - 0.01)
      const wet = m / 100
      const numCopies = Math.max(1, Math.round(1 + (cKnob / 100) * 5))
      const feedback = fKnob / 100
      const input = inputs.in

      // Rebuild decay table only when inputs change
      const dt_cache = decayTableRef.current
      if (dt_cache.feedback !== feedback || dt_cache.numCopies !== numCopies) {
        for (let ci = 0; ci < numCopies; ci++) dt_cache.table[ci] = Math.pow(feedback, ci + 1)
        dt_cache.feedback = feedback
        dt_cache.numCopies = numCopies
      }
      const decayTable = dt_cache.table

      // Write current signal with timestamp
      buf[writeHeadRef.current] = input ? { data: input, t } : null
      writeHeadRef.current = (writeHeadRef.current + 1) % BUF_SIZE

      if (!input) { outRef.current = null; return { out: null } }

      // Read most recent slot whose timestamp ≤ targetT. Returns the stored signal
      // (or null if the buffer hasn't filled that far back yet).
      const readAtTime = (targetT) => {
        if (targetT < 0) return null
        for (let i = 0; i < BUF_SIZE; i++) {
          const idx = ((writeHeadRef.current - 1 - i) % BUF_SIZE + BUF_SIZE) % BUF_SIZE
          const slot = buf[idx]
          if (!slot) continue
          if (slot.t <= targetT) return slot.data
        }
        return null
      }

      // Points: merge copies as trailing echoes
      if (input.type === 'points') {
        const allPts = []
        const allEdges = []
        // Dry: current frame
        if (wet < 1) {
          const offset = allPts.length
          for (const pt of input.value) allPts.push(pt)
          if (input.edges) for (const [a, b] of input.edges) allEdges.push([a + offset, b + offset])
        }
        // Wet: delayed copies
        for (let ci = 0; ci < numCopies; ci++) {
          const tapDelay = Math.min(baseDelay * (ci + 1), MAX_DELAY_SECONDS)
          const tap = readAtTime(t - tapDelay)
          if (!tap || tap.type !== 'points') continue
          const offset = allPts.length
          for (const pt of tap.value) allPts.push(pt)
          if (tap.edges) for (const [a, b] of tap.edges) allEdges.push([a + offset, b + offset])
        }
        const out = points(allPts, allEdges.length > 0 ? allEdges : null)
        out.strokeWidth = input.strokeWidth ?? 1
        if (input.color) out.color = input.color
        // Pass-through upstream groups + signal metadata — Delay doesn't transform geometry,
        // just delays it. Groups (e.g. Magneto's trails) stay visible downstream.
        if (input.groups) out.groups = input.groups
        if (input.bg) out.bg = input.bg
        if (input.aspectLock) out.aspectLock = input.aspectLock
        if (input.aspectFill) out.aspectFill = input.aspectFill
        outRef.current = out
        return { out }
      }

      // Scalar: feedback delay with dry/wet mix
      if (input.type === 'scalar') {
        const dry = readScalar(input)
        let wetSum = 0
        for (let ci = 0; ci < numCopies; ci++) {
          const tapDelay = Math.min(baseDelay * (ci + 1), MAX_DELAY_SECONDS)
          const tap = readAtTime(t - tapDelay)
          if (tap && tap.type === 'scalar') {
            wetSum += tap.value * decayTable[ci]
          }
        }
        const mixed = dry * (1 - wet) + (wetSum / Math.max(1, numCopies)) * wet
        const out = scalar(mixed)
        outRef.current = out
        return { out }
      }

      // Other types: simple delay at base tap (first copy)
      const delayed = readAtTime(t - Math.min(baseDelay, MAX_DELAY_SECONDS))
      outRef.current = delayed
      return { out: delayed }
    },
  })

  return <DelayPanel time={time} mix={mix} copies={copies} fb={fb} enabled={enabled} onToggle={() => setEnabled(!enabled)} onTimeChange={setTime} onMixChange={setMix} onCopiesChange={setCopies} onFbChange={setFb} id={id} inConnected={inConnected} inRef={inRef} timeConn={timeConn} timeInRef={timeInRef} mixConn={mixConn} mixInRef={mixInRef} copyConn={copyConn} copyInRef={copyInRef} fbConn={fbConn} fbInRef={fbInRef} outRef={outRef} />
}
