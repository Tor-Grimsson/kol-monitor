// RuttEtraModule — scan processor (Rutt/Etra 1972, the Vasulka instrument).
// Luminance displaces scanlines vertically: bright areas push their line up.
// CHAINABLE: any signal in → displaced scanline POINTS out. The internal
// low-res rasterize + luma sample is an implementation detail (ARCHITECTURE
// §1); the wire protocol sees vectors on both sides.
// Design doc: .kol/llm-plan/09-rutt-etra-dev.md
// 10HP 3U, math category.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import CvKnob from '../parametric/CvKnob'
import Knob from '../parametric/Knob'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from '../display/drawSignal'

const COLS = 64
const DUMMY_HIST = new Float32Array(2)

function RuttEtraPanel({ amt, res, gain, enabled, onToggle, onAmt, onRes, onGain, id, inConn, inRef, amtConn, amtRef, outRef }) {
  return (
    <Module label="Rutt/Etra" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '6px 0',
      }}>
        <CvKnob port="amt" moduleId={id} active={amtConn} signalRef={amtRef} value={amt} onChange={onAmt} label="amt" />
        <Knob value={res} onChange={onRes} label="lines" />
        <Knob value={gain} onChange={onGain} label="gain" />
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function RuttEtraModule({ id = 'rutt1', init, preview }) {
  if (preview) return <RuttEtraPanel amt={50} res={40} gain={50} enabled={false} onToggle={() => {}} onAmt={() => {}} onRes={() => {}} onGain={() => {}} id={id} inConn={false} inRef={{ current: null }} amtConn={false} amtRef={{ current: null }} outRef={{ current: null }} />

  const [amt, setAmt] = useState(init?.amt ?? 50)
  const [res, setRes] = useState(init?.res ?? 40)
  const [gain, setGain] = useState(init?.gain ?? 50)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const amtRef = useRef(50); amtRef.current = amt
  const resRef = useRef(40); resRef.current = res
  const gainRef = useRef(50); gainRef.current = gain
  const enabledRef = useRef(true); enabledRef.current = enabled
  const inRef = useRef(null)
  const amtInRef = useRef(null)
  const outRef = useRef(null)
  // Internal sampling surface (created lazily — process can run before DOM is warm)
  const sampleRef = useRef(null)

  const saveStateRef = useRef({})
  saveStateRef.current = { amt, res, gain }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      in: { type: 'any' },
      amt: { type: 'scalar', cv: 'offset' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs) => {
      if (!enabledRef.current || !inputs.in) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      amtInRef.current = inputs.amt

      const rows = Math.max(12, Math.round(12 + (resRef.current / 100) * 44))
      if (!sampleRef.current) sampleRef.current = document.createElement('canvas')
      const cv = sampleRef.current
      if (cv.width !== COLS || cv.height !== rows) { cv.width = COLS; cv.height = rows }
      const sctx = cv.getContext('2d', { willReadFrequently: true })
      sctx.fillStyle = '#000'
      sctx.fillRect(0, 0, COLS, rows)
      drawSignal(sctx, inputs.in, 0, 0, COLS, rows, DUMMY_HIST, 0, DUMMY_HIST.length, null)
      const img = sctx.getImageData(0, 0, COLS, rows).data

      const amtVal = readCv(amtInRef.current, amtRef.current) / 100
      const g = 0.25 + (gainRef.current / 100) * 3.75
      const lift = amtVal * 0.35

      const pts = []
      const edges = []
      for (let r = 0; r < rows; r++) {
        const rowY = 0.08 + (r / (rows - 1)) * 0.84
        const base = pts.length
        for (let c = 0; c < COLS; c++) {
          const i = (r * COLS + c) * 4
          const luma = Math.min(1, ((img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114) / 255) * g)
          pts.push({ x: 0.04 + (c / (COLS - 1)) * 0.92, y: rowY - luma * lift })
          if (c > 0) edges.push([base + c - 1, base + c])
        }
      }

      const out = points(pts, edges)
      out.aspectLock = true
      out.strokeWidth = 1
      outRef.current = out
      return { out }
    },
  })

  return <RuttEtraPanel amt={amt} res={res} gain={gain} enabled={enabled} onToggle={() => setEnabled(!enabled)} onAmt={setAmt} onRes={setRes} onGain={setGain} id={id} inConn={cp.has('in')} inRef={inRef} amtConn={cp.has('amt')} amtRef={amtInRef} outRef={outRef} />
}
