// ConsoleModule — 4-channel mixing console with 2 send/return + master output
// 48HP — endpoint for compositing, routing, and display

import { useRef, useState } from 'react'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Slider from '../controls/Slider'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'

const BUF_LEN = 128
const CHS = ['a', 'b', 'c', 'd']

// Scale any signal type by a 0-1 level
function scaleSignal(sig, lvl) {
  if (sig.type === 'scalar') return { ...sig, value: sig.value * lvl }
  if (sig.type === 'color') return { ...sig, value: { ...sig.value, a: (sig.value.a ?? 1) * lvl } }
  // Points/pen: attach opacity level for renderer
  return { ...sig, opacity: lvl }
}

function ConsolePanel({ canvasRef, lvlA, lvlB, lvlC, lvlD, s1A, s1B, s1C, s1D, s2A, s2B, s2C, s2D, rtn1, rtn2, muteA, muteB, muteC, muteD, send1On, send2On, bg, masterLvl, mstS1, mstS2, masterOn, enabled, onToggle, setLvlA, setLvlB, setLvlC, setLvlD, setS1A, setS1B, setS1C, setS1D, setS2A, setS2B, setS2C, setS2D, setRtn1, setRtn2, setMuteA, setMuteB, setMuteC, setMuteD, setSend1On, setSend2On, setBg, setMasterLvl, setMstS1, setMstS2, setMasterOn, id, chConns, chRefs, rtn1Conn, rtn1InRef, rtn2Conn, rtn2InRef, penConn, penRef, bgConn, bgInRef, mstPenConn, mstPenRef, mstBgConn, mstBgRef, send1Ref, send2Ref, masterOutRef }) {
  const lvls = [lvlA, lvlB, lvlC, lvlD]
  const setLvls = [setLvlA, setLvlB, setLvlC, setLvlD]
  const s1s = [s1A, s1B, s1C, s1D]
  const setS1s = [setS1A, setS1B, setS1C, setS1D]
  const s2s = [s2A, s2B, s2C, s2D]
  const setS2s = [setS2A, setS2B, setS2C, setS2D]
  const mutes = [muteA, muteB, muteC, muteD]
  const setMutes = [setMuteA, setMuteB, setMuteC, setMuteD]

  const ch = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 3 }

  return (
    <Module label="Console" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', height: '100%', gap: 12, padding: '4px 2px 4px 12px' }}>

        {/* 4 Channel strips with dividers */}
        {CHS.map((ci, i) => (
          <div key={ci} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: 3 }}>
              <LabeledJack type="in" port={ci} moduleId={id} active={chConns[ci]} signalRef={{ get current() { return chRefs.current[ci] } }} label={ci} />
              <Knob value={s1s[i]} onChange={setS1s[i]} label="s1" />
              <Knob value={s2s[i]} onChange={setS2s[i]} label="s2" />
              <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', padding: '16px 0' }}>
                <Slider value={lvls[i]} onChange={setLvls[i]} direction="vertical" height="100%" />
              </div>
              <Toggle value={!mutes[i]} onChange={() => setMutes[i](!mutes[i])} label="on" size="sm" />
            </div>
            {i < 3 && <Divider variant="vertical" />}
          </div>
        ))}

        <Divider variant="vertical" />

        {/* Send/Return section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: 4 }}>
          <div style={{ ...ch, flex: 1 }}>
            <Toggle value={send1On} onChange={setSend1On} label="R1" size="sm" />
            <LabeledJack type="out" port="snd1" moduleId={id} signalRef={send1Ref} label="snd" />
            <LabeledJack type="in" port="rtn1" moduleId={id} active={rtn1Conn} signalRef={rtn1InRef} label="rtn" />
            <Knob value={rtn1} onChange={setRtn1} label="rtn" />
          </div>
          <Divider className="py-4" />
          <div style={{ ...ch, flex: 1 }}>
            <Toggle value={send2On} onChange={setSend2On} label="R2" size="sm" />
            <LabeledJack type="out" port="snd2" moduleId={id} signalRef={send2Ref} label="snd" />
            <LabeledJack type="in" port="rtn2" moduleId={id} active={rtn2Conn} signalRef={rtn2InRef} label="rtn" />
            <Knob value={rtn2} onChange={setRtn2} label="rtn" />
          </div>
        </div>

        <Divider variant="vertical" />

        {/* Master strip */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: 3 }}>
          <LabeledJack type="in" port="mstBg" moduleId={id} active={mstBgConn} signalRef={mstBgRef} label="bg" />
          <Knob value={mstS1} onChange={setMstS1} label="s1" />
          <Knob value={mstS2} onChange={setMstS2} label="s2" />
          <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', padding: '16px 0' }}>
            <Slider value={masterLvl} onChange={setMasterLvl} direction="vertical" height="100%" />
          </div>
          <Toggle value={masterOn} onChange={setMasterOn} label="on" size="sm" />
        </div>

        {/* Canvas + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minHeight: 0 }}>
          <canvas
            ref={canvasRef}
            width={200}
            height={120}
            style={{ flex: 1, minHeight: 0, width: '100%', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}
          />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <LabeledJack type="in" port="bgCV" moduleId={id} active={bgConn} signalRef={bgInRef} label="cv" />
            <Knob value={bg} onChange={setBg} label="bg" />
            <LabeledJack type="in" port="pen" moduleId={id} active={penConn} signalRef={penRef} label="pen" />
            <LabeledJack type="out" port="out" moduleId={id} signalRef={masterOutRef} label="out" />
          </div>
        </div>
      </div>
    </Module>
  )
}

export default function ConsoleModule({ id = 'console1', init, preview }) {
  if (preview) {
    const dummyChRefs = { current: { a: null, b: null, c: null, d: null } }
    return <ConsolePanel canvasRef={{ current: null }} lvlA={100} lvlB={100} lvlC={100} lvlD={100} s1A={0} s1B={0} s1C={0} s1D={0} s2A={0} s2B={0} s2C={0} s2D={0} rtn1={80} rtn2={80} muteA={false} muteB={false} muteC={false} muteD={false} send1On={true} send2On={true} bg={0} masterLvl={100} enabled={false} onToggle={() => {}} setLvlA={() => {}} setLvlB={() => {}} setLvlC={() => {}} setLvlD={() => {}} setS1A={() => {}} setS1B={() => {}} setS1C={() => {}} setS1D={() => {}} setS2A={() => {}} setS2B={() => {}} setS2C={() => {}} setS2D={() => {}} setRtn1={() => {}} setRtn2={() => {}} setMuteA={() => {}} setMuteB={() => {}} setMuteC={() => {}} setMuteD={() => {}} setSend1On={() => {}} setSend2On={() => {}} setBg={() => {}} setMasterLvl={() => {}} id={id} chConns={{ a: false, b: false, c: false, d: false }} chRefs={dummyChRefs} rtn1Conn={false} rtn1InRef={{ current: null }} rtn2Conn={false} rtn2InRef={{ current: null }} penConn={false} penRef={{ current: null }} bgConn={false} bgInRef={{ current: null }} send1Ref={{ current: null }} send2Ref={{ current: null }} masterOutRef={{ current: null }} />
  }

  const canvasRef = useRef(null)

  // Channel levels
  const [lvlA, setLvlA] = useState(init?.lvlA ?? 100)
  const [lvlB, setLvlB] = useState(init?.lvlB ?? 100)
  const [lvlC, setLvlC] = useState(init?.lvlC ?? 100)
  const [lvlD, setLvlD] = useState(init?.lvlD ?? 100)

  // Send levels per channel (send 1 / send 2)
  const [s1A, setS1A] = useState(init?.s1A ?? 0)
  const [s1B, setS1B] = useState(init?.s1B ?? 0)
  const [s1C, setS1C] = useState(init?.s1C ?? 0)
  const [s1D, setS1D] = useState(init?.s1D ?? 0)
  const [s2A, setS2A] = useState(init?.s2A ?? 0)
  const [s2B, setS2B] = useState(init?.s2B ?? 0)
  const [s2C, setS2C] = useState(init?.s2C ?? 0)
  const [s2D, setS2D] = useState(init?.s2D ?? 0)

  // Return levels
  const [rtn1, setRtn1] = useState(init?.rtn1 ?? 80)
  const [rtn2, setRtn2] = useState(init?.rtn2 ?? 80)

  // Send enables
  const [send1On, setSend1On] = useState(init?.send1On ?? true)
  const [send2On, setSend2On] = useState(init?.send2On ?? true)
  const send1OnRef = useRef(true)
  const send2OnRef = useRef(true)

  // Mutes
  const [muteA, setMuteA] = useState(init?.muteA ?? false)
  const [muteB, setMuteB] = useState(init?.muteB ?? false)
  const [muteC, setMuteC] = useState(init?.muteC ?? false)
  const [muteD, setMuteD] = useState(init?.muteD ?? false)

  // Master
  const [bg, setBg] = useState(init?.bg ?? 0)
  const [masterLvl, setMasterLvl] = useState(init?.masterLvl ?? 100)
  const [mstS1, setMstS1] = useState(init?.mstS1 ?? 0)
  const [mstS2, setMstS2] = useState(init?.mstS2 ?? 0)
  const [masterOn, setMasterOn] = useState(init?.masterOn ?? true)
  const [enabled, setEnabled] = useModuleEnabled()

  const cp = useConnectedPorts(id)
  const enabledRef = useRef(true)
  send1OnRef.current = send1On
  send2OnRef.current = send2On
  enabledRef.current = enabled

  // Refs for all state
  const lvlRefs = useRef({ a: 100, b: 100, c: 100, d: 100 })
  const s1Refs = useRef({ a: 0, b: 0, c: 0, d: 0 })
  const s2Refs = useRef({ a: 0, b: 0, c: 0, d: 0 })
  const muteRefs = useRef({ a: false, b: false, c: false, d: false })
  const rtn1Ref = useRef(80)
  const rtn2Ref = useRef(80)
  const bgRef = useRef(0)
  const masterLvlRef = useRef(100)
  const mstS1Ref = useRef(0)
  const mstS2Ref = useRef(0)
  const masterOnRef = useRef(true)

  lvlRefs.current = { a: lvlA, b: lvlB, c: lvlC, d: lvlD }
  s1Refs.current = { a: s1A, b: s1B, c: s1C, d: s1D }
  s2Refs.current = { a: s2A, b: s2B, c: s2C, d: s2D }
  muteRefs.current = { a: muteA, b: muteB, c: muteC, d: muteD }
  rtn1Ref.current = rtn1
  rtn2Ref.current = rtn2
  bgRef.current = bg
  masterLvlRef.current = masterLvl
  mstS1Ref.current = mstS1
  mstS2Ref.current = mstS2
  masterOnRef.current = masterOn

  // Signal refs
  const chRefs = useRef({ a: null, b: null, c: null, d: null })
  const rtn1InRef = useRef(null)
  const rtn2InRef = useRef(null)
  const penRef = useRef(null)
  const bgInRef = useRef(null)
  const mstPenRef = useRef(null)
  const mstBgRef = useRef(null)
  const send1Ref = useRef(null)
  const send2Ref = useRef(null)
  const masterOutRef = useRef(null)

  // History buffers for scope traces
  const historyRefs = useRef(Object.fromEntries([...CHS, 'r1', 'r2'].map(k => [k, new Float32Array(BUF_LEN)])))
  const writeIdxRef = useRef(0)

  const chConns = Object.fromEntries(CHS.map(ch => [ch, cp.has(ch)]))
  const rtn1Conn = cp.has('rtn1')
  const rtn2Conn = cp.has('rtn2')
  const penConn = cp.has('pen')
  const bgConn = cp.has('bgCV')
  const mstPenConn = cp.has('mstPen')
  const mstBgConn = cp.has('mstBg')

  const saveStateRef = useRef({})
  saveStateRef.current = { muteA, muteB, muteC, muteD, masterOn, send1On, send2On }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      a: { type: 'any' }, b: { type: 'any' }, c: { type: 'any' }, d: { type: 'any' },
      rtn1: { type: 'any' }, rtn2: { type: 'any' },
      pen: { type: 'pen' }, bgCV: { type: 'scalar', cv: 'offset' },
      mstPen: { type: 'pen' }, mstBg: { type: 'scalar', cv: 'offset' },
    },
    outputs: {
      snd1: { type: 'any' }, snd2: { type: 'any' }, out: { type: 'any' },
    },
    process: (inputs) => {
      if (!enabledRef.current) {
        for (const ch of CHS) chRefs.current[ch] = null
        rtn1InRef.current = null; rtn2InRef.current = null
        penRef.current = null; bgInRef.current = null
        send1Ref.current = null; send2Ref.current = null; masterOutRef.current = null
        return { snd1: null, snd2: null, out: null }
      }

      for (const ch of CHS) chRefs.current[ch] = muteRefs.current[ch] ? null : inputs[ch]
      rtn1InRef.current = inputs.rtn1
      rtn2InRef.current = inputs.rtn2
      penRef.current = inputs.pen || inputs.mstPen
      bgInRef.current = inputs.bgCV || inputs.mstBg
      mstPenRef.current = inputs.mstPen
      mstBgRef.current = inputs.mstBg

      // Build send outputs — scale by send level
      let snd1 = null, snd2 = null
      for (const ch of CHS) {
        const sig = chRefs.current[ch]
        if (!sig) continue
        const lvl1 = s1Refs.current[ch] / 100
        const lvl2 = s2Refs.current[ch] / 100
        if (send1OnRef.current && lvl1 > 0 && !snd1) {
          snd1 = scaleSignal(sig, lvl1)
        }
        if (send2OnRef.current && lvl2 > 0 && !snd2) {
          snd2 = scaleSignal(sig, lvl2)
        }
      }
      send1Ref.current = snd1
      send2Ref.current = snd2

      // History for scope
      const idx = writeIdxRef.current
      for (const ch of CHS) {
        const sig = chRefs.current[ch]
        historyRefs.current[ch][idx] = sig?.type === 'scalar' ? sig.value : 0
      }
      if (inputs.rtn1?.type === 'scalar') historyRefs.current.r1[idx] = inputs.rtn1.value
      if (inputs.rtn2?.type === 'scalar') historyRefs.current.r2[idx] = inputs.rtn2.value
      writeIdxRef.current = (idx + 1) % BUF_LEN

      // Master out — pass first non-null channel (for chaining)
      const firstActive = CHS.find(ch => chRefs.current[ch])
      masterOutRef.current = firstActive ? chRefs.current[firstActive] : null

      return { snd1, snd2, out: masterOutRef.current }
    },
  })

  useCanvasLoop(canvasRef, () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    if (!w || !h) return

    if (!enabledRef.current) {
      ctx.fillStyle = 'rgba(8,8,8,1)'
      ctx.fillRect(0, 0, w, h)
      return
    }

    const bgCv = bgInRef.current?.type === 'scalar' ? bgInRef.current : null
    const bgVal = readCv(bgCv, bgRef.current)
    const g = Math.round((bgVal / 100) * 255)
    ctx.fillStyle = `rgb(${g},${g},${g})`
    ctx.fillRect(0, 0, w, h)

    if (!masterOnRef.current) return

    const wi = writeIdxRef.current
    const p = penRef.current
    const mst = masterLvlRef.current / 100

    for (const ch of CHS) {
      if (muteRefs.current[ch]) continue
      const sig = chRefs.current[ch]
      if (!sig) continue
      const lvl = lvlRefs.current[ch] / 100
      ctx.globalAlpha = lvl * mst
      drawSignal(ctx, sig, 0, 0, w, h, historyRefs.current[ch], wi, BUF_LEN, p)
      ctx.globalAlpha = 1
    }

    if (rtn1InRef.current) {
      const maxSnd1 = Math.max(s1Refs.current.a, s1Refs.current.b, s1Refs.current.c, s1Refs.current.d, mstS1Ref.current) / 100
      ctx.globalAlpha = maxSnd1 * (rtn1Ref.current / 100) * mst
      drawSignal(ctx, rtn1InRef.current, 0, 0, w, h, historyRefs.current.r1, wi, BUF_LEN, p)
      ctx.globalAlpha = 1
    }
    if (rtn2InRef.current) {
      const maxSnd2 = Math.max(s2Refs.current.a, s2Refs.current.b, s2Refs.current.c, s2Refs.current.d, mstS2Ref.current) / 100
      ctx.globalAlpha = maxSnd2 * (rtn2Ref.current / 100) * mst
      drawSignal(ctx, rtn2InRef.current, 0, 0, w, h, historyRefs.current.r2, wi, BUF_LEN, p)
      ctx.globalAlpha = 1
    }
  })

  return <ConsolePanel canvasRef={canvasRef} lvlA={lvlA} lvlB={lvlB} lvlC={lvlC} lvlD={lvlD} s1A={s1A} s1B={s1B} s1C={s1C} s1D={s1D} s2A={s2A} s2B={s2B} s2C={s2C} s2D={s2D} rtn1={rtn1} rtn2={rtn2} muteA={muteA} muteB={muteB} muteC={muteC} muteD={muteD} send1On={send1On} send2On={send2On} bg={bg} masterLvl={masterLvl} mstS1={mstS1} mstS2={mstS2} masterOn={masterOn} enabled={enabled} onToggle={() => setEnabled(!enabled)} setLvlA={setLvlA} setLvlB={setLvlB} setLvlC={setLvlC} setLvlD={setLvlD} setS1A={setS1A} setS1B={setS1B} setS1C={setS1C} setS1D={setS1D} setS2A={setS2A} setS2B={setS2B} setS2C={setS2C} setS2D={setS2D} setRtn1={setRtn1} setRtn2={setRtn2} setMuteA={setMuteA} setMuteB={setMuteB} setMuteC={setMuteC} setMuteD={setMuteD} setSend1On={setSend1On} setSend2On={setSend2On} setBg={setBg} setMasterLvl={setMasterLvl} setMstS1={setMstS1} setMstS2={setMstS2} setMasterOn={setMasterOn} id={id} chConns={chConns} chRefs={chRefs} rtn1Conn={rtn1Conn} rtn1InRef={rtn1InRef} rtn2Conn={rtn2Conn} rtn2InRef={rtn2InRef} penConn={penConn} penRef={penRef} bgConn={bgConn} bgInRef={bgInRef} mstPenConn={mstPenConn} mstPenRef={mstPenRef} mstBgConn={mstBgConn} mstBgRef={mstBgRef} send1Ref={send1Ref} send2Ref={send2Ref} masterOutRef={masterOutRef} />
}
