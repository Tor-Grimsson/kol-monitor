// JoystickModule — XY pad controller
// 8HP 1U. Draggable point on a square pad, outputs X and Y as scalars.

import { useState, useRef, useCallback } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Toggle from '../controls/Toggle'

function JoystickPanel({ x, y, z, snap, enabled, onToggle, onMove, onZChange, onSnapChange, id, xOutRef, yOutRef, zOutRef }) {
  const sliderRef = useRef(null)
  const padRef = useRef(null)

  const handlePointer = useCallback((e) => {
    const pad = padRef.current
    if (!pad) return
    const rect = pad.getBoundingClientRect()
    const nx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const ny = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    onMove(nx, ny)
  }, [onMove])

  const handleDown = useCallback((e) => {
    e.preventDefault()
    handlePointer(e)
    const onMoveEvt = (e) => handlePointer(e)
    const onUp = () => {
      if (snap) onMove(50, 50)
      window.removeEventListener('pointermove', onMoveEvt)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMoveEvt)
    window.addEventListener('pointerup', onUp)
  }, [handlePointer, snap, onMove])

  const handleSliderDown = useCallback((e) => {
    e.preventDefault()
    const el = sliderRef.current
    if (!el) return
    const update = (e) => {
      const rect = el.getBoundingClientRect()
      onZChange(Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100)))
    }
    update(e)
    const onUp = () => {
      if (snap) onZChange(50)
      window.removeEventListener('pointermove', update)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', update)
    window.addEventListener('pointerup', onUp)
  }, [onZChange, snap])

  return (
    <Module label="Joystick" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 4px' }}>
        {/* XYZ outputs + snap */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Toggle value={snap} onChange={onSnapChange} label="snap" size="sm" horizontal />
          <LabeledJack type="out" port="x" moduleId={id} signalRef={xOutRef} label="x" labelPosition="right" />
          <LabeledJack type="out" port="y" moduleId={id} signalRef={yOutRef} label="y" labelPosition="right" />
          <LabeledJack type="out" port="z" moduleId={id} signalRef={zOutRef} label="z" labelPosition="right" />
        </div>
        {/* XY pad */}
        <div
          ref={padRef}
          onPointerDown={handleDown}
          style={{
            width: 96, height: 96, flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
            position: 'relative',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        >
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.7)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        </div>
        {/* Z slider */}
        <div
          ref={sliderRef}
          onPointerDown={handleSliderDown}
          style={{ width: 10, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'ns-resize', touchAction: 'none' }}
        >
          <div style={{ width: 2, height: '100%', backgroundColor: 'rgba(255,255,255,0.15)', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              bottom: `calc(${z}% - 4px)`, left: -3,
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.7)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>
    </Module>
  )
}

export default function JoystickModule({ id = 'joy1', init, preview }) {
  if (preview) return <JoystickPanel x={50} y={50} z={50} snap={false} enabled={false} onToggle={() => {}} onMove={() => {}} onZChange={() => {}} onSnapChange={() => {}} id={id} xOutRef={{ current: null }} yOutRef={{ current: null }} zOutRef={{ current: null }} />

  const [x, setX] = useState(init?.x ?? 50)
  const [y, setY] = useState(init?.y ?? 50)
  const [z, setZ] = useState(init?.z ?? 50)
  const [snap, setSnap] = useState(init?.snap ?? true)
  const [enabled, setEnabled] = useModuleEnabled()

  const xRef = useRef(50)
  const yRef = useRef(50)
  const zRef = useRef(50)
  const xOutRef = useRef(null)
  const yOutRef = useRef(null)
  const zOutRef = useRef(null)

  xRef.current = x
  yRef.current = y
  zRef.current = z

  const handleMove = useCallback((nx, ny) => { setX(nx); setY(ny) }, [])

  useModule({
    id,
    inputs: {},
    outputs: { x: { type: 'scalar' }, y: { type: 'scalar' }, z: { type: 'scalar' } },
    process: () => {
      if (!enabled) { xOutRef.current = null; yOutRef.current = null; zOutRef.current = null; return { x: null, y: null, z: null } }
      const xOut = scalar(xRef.current)
      const yOut = scalar(yRef.current)
      const zOut = scalar(zRef.current)
      xOutRef.current = xOut
      yOutRef.current = yOut
      zOutRef.current = zOut
      return { x: xOut, y: yOut, z: zOut }
    },
  })

  return <JoystickPanel x={x} y={y} z={z} snap={snap} enabled={enabled} onToggle={() => setEnabled(!enabled)} onMove={handleMove} onZChange={setZ} onSnapChange={setSnap} id={id} xOutRef={xOutRef} yOutRef={yOutRef} zOutRef={zOutRef} />
}
