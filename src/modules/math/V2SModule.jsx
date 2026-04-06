// V2S — Visual to Scalar converter
// 4HP 1U. Takes points input, outputs scalar analysis values.
// Outputs: CNT (point count), X (center of mass X), Y (center of mass Y), AREA (bounding box area).

import { useRef } from 'react'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { scalar } from '../../hooks/signals'
import Module from '../utility/Module'
import Divider from '../../components/atoms/Divider'
import LabeledJack from '../controls/LabeledJack'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'

function V2SPanel({ enabled, onToggle, id, inConn, inRef, cntRef, xRef, yRef, areaRef }) {
  return (
    <Module label="V2S" enabled={enabled} onToggle={onToggle} u={1}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '4px 4px', gap: 4 }}>
        <LabeledJack type="in" port="in" moduleId={id} active={inConn} signalRef={inRef} label="in" labelPosition="right" />
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <LabeledJack type="out" port="cnt" moduleId={id} signalRef={cntRef} label="cnt" />
          <LabeledJack type="out" port="x" moduleId={id} signalRef={xRef} label="x" />
          <LabeledJack type="out" port="y" moduleId={id} signalRef={yRef} label="y" />
          <LabeledJack type="out" port="area" moduleId={id} signalRef={areaRef} label="area" />
        </div>
      </div>
    </Module>
  )
}

export default function V2SModule({ id = 'v2s1', init, preview }) {
  if (preview) return <V2SPanel enabled={false} onToggle={() => {}} id={id} inConn={false} inRef={{ current: null }} cntRef={{ current: null }} xRef={{ current: null }} yRef={{ current: null }} areaRef={{ current: null }} />

  const [enabled, setEnabled] = useModuleEnabled()
  const cp = useConnectedPorts(id)

  const enabledRef = useRef(true)
  const inRef = useRef(null)
  const cntRef = useRef(null)
  const xRef = useRef(null)
  const yRef = useRef(null)
  const areaRef = useRef(null)

  enabledRef.current = enabled

  const inConn = cp.has('in')

  useModule({
    id,
    inputs: { in: { type: 'points' } },
    outputs: { cnt: { type: 'scalar' }, x: { type: 'scalar' }, y: { type: 'scalar' }, area: { type: 'scalar' } },
    process: (inputs) => {
      if (!enabledRef.current) {
        cntRef.current = null; xRef.current = null; yRef.current = null; areaRef.current = null
        return { cnt: null, x: null, y: null, area: null }
      }
      inRef.current = inputs.in

      const pts = inputs.in?.type === 'points' ? inputs.in.value : null

      if (!pts || pts.length === 0) {
        const z = scalar(0)
        cntRef.current = z; xRef.current = z; yRef.current = z; areaRef.current = z
        return { cnt: z, x: z, y: z, area: z }
      }

      // Point count — scaled to 0-100 (saturates at 500 points)
      const cnt = scalar(Math.min(100, (pts.length / 500) * 100))

      // Center of mass
      let sumX = 0, sumY = 0
      for (let i = 0; i < pts.length; i++) {
        sumX += pts[i].x
        sumY += pts[i].y
      }
      const comX = scalar((sumX / pts.length) * 100)
      const comY = scalar((sumY / pts.length) * 100)

      // Bounding box area
      let minX = 1, maxX = 0, minY = 1, maxY = 0
      for (let i = 0; i < pts.length; i++) {
        if (pts[i].x < minX) minX = pts[i].x
        if (pts[i].x > maxX) maxX = pts[i].x
        if (pts[i].y < minY) minY = pts[i].y
        if (pts[i].y > maxY) maxY = pts[i].y
      }
      const area = scalar(Math.min(100, (maxX - minX) * (maxY - minY) * 100))

      cntRef.current = cnt; xRef.current = comX; yRef.current = comY; areaRef.current = area
      return { cnt, x: comX, y: comY, area }
    },
  })

  return <V2SPanel enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id} inConn={inConn} inRef={inRef} cntRef={cntRef} xRef={xRef} yRef={yRef} areaRef={areaRef} />
}
