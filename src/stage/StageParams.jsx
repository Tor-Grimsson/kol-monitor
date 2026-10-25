// StageParams — the marked parameters, as a module on the stage (plan 16 W6.9, user 2026-10-24: "the sliders can route
// to a UI module type with those sliders? instead of a overlay modal with sliders"). The menu version is in
// `_tmp/2026-10-24-plan16/StageParams.menu.jsx`.
//
// Two jobs. It registers a HEADLESS MODULE (`STAGE_CV_ID`) whose outputs are `p0…pN`, one per mark, and the page
// patches those into the real CV inputs — so "show only these parameters" needs no injection path in the render
// loop: a fader is an ordinary signal source, and `readCv` merges it with the module's own knob exactly as a cable
// would. And it draws that set as a module panel: `ModuleFrame` + one vertical `Fader` per mark under its label,
// the Console's channel-strip shape.
//
// MARKING lives in the stage settings Rail (`MarkList`, below): it reads the LIVE REGISTRY — every module descriptor
// carries its declared `inputs`, and the ones tagged `cv` are exactly the parameters a fader can reach. Nothing is
// enumerated per module — a new module's CV inputs appear in the list the moment it is in the patch.

import { useEffect, useRef, useState } from 'react'
import { LabeledControlSection, SettingsRow, SettingsSwitch } from '@kolkrabbi/kol-component/organisms/SettingsPanel'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { scalar } from '../hooks/signals'
import { MODULE_DEFS } from '../modules/registry'
import { STAGE_CV_ID } from '../data/stages'
import { hpToPx, ROW_HEIGHT } from '../modules/utility/eurorack'
import ModuleFrame from '../modules/utility/ModuleFrame.jsx'
import Fader from '../modules/parametric/Fader.jsx'

const markKey = (m) => `${m.module}.${m.port}`

/* one fader is 2HP; the panel never narrower than 4HP */
const FADER_HP = 2

export default function StageParams({ marks }) {
  const registry = useModuleRegistry()
  const [values, setValues] = useState({})

  const marksRef = useRef(marks)
  marksRef.current = marks
  const valuesRef = useRef(values)
  valuesRef.current = values

  // One headless module with one output per mark. Re-registers when the mark
  // set changes, because the output shape changes with it.
  useEffect(() => {
    const outputs = {}
    marks.forEach((_, i) => { outputs[`p${i}`] = { type: 'scalar' } })
    registry.register({
      id: STAGE_CV_ID,
      inputs: {},
      outputs,
      process: () => {
        const out = {}
        const list = marksRef.current
        const vals = valuesRef.current
        for (let i = 0; i < list.length; i++) {
          const m = list[i]
          out[`p${i}`] = scalar(vals[markKey(m)] ?? m.value ?? 0)
        }
        return out
      },
    })
    return () => registry.unregister(STAGE_CV_ID)
  }, [registry, marks])

  if (marks.length === 0) return null
  return (
    <div data-stage-cv style={{ width: hpToPx(Math.max(4, marks.length * FADER_HP)), height: ROW_HEIGHT['3u'] }}>
      <ModuleFrame label="stage cv">
        <div className="flex h-full justify-around">
          {marks.map(m => (
            <div key={markKey(m)} className="flex h-full flex-col items-center" style={{ width: hpToPx(FADER_HP) }}>
              <div className="flex flex-1 items-stretch py-4">
                <Fader
                  value={values[markKey(m)] ?? m.value ?? 0}
                  onChange={v => setValues(prev => ({ ...prev, [markKey(m)]: v }))}
                  min={m.min ?? 0}
                  max={m.max ?? 100}
                  direction="vertical"
                  height="100%"
                />
              </div>
              <span className="kol-mono-8 uppercase text-fg-48 text-center leading-tight">{m.label}</span>
            </div>
          ))}
        </div>
      </ModuleFrame>
    </div>
  )
}

/* THE MARK LIST — every CV input in the patch, one switch each, grouped by module, for the stage settings Rail */
export function MarkList({ marks, onMarks, rows }) {
  const registry = useModuleRegistry()
  const groups = []
  for (const row of rows) {
    for (const mod of row.modules) {
      const desc = registry.modulesRef.current.get(mod.id)
      if (!desc) continue
      const label = MODULE_DEFS[mod.type]?.label || mod.type
      const ports = Object.entries(desc.inputs || {}).filter(([, meta]) => meta?.cv).map(([port]) => ({ module: mod.id, port, label: `${label} ${port}` }))
      if (ports.length) groups.push({ id: mod.id, label, ports })
    }
  }
  const toggle = (cand) => {
    const k = markKey(cand)
    onMarks(marks.some(m => markKey(m) === k) ? marks.filter(m => markKey(m) !== k) : [...marks, cand])
  }
  return groups.map(g => (
    <LabeledControlSection key={g.id} label={g.label}>
      {g.ports.map(c => (
        <SettingsRow key={markKey(c)} label={c.port}>
          <SettingsSwitch on={marks.some(m => markKey(m) === markKey(c))} onChange={() => toggle(c)} label={c.label} />
        </SettingsRow>
      ))}
    </LabeledControlSection>
  ))
}
