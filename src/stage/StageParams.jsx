// StageParams — the marked parameters, in a DS menu.
//
// Two jobs in one place. It registers a HEADLESS MODULE (`STAGE_CV_ID`) whose
// outputs are `p0…pN`, one per mark, and the page patches those into the real
// CV inputs — so "show only these parameters" needs no injection path in the
// render loop: a fader is an ordinary signal source, and `readCv` merges it
// with the module's own knob exactly as a cable would.
//
// And it renders that set through kol-component: `MenuItem`'s trigger + popover
// panel, DS `Slider` rows, `MenuDropdownNest` for the mark list. No hand-rolled
// panel, no inline chrome (user, 2026-08-28).
//
// MARKING reads the LIVE REGISTRY: every module descriptor carries its declared
// `inputs`, and the ones tagged `cv` are exactly the parameters a fader can
// reach. Nothing is enumerated per module — a new module's CV inputs appear in
// the list the moment it is in the patch.

import { useEffect, useRef, useState } from 'react'
import { MenuItem, MenuDropdownItem, MenuDropdownDivider, MenuDropdownNest } from '@kolkrabbi/kol-component/molecules/MenuItem'
import Slider from '@kolkrabbi/kol-component/molecules/Slider'
import { Icon } from '@kolkrabbi/kol-icons'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { scalar } from '../hooks/signals'
import { MODULE_DEFS } from '../modules/registry'
import { STAGE_CV_ID } from '../data/stages'

const markKey = (m) => `${m.module}.${m.port}`

export default function StageParams({ marks, onMarks, rows }) {
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

  // Every CV-tagged input in the patch, off the registered descriptors.
  const available = () => {
    const out = []
    for (const row of rows) {
      for (const mod of row.modules) {
        const desc = registry.modulesRef.current.get(mod.id)
        if (!desc) continue
        const label = MODULE_DEFS[mod.type]?.label || mod.type
        for (const [port, meta] of Object.entries(desc.inputs || {})) {
          if (meta?.cv) out.push({ module: mod.id, port, label: `${label} ${port}` })
        }
      }
    }
    return out
  }

  const toggleMark = (cand) => {
    const k = markKey(cand)
    const marked = marks.some(m => markKey(m) === k)
    onMarks(marked ? marks.filter(m => markKey(m) !== k) : [...marks, cand])
  }

  /* MenuItem, not Dropdown, because the panel holds sliders and a nested list
     rather than one-of-N — but it wears the Dropdown trigger's chrome so the bar
     reads as one control set. */
  return (
    <MenuItem label="Modules" align="end" panelClassName="w-80" buttonClassName="kol-btn kol-btn-grey kol-btn-md kol-dd-trigger">
      {marks.map(m => (
        <div key={markKey(m)} className="px-3 py-1">
          <Slider
            label={m.label}
            value={values[markKey(m)] ?? m.value ?? 0}
            onChange={v => setValues(prev => ({ ...prev, [markKey(m)]: v }))}
            min={m.min ?? 0}
            max={m.max ?? 100}
            fontSize="11px"
          />
        </div>
      ))}

      {marks.length > 0 && <MenuDropdownDivider />}

      <MenuDropdownNest label="Mark parameters">
        {available().map(c => {
          const marked = marks.some(m => markKey(m) === markKey(c))
          return (
            <MenuDropdownItem
              key={markKey(c)}
              onClick={() => toggleMark(c)}
              shortcut={marked ? <Icon name="check" size={11} /> : undefined}
            >
              {c.label}
            </MenuDropdownItem>
          )
        })}
      </MenuDropdownNest>
    </MenuItem>
  )
}
