// ModuloSidebar — sections: Case, Modules, Presets

import { useState, useRef, useEffect } from 'react'
import logomarkUrl from '@kolkrabbi/kol-brand/svg/favicon-01.svg?url'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, getModulesByCategory, MODULE_DEFS } from '../modules/registry'
import { patches } from '../data/patches'
import { savePatchFile, loadPatchFile } from '../hooks/usePatchFile.js'
import { useLibrary, removeFromLibrary } from '../hooks/useLibraryStore.js'
import { useModuleRegistry } from '../hooks/useModuleRegistry.jsx'
import { Icon } from '@kolkrabbi/kol-icons'
import { Icon as DsIcon } from '@kolkrabbi/kol-icons' // nav-* glyphs, promoted 2026-08-27
import { Logomark } from '@kolkrabbi/kol-shell'
import DSButton from '@kolkrabbi/kol-component/atoms/Button'
import IconToggle from '@kolkrabbi/kol-component/atoms/IconToggle'
import Input from '@kolkrabbi/kol-component/atoms/Input'
import { Tooltip } from '@kolkrabbi/kol-component/utilities/Popover'
import Button from '../components/atoms/Button'
import { useModal } from '@kolkrabbi/kol-component/molecules/Modal'

const NAV_ITEMS = [
  { icon: 'nav-library', path: '/library', label: 'Library' },
  { icon: 'nav-settings', path: '/settings', label: 'Settings' },
  { icon: 'nav-create', path: '/create', label: 'Create' },
]

/* the tab glyphs — DS icon buttons on the nav rung (plan 13 W4.4); kol-icons' `nav-*` set, so the DS
   Button's own default renderer, not this repo's `Icon` seam */
function NavIcons() {
  const navigate = useNavigate()
  return (
    <>
      <Tooltip label="Home" triggerClassName="inline-flex shrink-0">
        <DSButton variant="nav" size="sm" iconOnly="home" iconComponent={<Logomark svgUrl={logomarkUrl} size={16} />} aria-label="Home" onClick={() => navigate('/')} />
      </Tooltip>
      {NAV_ITEMS.map(({ icon, path, label }) => (
        <Tooltip key={path} label={label} triggerClassName="inline-flex shrink-0">
          <DSButton variant="nav" size="sm" iconOnly={icon} iconSize={16} aria-label={label} onClick={() => navigate(path)} />
        </Tooltip>
      ))}
    </>
  )
}

const CATEGORY_LABELS = {
  control: 'Control',
  math: 'Math',
  generators: 'Generators',
  display: 'Display',
  utility: 'Utility',
}

export default function ModuloSidebar({ rack, routing, zoom, onZoomChange, onZoomFit, onHide, cableVisibility, onCableVisibility, cableLocked, onCableLocked }) {
  const { modulesRef } = useModuleRegistry()
  const modal = useModal()
  const library = useLibrary()
  const [openCats, setOpenCats] = useState(() => new Set(CATEGORIES))
  const [zoomInput, setZoomInput] = useState(() => String(Math.round((zoom || 1) * 100)))
  const [presetHeight, setPresetHeight] = useState(264)
  const dragRef = useRef(null)
  const zoomInputRef = useRef(false) // true while user is editing

  useEffect(() => {
    if (!zoomInputRef.current) setZoomInput(String(Math.round((zoom || 1) * 100)))
  }, [zoom])

  const toggleCat = (cat) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const findRowWithSpace = (hp, u) => {
    const targetHeight = u === 1 ? '1u' : '3u'
    for (const row of rack.rows) {
      if (row.height !== targetHeight) continue
      const used = row.modules.reduce((sum, m) => sum + m.hp, 0)
      if (used + hp <= rack.caseHp) return row.id
    }
    return null
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ userSelect: 'none' }}>

      {/* Header */}
      <div className="border-b border-fg-08 flex items-center justify-between" style={{ height: 45, padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <NavIcons />
        </div>
        <Button variant="nav" size="sm" onClick={onHide}>[Hide]</Button>
      </div>

      {/* CASE — compact row management */}
      <div className="p-4 border-b border-fg-08" style={{ maxHeight: 264, overflowY: 'auto' }}>
        <div className="kol-helper-12 text-fg-48 mb-3 uppercase">Case</div>
        <div className="flex flex-col gap-1">
          {rack.rows.map((row, i) => (
            <div key={row.id} className="flex items-center justify-between px-3 h-6">
              <span className="kol-helper-12 text-fg-64">Row {i + 1}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => rack.setRowHeight(row.id, row.height === '1u' ? '3u' : '1u')}>
                  [{row.height.toUpperCase()}]
                </Button>
                <span className="kol-helper-12 text-fg-32">
                  {row.modules.reduce((s, m) => s + m.hp, 0)}hp
                </span>
                {rack.rows.length > 1 && (
                  <Button size="sm" onClick={() => rack.removeRow(row.id)}>x</Button>
                )}
              </div>
            </div>
          ))}
          <Button size="sm" className="self-start" onClick={() => rack.addRow('3u')}>
            + add row
          </Button>

          {/* Zoom */}
          <div className="flex items-center justify-between px-3 h-6 mt-2">
            <span className="kol-helper-12 text-fg-48">Zoom</span>
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
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* PRESETS — drag handle to resize */}
      <div
        onPointerDown={(e) => {
          e.preventDefault()
          const startY = e.clientY
          const startH = presetHeight
          const onMove = (e) => setPresetHeight(Math.max(100, startH - (e.clientY - startY)))
          const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        }}
        style={{ height: 4, cursor: 'ns-resize', flexShrink: 0, position: 'relative' }}
        className="border-t border-fg-08"
      >
        <div className="bg-fg-16" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -4, width: 24, height: 1, pointerEvents: 'none' }} />
      </div>
      <div className="p-4" style={{ height: presetHeight, overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="kol-helper-12 text-fg-48 uppercase">Presets</span>
          <div className="flex gap-2">
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
          </div>
        </div>
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
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-fg-08 flex items-center justify-between">
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
    </div>
  )
}
