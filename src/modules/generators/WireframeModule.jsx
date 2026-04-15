// WireframeModule — parametric 3D geometry → projected 2D points
// 8HP

import { useState, useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { points, readScalar, readCv } from '../../hooks/signals'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import CvKnob from '../controls/CvKnob'
import Toggle from '../controls/Toggle'
import IconSelect from '../controls/IconSelect'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

const SHAPES = ['cube', 'tetra', 'octa', 'ico', 'sphere', 'torus', 'cyl']

function generateGeometry(shape, res) {
  switch (shape) {
    case 'cube': return {
      vertices: [
        [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
        [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
      ],
      edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],
    }
    case 'tetra': return {
      vertices: [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],
      edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],
    }
    case 'octa': return {
      vertices: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
      edges: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]],
    }
    case 'ico': {
      const t = (1 + Math.sqrt(5)) / 2
      const n = 1 / Math.sqrt(1 + t * t)
      const v = [
        [-n, t*n, 0], [n, t*n, 0], [-n, -t*n, 0], [n, -t*n, 0],
        [0, -n, t*n], [0, n, t*n], [0, -n, -t*n], [0, n, -t*n],
        [t*n, 0, -n], [t*n, 0, n], [-t*n, 0, -n], [-t*n, 0, n],
      ]
      return { vertices: v, edges: [
        [0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],
        [2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],
        [4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],[7,8],[7,10],[8,9],[9,5],
      ]}
    }
    case 'sphere': {
      const rings = Math.max(4, Math.round(res / 4))
      const segs = Math.max(6, Math.round(res / 2))
      const pts = []
      const edges = []
      for (let i = 0; i <= rings; i++) {
        const theta = (i / rings) * Math.PI
        for (let j = 0; j < segs; j++) {
          const phi = (j / segs) * Math.PI * 2
          pts.push([Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)])
          const idx = i * segs + j
          if (j > 0) edges.push([idx - 1, idx])
          if (j === segs - 1) edges.push([idx, i * segs])
          if (i > 0) edges.push([idx, idx - segs])
        }
      }
      return { vertices: pts, edges }
    }
    case 'torus': {
      const rings = Math.max(6, Math.round(res / 3))
      const segs = Math.max(4, Math.round(res / 4))
      const R = 1, r = 0.4
      const pts = []
      const edges = []
      for (let i = 0; i < rings; i++) {
        const theta = (i / rings) * Math.PI * 2
        for (let j = 0; j < segs; j++) {
          const phi = (j / segs) * Math.PI * 2
          pts.push([
            (R + r * Math.cos(phi)) * Math.cos(theta),
            r * Math.sin(phi),
            (R + r * Math.cos(phi)) * Math.sin(theta),
          ])
          const idx = i * segs + j
          const next = i * segs + (j + 1) % segs
          edges.push([idx, next])
          const below = ((i + 1) % rings) * segs + j
          edges.push([idx, below])
        }
      }
      return { vertices: pts, edges }
    }
    case 'cyl': {
      const segs = Math.max(6, Math.round(res / 2))
      const pts = []
      const edges = []
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2
        const x = Math.cos(a), z = Math.sin(a)
        pts.push([x, 1, z])
        pts.push([x, -1, z])
        const t = i * 2, b = i * 2 + 1
        const nt = ((i + 1) % segs) * 2
        edges.push([t, b])
        edges.push([t, nt])
        edges.push([b, nt + 1])
      }
      return { vertices: pts, edges }
    }
    default: return { vertices: [], edges: [] }
  }
}

// Combined rotation matrix — 6 trig calls total instead of 6 per vertex
function buildRotationMatrix(rx, ry, rz) {
  const cx = Math.cos(rx), sx = Math.sin(rx)
  const cy = Math.cos(ry), sy = Math.sin(ry)
  const cz = Math.cos(rz), sz = Math.sin(rz)
  return [
    cy * cz,                    cy * sz,                   -sy,
    sx * sy * cz - cx * sz,     sx * sy * sz + cx * cz,     sx * cy,
    cx * sy * cz + sx * sz,     cx * sy * sz - sx * cz,     cx * cy,
  ]
}

