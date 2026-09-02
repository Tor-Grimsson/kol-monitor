// PatchTableOverlay — the patch as a table: one row per cable, an add row of
// four dropdowns. Patching without aiming (user, 2026-09-01: "patching can be
// tricky on mobile if you need to zoom or move … a table presentation overlay,
// useful for both desktop and mobile"). `p` toggles it in the rack.
//
// Reads the live registry (`desc.inputs` / `desc.outputs`, the same source the
// stage's marks read) and `usePatchRouting` — no second port model. The rack
// enforces no type rule on a jack (any output patches into any input), so the
// dropdowns show each port's type instead of filtering by it.
//
// `backdrop={false}`: the rack stays live behind the panel, so a cable can be
// added while the picture is watched.

import { useMemo, useState } from 'react'
import ShellDrawer from '@kolkrabbi/kol-component/molecules/ShellDrawer'
import Dropdown from '@kolkrabbi/kol-component/molecules/Dropdown'
import Button from '../components/atoms/Button'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { usePatchRouting } from '../hooks/usePatchRouting.jsx'
import { MODULE_DEFS } from '../modules/registry'

const VIRTUAL_LABELS = { stagecv: 'Stage CV', monitor: 'Monitor' }

const portOptions = (ports) =>
  Object.entries(ports || {}).map(([port, meta]) => ({ value: port, label: `${port} · ${meta?.type || '?'}` }))

export default function PatchTableOverlay({ open, rows, onClose }) {
  const { modulesRef } = useModuleRegistry()
  const { connections, addConnection, removeConnection } = usePatchRouting()

  // Rack order, labelled by the catalog; a repeated type gets a running number.
  // Registered modules that are in no row are VIRTUAL (the stage's CV strip and
  // its monitor) — they patch like any other, so they belong in both lists.
  const modules = useMemo(() => {
    const seen = {}
    const all = rows.flatMap(r => r.modules || [])
    const count = {}
    all.forEach(m => { count[m.type] = (count[m.type] || 0) + 1 })
    const list = all.map(m => {
      const base = MODULE_DEFS[m.type]?.label || m.type
      seen[m.type] = (seen[m.type] || 0) + 1
      return { value: m.id, label: count[m.type] > 1 ? `${base} ${seen[m.type]}` : base }
    })
    const inRows = new Set(list.map(m => m.value))
    const virtual = [...modulesRef.current.keys()]
      .filter(id => !inRows.has(id))
      .map(id => ({ value: id, label: VIRTUAL_LABELS[id] || id }))
    return [...list, ...virtual]
  }, [rows, modulesRef, open])
  const labelOf = (id) => modules.find(m => m.value === id)?.label || id

  const [pick, setPick] = useState({ from: '', fromPort: '', to: '', toPort: '' })
  const outs = portOptions(modulesRef.current.get(pick.from)?.outputs)
  const ins = portOptions(modulesRef.current.get(pick.to)?.inputs)
  const pickFrom = (from) => setPick(p => ({ ...p, from, fromPort: portOptions(modulesRef.current.get(from)?.outputs)[0]?.value || '' }))
  const pickTo = (to) => setPick(p => ({ ...p, to, toPort: portOptions(modulesRef.current.get(to)?.inputs)[0]?.value || '' }))
  const canAdd = pick.from && pick.fromPort && pick.to && pick.toPort

  const placeholder = (label) => [{ value: '', label }]

  return (
    <ShellDrawer open={open} onClose={onClose} side="right" width="min(440px, 100vw)" backdrop={false} header={<span className="kol-helper-12 text-fg-64">Patch table</span>}>
      <div className="flex flex-col gap-4 p-4 kol-helper-12">
        <div className="flex flex-col gap-1">
          {connections.length === 0 && <div className="text-fg-32">No cables</div>}
          {connections.map(c => (
            <div key={`${c.toModuleId}:${c.toPort}`} className="flex items-center gap-2 h-8">
              <span className="text-fg-80 truncate">{labelOf(c.fromModuleId)} · {c.fromPort}</span>
              <span className="text-fg-32">→</span>
              <span className="text-fg-80 truncate flex-1">{labelOf(c.toModuleId)} · {c.toPort}</span>
              <Button variant="grey" size="sm" aria-label="Remove cable" onClick={() => removeConnection(c.toModuleId, c.toPort)}>×</Button>
            </div>
          ))}
        </div>

        <div className="border-t border-fg-08" />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Dropdown variant="grey" className="flex-1" options={placeholder('From module').concat(modules)} value={pick.from} onChange={pickFrom} />
            <Dropdown variant="grey" className="flex-1" options={outs.length ? outs : placeholder('out')} value={pick.fromPort} onChange={fromPort => setPick(p => ({ ...p, fromPort }))} />
          </div>
          <div className="flex gap-2">
            <Dropdown variant="grey" className="flex-1" options={placeholder('To module').concat(modules)} value={pick.to} onChange={pickTo} />
            <Dropdown variant="grey" className="flex-1" options={ins.length ? ins : placeholder('in')} value={pick.toPort} onChange={toPort => setPick(p => ({ ...p, toPort }))} />
          </div>
          <Button variant="grey" size="md" disabled={!canAdd} onClick={() => addConnection(pick.from, pick.fromPort, pick.to, pick.toPort)}>Add cable</Button>
        </div>
      </div>
    </ShellDrawer>
  )
}
