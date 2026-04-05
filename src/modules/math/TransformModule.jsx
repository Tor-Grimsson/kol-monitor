// TransformModule — 2D/3D transform on points signals
// 8HP — translate, scale, rotate XYZ with CV inputs
// X/Y rotation simulates 3D via projection

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar } from '../../hooks/signals'
import Module from '../utility/Module'
import JackSocket from '../utility/JackSocket'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'

function TransformPanel({ posX, posY, scale, rotX, rotY, rotZ, enabled, onToggle, onPosXChange, onPosYChange, onScaleChange, onRotXChange, onRotYChange, onRotZChange, id, inConn, inRef, xConn, xInRef, yConn, yInRef, sConn, sInRef, rxConn, rxInRef, ryConn, ryInRef, rzConn, rzInRef, outRef }) {
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '0 2px' }

  return (
    <Module label="Xform" enabled={enabled} onToggle={onToggle}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', padding: '4px 0',
      }}>
        <div style={rowStyle}>
          <JackSocket type="in" port="x" moduleId={id} active={xConn} signalRef={xInRef} size="sm" />
          <Knob value={posX} onChange={onPosXChange} label="x" />
        </div>
        <div style={rowStyle}>
          <JackSocket type="in" port="y" moduleId={id} active={yConn} signalRef={yInRef} size="sm" />
          <Knob value={posY} onChange={onPosYChange} label="y" />
        </div>
        <div style={rowStyle}>
          <JackSocket type="in" port="s" moduleId={id} active={sConn} signalRef={sInRef} size="sm" />
          <Knob value={scale} onChange={onScaleChange} label="scl" />
        </div>
        <div style={rowStyle}>
          <JackSocket type="in" port="rx" moduleId={id} active={rxConn} signalRef={rxInRef} size="sm" />
          <Knob value={rotX} onChange={onRotXChange} label="rX" />
        </div>
        <div style={rowStyle}>
          <JackSocket type="in" port="ry" moduleId={id} active={ryConn} signalRef={ryInRef} size="sm" />
          <Knob value={rotY} onChange={onRotYChange} label="rY" />
        </div>
        <div style={rowStyle}>
          <JackSocket type="in" port="rz" moduleId={id} active={rzConn} signalRef={rzInRef} size="sm" />
          <Knob value={rotZ} onChange={onRotZChange} label="rZ" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function TransformModule({ id = 'xfm1', init, preview }) {
  if (preview) return <TransformPanel posX={50} posY={50} scale={50} rotX={0} rotY={0} rotZ={0} enabled={false} onToggle={() => {}} onPosXChange={() => {}} onPosYChange={() => {}} onScaleChange={() => {}} onRotXChange={() => {}} onRotYChange={() => {}} onRotZChange={() => {}} id={id} inConn={false} inRef={{ current: null }} xConn={false} xInRef={{ current: null }} yConn={false} yInRef={{ current: null }} sConn={false} sInRef={{ current: null }} rxConn={false} rxInRef={{ current: null }} ryConn={false} ryInRef={{ current: null }} rzConn={false} rzInRef={{ current: null }} outRef={{ current: null }} />

  const [posX, setPosX] = useState(init?.posX ?? 50)
  const [posY, setPosY] = useState(init?.posY ?? 50)
  const [scale, setScale] = useState(init?.scale ?? 50)
  const [rotX, setRotX] = useState(init?.rotX ?? 0)
  const [rotY, setRotY] = useState(init?.rotY ?? 0)
  const [rotZ, setRotZ] = useState(init?.rotZ ?? 0)
  const [enabled, setEnabled] = useModuleEnabled()
  const routing = usePatchRouting()

  const enabledRef = useRef(true)
  const posXRef = useRef(50)
  const posYRef = useRef(50)
  const scaleRef = useRef(50)
  const rotXRef = useRef(0)
  const rotYRef = useRef(0)
  const rotZRef = useRef(0)
  const outRef = useRef(null)
  const inRef = useRef(null)
  const xInRef = useRef(null)
  const yInRef = useRef(null)
  const sInRef = useRef(null)
  const rxInRef = useRef(null)
  const ryInRef = useRef(null)
  const rzInRef = useRef(null)

  enabledRef.current = enabled
  posXRef.current = posX
  posYRef.current = posY
  scaleRef.current = scale
  rotXRef.current = rotX
  rotYRef.current = rotY
  rotZRef.current = rotZ

  const conns = routing?.connections || []
  const inConn = conns.some(c => c.toModuleId === id && c.toPort === 'in')
  const xConn = conns.some(c => c.toModuleId === id && c.toPort === 'x')
  const yConn = conns.some(c => c.toModuleId === id && c.toPort === 'y')
  const sConn = conns.some(c => c.toModuleId === id && c.toPort === 's')
  const rxConn = conns.some(c => c.toModuleId === id && c.toPort === 'rx')
  const ryConn = conns.some(c => c.toModuleId === id && c.toPort === 'ry')
  const rzConn = conns.some(c => c.toModuleId === id && c.toPort === 'rz')

  useModule({
    id,
    inputs: {
      in: { type: 'points' },
      x: { type: 'scalar' },
      y: { type: 'scalar' },
      s: { type: 'scalar' },
      rx: { type: 'scalar' },
      ry: { type: 'scalar' },
      rz: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      inRef.current = inputs.in
      xInRef.current = inputs.x
      yInRef.current = inputs.y
      sInRef.current = inputs.s
      rxInRef.current = inputs.rx
      ryInRef.current = inputs.ry
      rzInRef.current = inputs.rz

      if (!inputs.in || inputs.in.type !== 'points') {
        outRef.current = null
        return { out: null }
      }

      const tx = ((inputs.x ? readScalar(inputs.x) : posXRef.current) - 50) / 50
      const ty = ((inputs.y ? readScalar(inputs.y) : posYRef.current) - 50) / 50
      const s = (inputs.s ? readScalar(inputs.s) : scaleRef.current) / 50
      const ax = (inputs.rx ? readScalar(inputs.rx) : rotXRef.current) / 100 * Math.PI * 2
      const ay = (inputs.ry ? readScalar(inputs.ry) : rotYRef.current) / 100 * Math.PI * 2
      const az = (inputs.rz ? readScalar(inputs.rz) : rotZRef.current) / 100 * Math.PI * 2

      const cosX = Math.cos(ax), sinX = Math.sin(ax)
      const cosY = Math.cos(ay), sinY = Math.sin(ay)
      const cosZ = Math.cos(az), sinZ = Math.sin(az)

      const srcPts = inputs.in.value
      const transformed = srcPts.map(pt => {
        let cx = pt.x - 0.5
        let cy = pt.y - 0.5
        let cz = 0

        // Rotate X axis (tilts forward/back)
        let y1 = cy * cosX - cz * sinX
        let z1 = cy * sinX + cz * cosX

        // Rotate Y axis (turns left/right)
        let x2 = cx * cosY + z1 * sinY
        let z2 = -cx * sinY + z1 * cosY

        // Rotate Z axis (spins flat)
        let x3 = x2 * cosZ - y1 * sinZ
        let y3 = x2 * sinZ + y1 * cosZ

        // Perspective projection (simple, fov=3)
        const pScale = 3 / (3 + z2)

        return {
          x: x3 * pScale * s + 0.5 + tx * 0.5,
          y: y3 * pScale * s + 0.5 + ty * 0.5,
        }
      })

      const out = points(transformed, inputs.in.edges)
      // Preserve metadata from input signal
      if (inputs.in.strokeWidth != null) out.strokeWidth = inputs.in.strokeWidth
      if (inputs.in.fill) out.fill = inputs.in.fill
      if (inputs.in.grid) out.grid = inputs.in.grid
      if (inputs.in.aspectLock) out.aspectLock = inputs.in.aspectLock
      if (inputs.in.opacity != null) out.opacity = inputs.in.opacity
      outRef.current = out
      return { out }
    },
  })

  return <TransformPanel posX={posX} posY={posY} scale={scale} rotX={rotX} rotY={rotY} rotZ={rotZ} enabled={enabled} onToggle={() => setEnabled(!enabled)} onPosXChange={setPosX} onPosYChange={setPosY} onScaleChange={setScale} onRotXChange={setRotX} onRotYChange={setRotY} onRotZChange={setRotZ} id={id} inConn={inConn} inRef={inRef} xConn={xConn} xInRef={xInRef} yConn={yConn} yInRef={yInRef} sConn={sConn} sInRef={sInRef} rxConn={rxConn} rxInRef={rxInRef} ryConn={ryConn} ryInRef={ryInRef} rzConn={rzConn} rzInRef={rzInRef} outRef={outRef} />
}