function transformAndProject(v, m, s, fov) {
  const x = v[0] * s, y = v[1] * s, z = v[2] * s
  const rx = m[0] * x + m[1] * y + m[2] * z
  const ry = m[3] * x + m[4] * y + m[5] * z
  const rz = m[6] * x + m[7] * y + m[8] * z
  const scale = fov / (fov + rz)
  return { x: 0.5 + rx * scale * 0.3, y: 0.5 + ry * scale * 0.3 }
}

function WireframePanel({ shape, rxVal, ryVal, rzVal, speed, scale, resolution, fov, animate, grid, enabled, onToggle, onShapeChange, onRxChange, onRyChange, onRzChange, onSpeedChange, onScaleChange, onResolutionChange, onFovChange, onAnimateChange, onGridChange, onReset, id, rxConn, rxRef, ryConn, ryRef, rzConn, rzRef, spdConn, spdRef, sclConn, sclRef, resConn, resRef, fovConn, fovRef, clrConn, clrRef, clkConn, clkRef, outRef }) {
  return (
    <Module label="Gen 3D" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: 4, padding: '2px 4px' }}>
        <IconSelect value={shape} onChange={onShapeChange} columns={4} items={[
          { value: 'cube', icon: 'shape-cube', label: 'Cube' },
          { value: 'tetra', icon: 'shape-tetra', label: 'Tetra' },
          { value: 'octa', icon: 'shape-octa', label: 'Octa' },
          { value: 'ico', icon: 'shape-ico', label: 'Icosahedron' },
          { value: 'sphere', icon: 'shape-sphere', label: 'Sphere' },
          { value: 'torus', icon: 'shape-torus', label: 'Torus' },
          { value: 'cyl', icon: 'shape-cyl', label: 'Cylinder' },
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 8, justifyContent: 'center', alignItems: 'flex-end' }}>
          <CvKnob port="rx" moduleId={id} active={rxConn} signalRef={rxRef} value={rxVal} onChange={onRxChange} label="rx" direction="vertical" />
          <CvKnob port="ry" moduleId={id} active={ryConn} signalRef={ryRef} value={ryVal} onChange={onRyChange} label="ry" direction="vertical" />
          <CvKnob port="rz" moduleId={id} active={rzConn} signalRef={rzRef} value={rzVal} onChange={onRzChange} label="rz" direction="vertical" />
          <CvKnob port="spd" moduleId={id} active={spdConn} signalRef={spdRef} value={speed} onChange={onSpeedChange} label="spd" direction="vertical" />
          <CvKnob port="scl" moduleId={id} active={sclConn} signalRef={sclRef} value={scale} onChange={onScaleChange} label="scl" direction="vertical" />
          <CvKnob port="res" moduleId={id} active={resConn} signalRef={resRef} value={resolution} onChange={onResolutionChange} label="res" direction="vertical" />
          <CvKnob port="fov" moduleId={id} active={fovConn} signalRef={fovRef} value={fov} onChange={onFovChange} label="fov" direction="vertical" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Toggle value={animate} onChange={onAnimateChange} label="ani" size="sm" horizontal />
          <Toggle value={grid} onChange={onGridChange} label="xyz" size="sm" horizontal />
          <Toggle momentary onChange={onReset} label="rst" size="sm" horizontal />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <LabeledJack type="in" port="clr" moduleId={id} active={clrConn} signalRef={clrRef} label="clr" />
          <LabeledJack type="in" port="clk" moduleId={id} active={clkConn} signalRef={clkRef} label="clk" />
          <LabeledJack type="out" port="out" moduleId={id} signalRef={outRef} label="out" />
        </div>
      </div>
    </Module>
  )
}

