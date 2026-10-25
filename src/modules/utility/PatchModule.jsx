// PatchModule — save/load/clear patch presets
// 6HP 3U

import { useState, useRef } from 'react'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { useModuleRegistry } from '../../hooks/useModuleRegistry.jsx'
import { useRack } from '../../hooks/useRackContext.jsx'
import { savePatchFile, loadPatchFile, snapshotPatch } from '../../hooks/usePatchFile.js'
import { useLibrary, addToLibrary } from '../../hooks/useLibraryStore.js'
import { patches } from '../../data/patches.js'
import Module from './Module'

import Dropdown from '@kolkrabbi/kol-component/molecules/Dropdown'
import Button from '../../components/atoms/Button'
import { useModal } from '@kolkrabbi/kol-component/molecules/Modal'

function PatchPanel({ tab, onTabChange, current, options, cableCount, onCurrentChange, onLoad, onSave, onClear, onExport, onImport }) {
  /* THE BUTTONS ARE THE DS BUTTON (user 2026-10-02: *"what buttons are these?"*). They were raw
   * <button> tags with their own border, padding and type — about 17px tall beside the 22px
   * dropdown. `Button size="xs"` is the panel rung, the same 22px box. */
  return (
    <Module label="Patch" enabled={true} onToggle={() => {}} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        /* gap 4 (was 6): the DS buttons are 22px, 5 taller than the hand-drawn ones, and the
         * 1U plate has 101px — at 6 the cable count ran off the bottom */
        height: '100%', padding: '4px 2px', gap: 4,
      }}>

        <div style={{ display: 'flex', gap: 8, padding: '0 2px' }}>
          {['preset', 'file'].map(t => (
            <span
              key={t}
              onClick={() => onTabChange(t)}
              className={`kol-helper-8 cursor-pointer select-none ${tab === t ? 'text-fg-64' : 'text-fg-32'}`}
              style={{ textTransform: 'uppercase' }}
            >{t === 'preset' ? 'Preset' : 'File'}</span>
          ))}
        </div>

        {tab === 'preset' && (
          <>
            {/* line-height 0: the dropdown's root is an inline-block around its trigger, so the
              * wrapper's line strut made it 26–27px tall for a 22px trigger */}
            <div style={{ display: 'flex', padding: '0 2px', lineHeight: 0 }}>
              <Dropdown size="xs" tone="outline" value={current} options={options} onChange={onCurrentChange} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 2px' }}>
              <div style={{ display: 'flex', gap: 3 }}>
                <Button tone="outline" size="xs" className="flex-1" onClick={onLoad}>Load</Button>
                <Button tone="outline" size="xs" className="flex-1" onClick={onSave}>Save</Button>
              </div>
              <Button tone="outline" size="xs" className="flex-1" onClick={onClear}>Clear</Button>
            </div>
            <span className="kol-helper-xxxxs text-fg-24" style={{ padding: '0 4px' }}>
              {cableCount} cables
            </span>
          </>
        )}

        {tab === 'file' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 2px' }}>
            <Button tone="outline" size="xs" className="flex-1" onClick={onExport}>Export</Button>
            <Button tone="outline" size="xs" className="flex-1" onClick={onImport}>Import</Button>
          </div>
        )}
      </div>
    </Module>
  )
}

export default function PatchModule({ id = 'patch1', preview }) {
  if (preview) return <PatchPanel tab="preset" onTabChange={() => {}} current="init" options={[{ value: 'init', label: 'init' }]} cableCount={0} onCurrentChange={() => {}} onLoad={() => {}} onSave={() => {}} onClear={() => {}} onExport={() => {}} onImport={() => {}} />

  const routing = usePatchRouting()
  const { modulesRef } = useModuleRegistry()
  const rack = useRack()
  const [tab, setTab] = useState('preset')
  /* the presets, then your saved patches (the library — plan 13 W7). A preset's value is its name, a
     save's its `usr-…` id, so one dropdown holds both without a name clash. */
  const library = useLibrary()
  const [current, setCurrent] = useState('init')
  const options = [
    ...Object.keys(patches).map((name) => ({ value: name, label: name })),
    ...library.map((item) => ({ value: item.id, label: item.name })),
  ]

  const handleLoad = () => {
    const patch = patches[current] ?? library.find((i) => i.id === current)?.data
    if (!patch) return
    if (patch.rows) rack.loadPreset(patch)
    const conns = patch.connections || (Array.isArray(patch) ? patch : [])
    routing.loadPatch([...conns])
  }

  /* Save → a patch in the library, named after the case; signed in, it syncs */
  const handleSave = () => {
    const caseName = sessionStorage.getItem('caseName')?.replace(/^"|"$/g, '') || 'Untitled'
    const desc = sessionStorage.getItem('caseDescription')?.replace(/^"|"$/g, '') || ''
    /* the cover is the patch's OUTPUT at save time — Output's frame, else Monitor's (2026-10-24) */
    let thumb
    try { thumb = document.querySelector('[data-output-canvas], [data-monitor-canvas]')?.toDataURL('image/jpeg', 0.82) } catch { /* tainted canvas — no cover */ }
    const item = addToLibrary(snapshotPatch(rack, routing.connections, modulesRef, caseName, desc || undefined), { thumb })
    setCurrent(item.id)
  }

  /* the DS modal (plan 13 W6) — absent outside the app shell (dev capture), where Clear just clears */
  const modal = useModal()
  const handleClear = async () => {
    if (modal && !(await modal.confirm('Remove every cable?', { okLabel: 'Clear' }))) return
    routing.loadPatch([])
    setCurrent('init')
  }

  const handleExport = () => {
    const caseName = sessionStorage.getItem('caseName')?.replace(/^"|"$/g, '') || current
    const desc = sessionStorage.getItem('caseDescription')?.replace(/^"|"$/g, '') || ''
    savePatchFile(rack, routing.connections, modulesRef, caseName, desc || undefined)
  }

  const handleImport = async () => {
    let patch
    try { patch = await loadPatchFile() } catch { await modal?.alert("That file isn't a Monitor patch."); return }
    if (!patch) return
    if (patch.name) sessionStorage.setItem('caseName', JSON.stringify(patch.name))
    if (patch.description) sessionStorage.setItem('caseDescription', JSON.stringify(patch.description))
    if (patch.rows) rack.loadPreset(patch)
    if (patch.connections) routing.loadPatch(patch.connections)
  }

  return <PatchPanel tab={tab} onTabChange={setTab} current={current} options={options} cableCount={routing.connections.length} onCurrentChange={setCurrent} onLoad={handleLoad} onSave={handleSave} onClear={handleClear} onExport={handleExport} onImport={handleImport} />
}
