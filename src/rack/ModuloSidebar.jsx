// ModuloSidebar — the rack's `H` Rail (plan 16 W5, user 2026-10-24: "move to a propper right Siderail? still on H
// shortcut with same settings, just in the template of Siderail 'settings'"): Zoom, Presets, Modules / Cables. On
// the rail kit (plan 17) over the rack — the shell rail stays on the left. The left-docked version is in
// `_tmp/2026-10-24-plan16/ModuloSidebar.left.jsx`.

import { useState, useRef, useEffect } from 'react'
import { patches } from '../data/patches'
import { savePatchFile, loadPatchFile } from '../hooks/usePatchFile.js'
import { useLibrary, removeFromLibrary } from '../hooks/useLibraryStore.js'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { Icon } from '@kolkrabbi/kol-icons'
import IconToggle from '@kolkrabbi/kol-component/atoms/IconToggle'
import Input from '@kolkrabbi/kol-component/atoms/Input'
import { Tooltip } from '@kolkrabbi/kol-component/utilities/Popover'
import Button from '../components/atoms/Button'
import Rail from '@kolkrabbi/kol-component/molecules/Rail'
import { LabeledControlSection as RailSection, SettingsRow as RailRow } from '@kolkrabbi/kol-component/organisms/SettingsPanel'
import { RailHeader, RailActions, RailFoot } from '@kolkrabbi/kol-component/organisms/RailKit'
import { useModal } from '@kolkrabbi/kol-component/molecules/Modal'

export default function ModuloSidebar({ open, rack, routing, zoom, onZoomChange, onHide, cableVisibility, onCableVisibility, cableLocked, onCableLocked }) {
  const { modulesRef } = useModuleRegistry()
  const modal = useModal()
  const library = useLibrary()
  const [zoomInput, setZoomInput] = useState(() => String(Math.round((zoom || 1) * 100)))
  const zoomInputRef = useRef(false) // true while user is editing

  useEffect(() => {
    if (!zoomInputRef.current) setZoomInput(String(Math.round((zoom || 1) * 100)))
  }, [zoom])

  /* ON THE RAIL KIT (plan 17 W3.2, ticket RailKit): the app tier, `RailHeader`, Zoom as a `RailRow`, Presets as a
     `RailSection` with its file verbs in `RailActions row`, Modules / Cables in the pinned `RailFoot`. `H`, over the
     rack, no scrim — `role="page"`, the settings rail's shell without the scrim (RailRolesOnMonitor). */
  return (
    <Rail role="page" open={open} onClose={onHide}
      header={<RailHeader title="Rack" />}
      footer={
        <RailFoot>
          <div className="flex items-center justify-between">
        {/* the label carries the state ([Modules] → [Editing]) */}
        <Button size="sm" onClick={() => rack.setEditMode(!rack.editMode)}>
          [{rack.editMode ? 'Editing' : 'Modules'}]
        </Button>
        <div className="kol-helper-12 text-fg-48" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          [Cables
          {/* lock is a toggle (danger when on, mirror's Lock); visibility cycles three states, so it is a button */}
          <IconToggle size="sm" tone="danger" pressed={cableLocked} onChange={(v) => onCableLocked?.(v)} icon="unlock" iconOn="lock" label="Cable lock" iconComponent={Icon} />
          <Tooltip label="Cable visibility" triggerClassName="inline-flex shrink-0">
            <Button variant="nav" size="sm" iconOnly={cableVisibility === 'on' ? 'cable-on' : cableVisibility === 'off' ? 'cable-off' : 'cable-trans'} iconSize={14} aria-label="Cable visibility" onClick={() => onCableVisibility?.(cableVisibility === 'on' ? 'off' : cableVisibility === 'off' ? 'trans' : 'on')} />
          </Tooltip>]
        </div>
          </div>
        </RailFoot>
      }
    >
      <div className="flex flex-col gap-6" style={{ userSelect: 'none' }}>
        <RailRow label="Zoom">
          <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => onZoomChange?.(Math.max(0.5, (zoom || 1) - 0.1))}>−</Button>
              <Input
                size="sm"
                chars={3}
                suffix="%"
                inputMode="numeric"
                inputClassName="text-right"
                value={zoomInput}
                onFocus={(e) => { zoomInputRef.current = true; e.target.select() }}
                onChange={(e) => setZoomInput(e.target.value)}
                onBlur={() => {
                  zoomInputRef.current = false
                  const v = parseInt(zoomInput, 10)
                  if (!isNaN(v)) onZoomChange?.(Math.min(2, Math.max(0.5, v / 100)))
                  else setZoomInput(String(Math.round((zoom || 1) * 100)))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.target.blur()
                }}
              />
              <Button size="sm" onClick={() => onZoomChange?.(Math.min(2, (zoom || 1) + 0.1))}>+</Button>
          </div>
        </RailRow>
        <RailSection label="Presets" divided>
          <RailActions row>
            <Button
              size="sm"
              onClick={() => {
                const caseName = sessionStorage.getItem('caseName')?.replace(/^"|"$/g, '') || 'Untitled'
                const desc = sessionStorage.getItem('caseDescription')?.replace(/^"|"$/g, '') || ''
                savePatchFile(rack, routing?.connections || [], modulesRef, caseName, desc || undefined)
              }}
            >[Export]</Button>
            <Button
              size="sm"
              onClick={async () => {
                let patch
                try { patch = await loadPatchFile() } catch { await modal?.alert("That file isn't a Monitor patch."); return }
                if (!patch) return
                if (patch.name) sessionStorage.setItem('caseName', JSON.stringify(patch.name))
                if (patch.description) sessionStorage.setItem('caseDescription', JSON.stringify(patch.description))
                if (patch.rows) rack.loadPreset(patch)
                if (patch.connections) routing?.loadPatch(patch.connections)
              }}
            >[Import]</Button>
          </RailActions>
          <div className="flex flex-col gap-0.5">
          {Object.keys(patches).map(name => {
            const p = patches[name]
            const count = p.connections ? p.connections.length : 0
            return (
              <Button
                key={name}
                variant="nav"
                size="sm"
                className="w-full justify-between"
                onClick={() => {
                  if (p.rows) rack.loadPreset(p)
                  routing?.loadPatch(p.connections || [])
                }}
              >
                <span>{name}</span>
                <span className="text-fg-32">{count}</span>
              </Button>
            )
          })}
          {/* your saved patches (the library — plan 13 W7), after the presets */}
          {library.map(item => (
            <div key={item.id} className="flex items-center gap-1">
              <Button
                variant="nav"
                size="sm"
                className="flex-1 justify-between"
                onClick={() => {
                  if (item.data.rows) rack.loadPreset(item.data)
                  routing?.loadPatch(item.data.connections || [])
                }}
              >
                <span>{item.name}</span>
                <span className="text-fg-32">{item.data.connections?.length ?? 0}</span>
              </Button>
              {/* a save can go — a tombstone when signed in, so another device drops it too */}
              <Button size="sm" aria-label={`Delete ${item.name}`} onClick={async () => {
                if (!modal || await modal.confirm(`Delete ${item.name}?`, { okLabel: 'Delete' })) removeFromLibrary(item.id)
              }}>x</Button>
            </div>
          ))}
          </div>
        </RailSection>
      </div>
    </Rail>
  )
}