export default function WireframeModule({ id = 'wire1', init, preview }) {
  if (preview) return <WireframePanel shape="cube" rxVal={50} ryVal={50} rzVal={50} speed={50} scale={50} resolution={50} fov={50} animate={false} grid={false} enabled={false} onToggle={() => {}} onShapeChange={() => {}} onRxChange={() => {}} onRyChange={() => {}} onRzChange={() => {}} onSpeedChange={() => {}} onScaleChange={() => {}} onResolutionChange={() => {}} onFovChange={() => {}} onAnimateChange={() => {}} onGridChange={() => {}} onReset={() => {}} id={id} rxConn={false} rxRef={{ current: null }} ryConn={false} ryRef={{ current: null }} rzConn={false} rzRef={{ current: null }} spdConn={false} spdRef={{ current: null }} sclConn={false} sclRef={{ current: null }} resConn={false} resRef={{ current: null }} fovConn={false} fovRef={{ current: null }} clrConn={false} clrRef={{ current: null }} clkConn={false} clkRef={{ current: null }} outRef={{ current: null }} />

  const [shape, setShape] = useState(init?.shape ?? 'cube')
  const [rxVal, setRxVal] = useState(init?.rxVal ?? 50)
  const [ryVal, setRyVal] = useState(init?.ryVal ?? 50)
  const [rzVal, setRzVal] = useState(init?.rzVal ?? 50)
  const [animate, setAnimate] = useState(init?.animate ?? false)
  const [grid, setGrid] = useState(init?.grid ?? false)
  const [speed, setSpeed] = useState(init?.speed ?? 50)
  const [scale, setScale] = useState(init?.scale ?? 50)
  const [resolution, setResolution] = useState(init?.resolution ?? 50)
  const [fov, setFov] = useState(init?.fov ?? 50)
  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const shapeRef = useRef('cube')
  const rxValRef = useRef(50)
  const ryValRef = useRef(50)
  const rzValRef = useRef(50)
  const animateRef = useRef(false)
  const gridRef = useRef(false)
  const speedRef = useRef(50)
  const scaleRef = useRef(50)
  const resRef = useRef(50)
  const fovRef = useRef(50)
  const prevClkRef = useRef(false)
  const rotRef = useRef({ x: 0, y: 0, z: 0 })
  const geomCacheRef = useRef(null)
  const geomKeyRef = useRef('')
  const outRef = useRef(null)
  const rxCvRef = useRef(null)
  const ryCvRef = useRef(null)
  const rzCvRef = useRef(null)
  const spdCvRef = useRef(null)
  const sclCvRef = useRef(null)
  const resCvRef = useRef(null)
  const fovCvRef = useRef(null)
  const clrCvRef = useRef(null)
  const clkCvRef = useRef(null)

  enabledRef.current = enabled
  shapeRef.current = shape
  rxValRef.current = rxVal
  ryValRef.current = ryVal
  rzValRef.current = rzVal
  animateRef.current = animate
  gridRef.current = grid
  speedRef.current = speed
  scaleRef.current = scale
  resRef.current = resolution
  fovRef.current = fov

  const handleReset = () => { rotRef.current = { x: 0, y: 0, z: 0 }; setRxVal(50); setRyVal(50); setRzVal(50) }

  const rxConn = cp.has('rx')
  const ryConn = cp.has('ry')
  const rzConn = cp.has('rz')
  const spdConn = cp.has('spd')
  const sclConn = cp.has('scl')
  const resConn = cp.has('res')
  const fovConn = cp.has('fov')
  const clrConn = cp.has('clr')
  const clkConn = cp.has('clk')

  const saveStateRef = useRef({})
  saveStateRef.current = { shape, rxVal, ryVal, rzVal, speed, scale, resolution, fov, animate, grid }

  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      rx: { type: 'scalar' }, ry: { type: 'scalar' }, rz: { type: 'scalar' },
      spd: { type: 'scalar' }, scl: { type: 'scalar' }, res: { type: 'scalar' },
      fov: { type: 'scalar' }, clr: { type: 'color' }, clk: { type: 'scalar' },
    },
    outputs: { out: { type: 'points' } },
    process: (inputs, dt, t) => {
      if (!enabledRef.current) { outRef.current = null; return { out: null } }
      clrCvRef.current = inputs.clr
      rxCvRef.current = inputs.rx
      ryCvRef.current = inputs.ry
      rzCvRef.current = inputs.rz
      spdCvRef.current = inputs.spd
      sclCvRef.current = inputs.scl
      resCvRef.current = inputs.res
      fovCvRef.current = inputs.fov
      clkCvRef.current = inputs.clk

      const clkHigh = readScalar(inputs.clk) > 0
      if (clkHigh && !prevClkRef.current) rotRef.current = { x: 0, y: 0, z: 0 }
      prevClkRef.current = clkHigh

      const rate = readCv(inputs.spd, speedRef.current) / 50
      if (animateRef.current) {
        rotRef.current.x += dt * rate * 0.7
        rotRef.current.y += dt * rate
        rotRef.current.z += dt * rate * 0.3
      }

      const rx = (readCv(inputs.rx, rxValRef.current) - 50) / 50 * Math.PI + rotRef.current.x
      const ry = (readCv(inputs.ry, ryValRef.current) - 50) / 50 * Math.PI + rotRef.current.y
      const rz = (readCv(inputs.rz, rzValRef.current) - 50) / 50 * Math.PI + rotRef.current.z

      const s = readCv(inputs.scl, scaleRef.current) / 50
      const res = Math.round(8 + (readCv(inputs.res, resRef.current) / 100) * 56)
      const f = 1 + (readCv(inputs.fov, fovRef.current) / 100) * 5

      const geomKey = shapeRef.current + ':' + res
      if (geomKey !== geomKeyRef.current) {
        geomCacheRef.current = generateGeometry(shapeRef.current, res)
        geomKeyRef.current = geomKey
      }
      const geom = geomCacheRef.current
      const m = buildRotationMatrix(rx, ry, rz)
      const projected = geom.vertices.map(v => transformAndProject(v, m, s, f))

      const out = points(projected, geom.edges)
      out.aspectLock = true
      out.strokeWidth = 1

      // XYZ axis lines with per-axis color
      if (gridRef.current) {
        const axisLen = s * 1.5
        const axisColors = [
          { v: [[-axisLen,0,0],[axisLen,0,0]], color: {r:1, g:0.2, b:0.2} },
          { v: [[0,-axisLen,0],[0,axisLen,0]], color: {r:0.2, g:1, b:0.2} },
          { v: [[0,0,-axisLen],[0,0,axisLen]], color: {r:0.2, g:0.4, b:1} },
        ]
        out.axes = axisColors.map(({ v, color }) => ({
          pts: v.map(p => transformAndProject(p, m, 1, f)),
          color,
        }))
      }
      if (inputs.clr?.type === 'color') out.color = inputs.clr.value
      outRef.current = out
      return { out }
    },
  })

  return <WireframePanel shape={shape} rxVal={rxVal} ryVal={ryVal} rzVal={rzVal} speed={speed} scale={scale} resolution={resolution} fov={fov} animate={animate} grid={grid} enabled={enabled} onToggle={() => setEnabled(!enabled)} onShapeChange={setShape} onRxChange={setRxVal} onRyChange={setRyVal} onRzChange={setRzVal} onSpeedChange={setSpeed} onScaleChange={setScale} onResolutionChange={setResolution} onFovChange={setFov} onAnimateChange={setAnimate} onGridChange={setGrid} onReset={handleReset} id={id} rxConn={rxConn} rxRef={rxCvRef} ryConn={ryConn} ryRef={ryCvRef} rzConn={rzConn} rzRef={rzCvRef} spdConn={spdConn} spdRef={spdCvRef} sclConn={sclConn} sclRef={sclCvRef} resConn={resConn} resRef={resCvRef} fovConn={fovConn} fovRef={fovCvRef} clrConn={clrConn} clrRef={clrCvRef} clkConn={clkConn} clkRef={clkCvRef} outRef={outRef} />
}
