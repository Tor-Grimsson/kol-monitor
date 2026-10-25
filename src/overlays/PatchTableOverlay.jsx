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
// On `SettingsPanel backdrop={false}` (plan 16 W6.1 — the settings Rail's template, no scrim; ticket SettingsPanelBackdrop): the rack stays live behind it, so a cable can be
// added while the picture is watched.

import { useMemo, useState } from 'react'
import Dropdown from '@kolkrabbi/kol-component/molecules/Dropdown'
import Rail from '@kolkrabbi/kol-component/molecules/Rail'
import Divider from '@kolkrabbi/kol-component/atoms/Divider'
import ActionButton from '@kolkrabbi/kol-component/molecules/ActionButton'
import { LabeledControlSection as RailSection, SettingsRow as RailRow } from '@kolkrabbi/kol-component/organisms/SettingsPanel'
import { RailHeader, RailHint, RailActions } from '@kolkrabbi/kol-component/organisms/RailKit'
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

  /* ON THE RAIL KIT (plan 17 W3.1, ticket RailKit — kol-ds-ui's `apps/rails` list rail): the app tier's width and
     padding, `RailHeader`, rows with a per-row ActionButton, a Divider, the add controls as `RailSection` / `RailRow`
     and `RailActions`. Over the live rack, no scrim. */
  return (
    <Rail role="patch" open={open} onClose={onClose}
      header={<RailHeader title="Patch table" />}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {connections.length === 0 && <RailHint>No cables</RailHint>}
          {connections.map(c => (
            <div key={`${c.toModuleId}:${c.toPort}`} className="flex h-8 items-center gap-2 kol-mono-12">
              <span className="truncate text-fg-80">{labelOf(c.fromModuleId)} · {c.fromPort}</span>
              <span className="text-fg-32">→</span>
              <span className="flex-1 truncate text-fg-80">{labelOf(c.toModuleId)} · {c.toPort}</span>
              <ActionButton chrome="inline" size="sm" icon="x" confirmIcon="x" label="Remove cable" onAction={() => removeConnection(c.toModuleId, c.toPort)} />
            </div>
          ))}
        </div>
        <Divider />
        <RailSection>
          <RailRow label="From" align="fill" labelWidth={48}>
            <div className="flex w-full gap-2">
              <Dropdown size="sm" className="flex-1" options={placeholder('From module').concat(modules)} value={pick.from} onChange={pickFrom} ariaLabel="From module" />
              <Dropdown size="sm" className="w-24" options={outs.length ? outs : placeholder('out')} value={pick.fromPort} onChange={fromPort => setPick(p => ({ ...p, fromPort }))} ariaLabel="From port" />
            </div>
          </RailRow>
          <RailRow label="To" align="fill" labelWidth={48}>
            <div className="flex w-full gap-2">
              <Dropdown size="sm" className="flex-1" options={placeholder('To module').concat(modules)} value={pick.to} onChange={pickTo} ariaLabel="To module" />
              <Dropdown size="sm" className="w-24" options={ins.length ? ins : placeholder('in')} value={pick.toPort} onChange={toPort => setPick(p => ({ ...p, toPort }))} ariaLabel="To port" />
            </div>
          </RailRow>
          <RailActions>
            <Button size="sm" disabled={!canAdd} onClick={() => addConnection(pick.from, pick.fromPort, pick.to, pick.toPort)}>Add cable</Button>
          </RailActions>
        </RailSection>
      </div>
    </Rail>
  )
}
