// AttenuatorModule — 4-channel attenuverter with cascading outputs
// 26HP 1U. UNI/-/+ toggle per channel, normalled cascade between outputs.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import FlipToggle from '../parametric/FlipToggle'
import Divider from '../../components/atoms/Divider'
import Icon from '../../components/icons/Icon'
import { usePatchRouting, useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function AttenPanel({ levels, modes, enabled, onToggle, onLevelChange, onModeChange, id, inConns, inRefs, outRefs }) {
  return (
    <Module label="Atten" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 16 }}>

        {['a', 'b', 'c', 'd'].map((ch, i) => (
          <div key={ch} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
                <FlipToggle value={!modes[i]} onChange={(v) => onModeChange(i, !v)} labelA="uni" labelB="-/+" />
              </div>
              <Knob value={levels[i]} onChange={(v) => onLevelChange(i, v)} label={ch} />
            </div>
            {i < 3 && <Divider variant="vertical" />}
          </div>
        ))}

        <Divider variant="vertical" />

        <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(4, auto)', columnGap: 20, rowGap: 16 }}>
          {['a', 'b', 'c', 'd'].map(ch => (
            <div key={`in-${ch}`} style={{ position: 'relative' }}>
              <LabeledJack type="in" port={ch} moduleId={id} active={inConns[ch]} signalRef={inRefs[ch]} label={ch} labelPosition="top" />
              <Icon name="caret-down" size={8} style={{ color: 'rgba(255,255,255,0.25)', position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)' }} />
            </div>
          ))}
          {['a', 'b', 'c', 'd'].map((ch, i) => (
            <div key={`out-${ch}`} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <JackSocket type="out" port={ch} moduleId={id} signalRef={outRefs[ch]} />
              {i < 3 && <Icon name="caret-right" size={8} style={{ color: 'rgba(255,255,255,0.25)', position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)' }} />}
            </div>
          ))}
        </div>

      </div>
    </Module>
  )
}

const NOOP = () => {}
const NULL_REF = { current: null }
const NULL_REFS = { a: NULL_REF, b: NULL_REF, c: NULL_REF, d: NULL_REF }
const NO_CONNS = { a: false, b: false, c: false, d: false }

export default function AttenuatorModule({ id = 'atten1', init, preview }) {
  if (preview) return <AttenPanel levels={[0,0,0,0]} modes={[false,false,false,false]} enabled={false} onToggle={NOOP} onLevelChange={NOOP} onModeChange={NOOP} id={id} inConns={NO_CONNS} inRefs={NULL_REFS} outRefs={NULL_REFS} />

  const [levels, setLevels] = useState(init?.levels ?? [0, 0, 0, 0])
  const [modes, setModes] = useState(init?.modes ?? [false, false, false, false]) // false = uni, true = bipolar
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const levelsRef = useRef([0, 0, 0, 0])
  const modesRef = useRef([false, false, false, false])
  const inRefsObj = { a: useRef(null), b: useRef(null), c: useRef(null), d: useRef(null) }
  const outRefsObj = { a: useRef(null), b: useRef(null), c: useRef(null), d: useRef(null) }

  enabledRef.current = enabled
  levelsRef.current = levels
  modesRef.current = modes

  const inConns = {
    a: cp.has('a'),
    b: cp.has('b'),
    c: cp.has('c'),
    d: cp.has('d'),
  }
  const conns = routing?.connections || []
  const outConns = {
    a: conns.some(c => c.fromModuleId === id && c.fromPort === 'a'),
    b: conns.some(c => c.fromModuleId === id && c.fromPort === 'b'),
    c: conns.some(c => c.fromModuleId === id && c.fromPort === 'c'),
    d: conns.some(c => c.fromModuleId === id && c.fromPort === 'd'),
  }

  const saveStateRef = useRef({})
  saveStateRef.current = { levels, modes }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: { a: { type: 'scalar' }, b: { type: 'scalar' }, c: { type: 'scalar' }, d: { type: 'scalar' } },
    outputs: { a: { type: 'scalar' }, b: { type: 'scalar' }, c: { type: 'scalar' }, d: { type: 'scalar' } },
    process: (inputs) => {
      if (!enabledRef.current) {
        outRefsObj.a.current = null; outRefsObj.b.current = null
        outRefsObj.c.current = null; outRefsObj.d.current = null
        return { a: null, b: null, c: null, d: null }
      }

      const chs = ['a', 'b', 'c', 'd']
      const results = {}
      let prevOut = 100 // first channel: normalled to max rail

      for (let i = 0; i < 4; i++) {
        const ch = chs[i]
        inRefsObj[ch].current = inputs[ch]
        // Daisy-chain normal: patched input wins; else inherit previous channel's output
        const input = inputs[ch] ? readScalar(inputs[ch]) : prevOut
        const lvl = levelsRef.current[i] / 100
        const bipolar = modesRef.current[i]
        const scaled = bipolar ? input * (lvl * 2 - 1) : input * lvl

        const out = scalar(scaled)
        outRefsObj[ch].current = out
        results[ch] = out
        prevOut = scaled
      }

      return results
    },
  })

  const handleLevelChange = (i, v) => setLevels(prev => { const next = [...prev]; next[i] = v; return next })
  const handleModeChange = (i, v) => setModes(prev => { const next = [...prev]; next[i] = v; return next })

  return <AttenPanel levels={levels} modes={modes} enabled={enabled} onToggle={() => setEnabled(!enabled)} onLevelChange={handleLevelChange} onModeChange={handleModeChange} id={id} inConns={inConns} inRefs={inRefsObj} outRefs={outRefsObj} />
}
