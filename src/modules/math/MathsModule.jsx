// MathsModule — dual function generator + dual attenuverter + utility bus
// 8HP. Ch1+Ch4: rise/fall/cycle/vari-response with CV. Ch2+Ch3: attenuverters. SUM/OR/INV outputs.

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Toggle from '../controls/Toggle'
import Divider from '../../components/atoms/Divider'
import LED from '../controls/LED'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

const EOC_DURATION = 0.03

function MathsPanel({
  rise1, fall1, cycle1, vari1, rise2, fall2, cycle2, vari2, atten1, atten2, atten3, atten4,
  enabled, onToggle,
  onRise1, onFall1, onCycle1, onVari1, onRise2, onFall2, onCycle2, onVari2, onAtten1, onAtten2, onAtten3, onAtten4,
  id,
  trig1Conn, trig1Ref, sig1Conn, sig1Ref, riseCV1Conn, riseCV1Ref, fallCV1Conn, fallCV1Ref, bothCV1Conn, bothCV1Ref,
  out1Ref, eor1Ref, eoc1Ref,
  trig2Conn, trig2Ref, sig2Conn, sig2Ref, riseCV2Conn, riseCV2Ref, fallCV2Conn, fallCV2Ref, bothCV2Conn, bothCV2Ref,
  out2Ref, eor2Ref, eoc2Ref,
  in2Conn, in2Ref, in3Conn, in3Ref,
  cyc1Conn, cyc1Ref, cyc2Conn, cyc2Ref,
  out2chRef, out3chRef,
  eor1Active, eoc1Active, eor2Active, eoc2Active, orActive, invActive,
  sumRef, orRef, invRef,
}) {
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 4px' }

  return (
    <Module label="Maths" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', height: '100%', padding: '4px 2px' }}>

        {/* Left: Ch1 function generator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 3, flex: 1 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Toggle value={cycle1} onChange={onCycle1} label="cyc" size="sm" />
            <LabeledJack type="in" port="sig1" moduleId={id} active={sig1Conn} signalRef={sig1Ref} label="in" />
            <LabeledJack type="in" port="trig1" moduleId={id} active={trig1Conn} signalRef={trig1Ref} label="trig" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <JackSocket type="in" port="rCV1" moduleId={id} active={riseCV1Conn} signalRef={riseCV1Ref} />
              <Knob value={rise1} onChange={onRise1} label="rise" />
            </div>
            <LabeledJack type="in" port="bCV1" moduleId={id} active={bothCV1Conn} signalRef={bothCV1Ref} label="both" labelPosition="right" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <JackSocket type="in" port="fCV1" moduleId={id} active={fallCV1Conn} signalRef={fallCV1Ref} />
              <Knob value={fall1} onChange={onFall1} label="fall" />
            </div>
            <LabeledJack type="in" port="cyc1" moduleId={id} active={cyc1Conn} signalRef={cyc1Ref} label="cycle" labelPosition="right" />
          </div>
          <Knob value={vari1} onChange={onVari1} label="log/exp" />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <LED active={eor1Active} color="yellow" />
            <LabeledJack type="out" port="eor1" moduleId={id} signalRef={eor1Ref} label="eor" />
            <LabeledJack type="out" port="eoc1" moduleId={id} signalRef={eoc1Ref} label="eoc" />
            <LED active={eoc1Active} color="white" />
          </div>
        </div>

        {/* Center: ch1-4 attenuverters + bus outputs */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 3, padding: '0 6px' }}>
          <Knob value={atten1} onChange={onAtten1} label="1" bipolar />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <JackSocket type="in" port="in2" moduleId={id} active={in2Conn} signalRef={in2Ref} />
            <Knob value={atten2} onChange={onAtten2} label="2" bipolar />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Knob value={atten3} onChange={onAtten3} label="3" bipolar />
            <JackSocket type="in" port="in3" moduleId={id} active={in3Conn} signalRef={in3Ref} />
          </div>
          <Knob value={atten4} onChange={onAtten4} label="4" bipolar />
          <Divider />
          <div style={{ display: 'flex', gap: 4 }}>
            <LabeledJack type="out" port="out1" moduleId={id} signalRef={out1Ref} label="1" />
            <LabeledJack type="out" port="out2ch" moduleId={id} signalRef={out2chRef} label="2" />
            <LabeledJack type="out" port="out3ch" moduleId={id} signalRef={out3chRef} label="3" />
            <LabeledJack type="out" port="out2" moduleId={id} signalRef={out2Ref} label="4" />
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <LED active={orActive} color="red" />
            <LabeledJack type="out" port="or" moduleId={id} signalRef={orRef} label="or" />
            <LabeledJack type="out" port="sum" moduleId={id} signalRef={sumRef} label="sum" />
            <LabeledJack type="out" port="inv" moduleId={id} signalRef={invRef} label="inv" />
            <LED active={invActive} color="green" />
          </div>
        </div>

        {/* Right: Ch4 function generator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 3, flex: 1 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <LabeledJack type="in" port="trig2" moduleId={id} active={trig2Conn} signalRef={trig2Ref} label="trig" />
            <LabeledJack type="in" port="sig2" moduleId={id} active={sig2Conn} signalRef={sig2Ref} label="in" />
            <Toggle value={cycle2} onChange={onCycle2} label="cyc" size="sm" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Knob value={rise2} onChange={onRise2} label="rise" />
              <JackSocket type="in" port="rCV2" moduleId={id} active={riseCV2Conn} signalRef={riseCV2Ref} />
            </div>
            <LabeledJack type="in" port="bCV2" moduleId={id} active={bothCV2Conn} signalRef={bothCV2Ref} label="both" labelPosition="left" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Knob value={fall2} onChange={onFall2} label="fall" />
              <JackSocket type="in" port="fCV2" moduleId={id} active={fallCV2Conn} signalRef={fallCV2Ref} />
            </div>
            <LabeledJack type="in" port="cyc2" moduleId={id} active={cyc2Conn} signalRef={cyc2Ref} label="cycle" labelPosition="left" />
          </div>
          <Knob value={vari2} onChange={onVari2} label="log/exp" />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <LED active={eor2Active} color="white" />
            <LabeledJack type="out" port="eor2" moduleId={id} signalRef={eor2Ref} label="eor" />
            <LabeledJack type="out" port="eoc2" moduleId={id} signalRef={eoc2Ref} label="eoc" />
            <LED active={eoc2Active} color="yellow" />
          </div>
        </div>

      </div>
    </Module>
  )
}

const N = { current: null }

export default function MathsModule({ id = 'maths1', preview }) {
  if (preview) return <MathsPanel
    rise1={50} fall1={50} cycle1={false} vari1={50} rise2={50} fall2={50} cycle2={false} vari2={50} atten1={50} atten2={50} atten3={50} atten4={50}
    enabled={false} onToggle={() => {}}
    onRise1={() => {}} onFall1={() => {}} onCycle1={() => {}} onVari1={() => {}} onRise2={() => {}} onFall2={() => {}} onCycle2={() => {}} onVari2={() => {}} onAtten1={() => {}} onAtten2={() => {}} onAtten3={() => {}} onAtten4={() => {}}
    id={id}
    trig1Conn={false} trig1Ref={N} sig1Conn={false} sig1Ref={N} riseCV1Conn={false} riseCV1Ref={N} fallCV1Conn={false} fallCV1Ref={N} bothCV1Conn={false} bothCV1Ref={N}
    out1Ref={N} eor1Ref={N} eoc1Ref={N}
    trig2Conn={false} trig2Ref={N} sig2Conn={false} sig2Ref={N} riseCV2Conn={false} riseCV2Ref={N} fallCV2Conn={false} fallCV2Ref={N} bothCV2Conn={false} bothCV2Ref={N}
    out2Ref={N} eor2Ref={N} eoc2Ref={N}
    cyc1Conn={false} cyc1Ref={N} cyc2Conn={false} cyc2Ref={N}
    in2Conn={false} in2Ref={N} in3Conn={false} in3Ref={N}
    eor1Active={false} eoc1Active={false} eor2Active={false} eoc2Active={false} orActive={false} invActive={false}
    out2chRef={N} out3chRef={N}
    sumRef={N} orRef={N} invRef={N}
  />

  const [rise1, setRise1] = useState(50)
  const [fall1, setFall1] = useState(50)
  const [cycle1, setCycle1] = useState(false)
  const [vari1, setVari1] = useState(50)
  const [rise2, setRise2] = useState(50)
  const [fall2, setFall2] = useState(50)
  const [cycle2, setCycle2] = useState(false)
  const [vari2, setVari2] = useState(50)
  const [atten1, setAtten1] = useState(50)
  const [atten2, setAtten2] = useState(50)
  const [atten3, setAtten3] = useState(50)
  const [atten4, setAtten4] = useState(50)
  const [enabled, setEnabled] = useModuleEnabled()
  const [eor1Active, setEor1Active] = useState(false)
  const [eoc1Active, setEoc1Active] = useState(false)
  const [eor2Active, setEor2Active] = useState(false)
  const [eoc2Active, setEoc2Active] = useState(false)
  const [orActive, setOrActive] = useState(false)
  const [invActive, setInvActive] = useState(false)
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  const rise1Ref = useRef(50), fall1Ref = useRef(50), cycle1Ref = useRef(false), vari1Ref = useRef(50)
  const rise2Ref = useRef(50), fall2Ref = useRef(50), cycle2Ref = useRef(false), vari2Ref = useRef(50)
  const atten1Ref = useRef(50), atten2Ref = useRef(50), atten3Ref = useRef(50), atten4Ref = useRef(50)
  const cur1Ref = useRef(0), cur2Ref = useRef(0)
  const phase1Ref = useRef('idle'), phase2Ref = useRef('idle')
  const prevTrig1Ref = useRef(false), prevTrig2Ref = useRef(false)
  const eor1TimerRef = useRef(0), eoc1TimerRef = useRef(0)
  const eor2TimerRef = useRef(0), eoc2TimerRef = useRef(0)

  const trig1Ref = useRef(null), sig1Ref = useRef(null), out1Ref = useRef(null), eor1Ref = useRef(null), eoc1Ref = useRef(null)
  const riseCV1Ref = useRef(null), fallCV1Ref = useRef(null), bothCV1Ref = useRef(null)
  const trig2Ref = useRef(null), sig2Ref = useRef(null), out2Ref = useRef(null), eor2Ref = useRef(null), eoc2Ref = useRef(null)
  const riseCV2Ref = useRef(null), fallCV2Ref = useRef(null), bothCV2Ref = useRef(null)
  const cyc1Ref = useRef(null), cyc2Ref = useRef(null)
  const in2Ref = useRef(null), in3Ref = useRef(null)
  const out2chRef = useRef(null), out3chRef = useRef(null)
  const sumRef = useRef(null), orRef = useRef(null), invRef = useRef(null)

  enabledRef.current = enabled
  rise1Ref.current = rise1; fall1Ref.current = fall1; cycle1Ref.current = cycle1; vari1Ref.current = vari1
  rise2Ref.current = rise2; fall2Ref.current = fall2; cycle2Ref.current = cycle2; vari2Ref.current = vari2
  atten1Ref.current = atten1; atten2Ref.current = atten2; atten3Ref.current = atten3; atten4Ref.current = atten4

  const conns = routing?.connections || []
  const trig1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'trig1')
  const sig1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'sig1')
  const riseCV1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'rCV1')
  const fallCV1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'fCV1')
  const bothCV1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'bCV1')
  const trig2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'trig2')
  const sig2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'sig2')
  const riseCV2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'rCV2')
  const fallCV2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'fCV2')
  const bothCV2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'bCV2')
  const cyc1Conn = conns.some(c => c.toModuleId === id && c.toPort === 'cyc1')
  const cyc2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'cyc2')
  const in2Conn = conns.some(c => c.toModuleId === id && c.toPort === 'in2')
  const in3Conn = conns.some(c => c.toModuleId === id && c.toPort === 'in3')

  useModule({
    id,
    inputs: {
      trig1: { type: 'scalar' }, sig1: { type: 'scalar' }, cyc1: { type: 'scalar' },
      rCV1: { type: 'scalar' }, fCV1: { type: 'scalar' }, bCV1: { type: 'scalar' },
      trig2: { type: 'scalar' }, sig2: { type: 'scalar' }, cyc2: { type: 'scalar' },
      rCV2: { type: 'scalar' }, fCV2: { type: 'scalar' }, bCV2: { type: 'scalar' },
      in2: { type: 'scalar' }, in3: { type: 'scalar' },
    },
    outputs: {
      out1: { type: 'scalar' }, eor1: { type: 'scalar' }, eoc1: { type: 'scalar' },
      out2ch: { type: 'scalar' }, out3ch: { type: 'scalar' },
      out2: { type: 'scalar' }, eor2: { type: 'scalar' }, eoc2: { type: 'scalar' },
      sum: { type: 'scalar' }, or: { type: 'scalar' }, inv: { type: 'scalar' },
    },
    process: (inputs, dt) => {
      if (!enabledRef.current) {
        [out1Ref, eor1Ref, eoc1Ref, out2chRef, out3chRef, out2Ref, eor2Ref, eoc2Ref, sumRef, orRef, invRef].forEach(r => { r.current = null })
        return { out1: null, eor1: null, eoc1: null, out2ch: null, out3ch: null, out2: null, eor2: null, eoc2: null, sum: null, or: null, inv: null }
      }

      trig1Ref.current = inputs.trig1; sig1Ref.current = inputs.sig1; cyc1Ref.current = inputs.cyc1
      riseCV1Ref.current = inputs.rCV1; fallCV1Ref.current = inputs.fCV1; bothCV1Ref.current = inputs.bCV1
      trig2Ref.current = inputs.trig2; sig2Ref.current = inputs.sig2; cyc2Ref.current = inputs.cyc2
      riseCV2Ref.current = inputs.rCV2; fallCV2Ref.current = inputs.fCV2; bothCV2Ref.current = inputs.bCV2
      in2Ref.current = inputs.in2; in3Ref.current = inputs.in3

      function processChannel(trigIn, sigIn, cycIn, riseCVIn, fallCVIn, bothCVIn, curRef, phaseRef, prevTrigRef, eorTimerRef, eocTimerRef, riseKnob, fallKnob, cycleRef, variKnob) {
        const trigHigh = readScalar(trigIn) > 50
        if (trigHigh && !prevTrigRef.current) {
          phaseRef.current = 'rising'
          curRef.current = 0
        }
        prevTrigRef.current = trigHigh

        // Cycle or cycle input: start rising if idle
        const shouldCycle = cycleRef.current || (cycIn && readScalar(cycIn) > 50)
        if (shouldCycle && phaseRef.current === 'idle') {
          phaseRef.current = 'rising'
        }

        // CV modulation of rates
        const bothMod = bothCVIn ? (readScalar(bothCVIn) / 50 - 1) : 0
        const riseRate = Math.max(0.001, (0.01 + (riseKnob / 100) * 2) * (1 + bothMod + (riseCVIn ? (readScalar(riseCVIn) / 100) : 0)))
        const fallRate = Math.max(0.001, (0.01 + (fallKnob / 100) * 2) * (1 + bothMod + (fallCVIn ? (readScalar(fallCVIn) / 100) : 0)))

        // Vari-response: 0=log, 50=linear, 100=exp
        const variNorm = variKnob / 100
        const applyVari = (val) => {
          if (variNorm < 0.4) return Math.pow(val, 1 + (0.4 - variNorm) * 5) // log
          if (variNorm > 0.6) return Math.pow(val, 1 / (1 + (variNorm - 0.6) * 5)) // exp
          return val // linear
        }

        eorTimerRef.current = Math.max(0, eorTimerRef.current - dt)
        eocTimerRef.current = Math.max(0, eocTimerRef.current - dt)

        if (phaseRef.current === 'rising') {
          curRef.current += riseRate * dt * 10
          if (curRef.current >= 1) {
            curRef.current = 1
            phaseRef.current = 'falling'
            eorTimerRef.current = EOC_DURATION
          }
        } else if (phaseRef.current === 'falling') {
          curRef.current -= fallRate * dt * 10
          if (curRef.current <= 0) {
            curRef.current = 0
            eocTimerRef.current = EOC_DURATION
            const shouldCycle = cycleRef.current || (cycIn && readScalar(cycIn) > 50)
            phaseRef.current = shouldCycle ? 'rising' : 'idle'
          }
        } else if (sigIn) {
          // Slew limiter mode
          const target = readScalar(sigIn) / 100
          const diff = target - curRef.current
          if (diff > 0) curRef.current = Math.min(target, curRef.current + riseRate * dt * 10)
          else curRef.current = Math.max(target, curRef.current - fallRate * dt * 10)
        }

        return { val: applyVari(curRef.current) * 100, eor: eorTimerRef.current > 0 ? 100 : 0, eoc: eocTimerRef.current > 0 ? 100 : 0 }
      }

      const ch1 = processChannel(inputs.trig1, inputs.sig1, inputs.cyc1, inputs.rCV1, inputs.fCV1, inputs.bCV1, cur1Ref, phase1Ref, prevTrig1Ref, eor1TimerRef, eoc1TimerRef, rise1Ref.current, fall1Ref.current, cycle1Ref, vari1Ref.current)
      const ch4 = processChannel(inputs.trig2, inputs.sig2, inputs.cyc2, inputs.rCV2, inputs.fCV2, inputs.bCV2, cur2Ref, phase2Ref, prevTrig2Ref, eor2TimerRef, eoc2TimerRef, rise2Ref.current, fall2Ref.current, cycle2Ref, vari2Ref.current)

      // Channels 2+3: attenuverters (bipolar: 0=invert, 50=zero, 100=unity)
      const ch1atten = ch1.val * ((atten1Ref.current / 50) - 1)
      const ch2val = readScalar(inputs.in2) * ((atten2Ref.current / 50) - 1)
      const ch3val = readScalar(inputs.in3) * ((atten3Ref.current / 50) - 1)
      const ch4atten = ch4.val * ((atten4Ref.current / 50) - 1)
      const o2ch = scalar(Math.max(0, Math.min(100, 50 + ch2val)))
      const o3ch = scalar(Math.max(0, Math.min(100, 50 + ch3val)))
      out2chRef.current = o2ch; out3chRef.current = o3ch

      // Bus outputs
      const sumVal = Math.max(0, Math.min(100, ch1atten + ch2val + ch3val + ch4atten))
      const orVal = Math.max(Math.abs(ch1atten), Math.max(Math.abs(ch2val), Math.max(Math.abs(ch3val), Math.abs(ch4atten))))
      const invVal = 100 - sumVal

      const o1 = scalar(ch1.val), er1 = scalar(ch1.eor), ec1 = scalar(ch1.eoc)
      const o4 = scalar(ch4.val), er4 = scalar(ch4.eor), ec4 = scalar(ch4.eoc)
      const s = scalar(sumVal), o = scalar(orVal), inv = scalar(invVal)

      out1Ref.current = o1; eor1Ref.current = er1; eoc1Ref.current = ec1
      out2Ref.current = o4; eor2Ref.current = er4; eoc2Ref.current = ec4
      sumRef.current = s; orRef.current = o; invRef.current = inv

      setEor1Active(ch1.eor > 0); setEoc1Active(ch1.eoc > 0)
      setEor2Active(ch4.eor > 0); setEoc2Active(ch4.eoc > 0)
      setOrActive(orVal > 5); setInvActive(invVal > 5)

      return { out1: o1, eor1: er1, eoc1: ec1, out2ch: o2ch, out3ch: o3ch, out2: o4, eor2: er4, eoc2: ec4, sum: s, or: o, inv: inv }
    },
  })

  return <MathsPanel
    rise1={rise1} fall1={fall1} cycle1={cycle1} vari1={vari1} rise2={rise2} fall2={fall2} cycle2={cycle2} vari2={vari2} atten1={atten1} atten2={atten2} atten3={atten3} atten4={atten4}
    enabled={enabled} onToggle={() => setEnabled(!enabled)}
    onRise1={setRise1} onFall1={setFall1} onCycle1={setCycle1} onVari1={setVari1} onRise2={setRise2} onFall2={setFall2} onCycle2={setCycle2} onVari2={setVari2} onAtten1={setAtten1} onAtten2={setAtten2} onAtten3={setAtten3} onAtten4={setAtten4}
    id={id}
    trig1Conn={trig1Conn} trig1Ref={trig1Ref} sig1Conn={sig1Conn} sig1Ref={sig1Ref} riseCV1Conn={riseCV1Conn} riseCV1Ref={riseCV1Ref} fallCV1Conn={fallCV1Conn} fallCV1Ref={fallCV1Ref} bothCV1Conn={bothCV1Conn} bothCV1Ref={bothCV1Ref}
    out1Ref={out1Ref} eor1Ref={eor1Ref} eoc1Ref={eoc1Ref}
    trig2Conn={trig2Conn} trig2Ref={trig2Ref} sig2Conn={sig2Conn} sig2Ref={sig2Ref} riseCV2Conn={riseCV2Conn} riseCV2Ref={riseCV2Ref} fallCV2Conn={fallCV2Conn} fallCV2Ref={fallCV2Ref} bothCV2Conn={bothCV2Conn} bothCV2Ref={bothCV2Ref}
    out2Ref={out2Ref} eor2Ref={eor2Ref} eoc2Ref={eoc2Ref}
    cyc1Conn={cyc1Conn} cyc1Ref={cyc1Ref} cyc2Conn={cyc2Conn} cyc2Ref={cyc2Ref}
    in2Conn={in2Conn} in2Ref={in2Ref} in3Conn={in3Conn} in3Ref={in3Ref}
    eor1Active={eor1Active} eoc1Active={eoc1Active} eor2Active={eor2Active} eoc2Active={eoc2Active} orActive={orActive} invActive={invActive}
    out2chRef={out2chRef} out3chRef={out3chRef}
    sumRef={sumRef} orRef={orRef} invRef={invRef}
  />
}
