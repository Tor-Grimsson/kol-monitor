// PatchModule — save/load/clear patch presets
// 6HP 3U

import { useState, useRef } from 'react'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { useModuleRegistry } from '../../hooks/useModuleRegistry.jsx'
import { useRack } from '../../hooks/useRackContext.jsx'
import { savePatchFile, loadPatchFile } from '../../hooks/usePatchFile.js'
import { patches } from '../../data/patches.js'
import Module from './Module'

import Dropdown from '../parametric/Dropdown'

function PatchPanel({ tab, onTabChange, current, names, cableCount, onCurrentChange, onLoad, onSave, onClear, onExport, onImport }) {
  const btnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.3)',
  }

  return (
    <Module label="Patch" enabled={true} onToggle={() => {}} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '4px 2px', gap: 6,
      }}>

        <div style={{ display: 'flex', gap: 8, padding: '0 2px' }}>
          {['preset', 'file'].map(t => (
            <span
              key={t}
              onClick={() => onTabChange(t)}
              className={`kol-helper-8 cursor-pointer select-none ${tab === t ? 'text-fg-64' : 'text-fg-32'}`}
              style={{ textTransform: 'capitalize' }}
            >{t === 'preset' ? 'Preset' : 'File'}</span>
          ))}
        </div>

        {tab === 'preset' && (
          <>
            <div style={{ padding: '0 2px' }}>
              <Dropdown value={current} options={names} onChange={onCurrentChange} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 2px' }}>
              <div style={{ display: 'flex', gap: 3 }}>
                <button className="kol-helper-8" style={{ ...btnStyle, flex: 1 }} onClick={onLoad}>Load</button>
                <button className="kol-helper-8" style={{ ...btnStyle, flex: 1 }} onClick={onSave}>Save</button>
              </div>
              <button className="kol-helper-8" style={{ ...btnStyle, flex: 1 }} onClick={onClear}>Clear</button>
            </div>
            <span className="kol-helper-xxxxs" style={{ color: 'rgba(255,255,255,0.25)', padding: '0 4px' }}>
              {cableCount} cables
            </span>
          </>
        )}

        {tab === 'file' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 2px' }}>
            <button className="kol-helper-8" style={{ ...btnStyle, flex: 1 }} onClick={onExport}>Export</button>
            <button className="kol-helper-8" style={{ ...btnStyle, flex: 1 }} onClick={onImport}>Import</button>
          </div>
        )}
      </div>
    </Module>
  )
}

export default function PatchModule({ id = 'patch1', preview }) {
  if (preview) return <PatchPanel tab="preset" onTabChange={() => {}} current="init" names={['init']} cableCount={0} onCurrentChange={() => {}} onLoad={() => {}} onSave={() => {}} onClear={() => {}} onExport={() => {}} onImport={() => {}} />

  const routing = usePatchRouting()
  const { modulesRef } = useModuleRegistry()
  const rack = useRack()
  const [tab, setTab] = useState('preset')
  const [saved, setSaved] = useState(() => ({ ...patches }))
  const [current, setCurrent] = useState('init')
  const [saveSlot, setSaveSlot] = useState(1)

  const names = Object.keys(saved)

  const handleLoad = () => {
    const patch = saved[current]
    if (!patch) return
    if (patch.rows) rack.loadPreset(patch)
    const conns = patch.connections || (Array.isArray(patch) ? patch : [])
    routing.loadPatch([...conns])
  }

  const handleSave = () => {
    const name = `usr-${String(saveSlot).padStart(2, '0')}`
    const snapshot = routing.connections.map(c => ({ ...c }))
    setSaved(prev => ({ ...prev, [name]: snapshot }))
    setCurrent(name)
    setSaveSlot(s => s + 1)

    const modules = modulesRef.current

    // Rack placement with per-module state inline. Modules are emitted in
    // left-to-right visual order (sorted by offset), and each entry carries its
    // offset so gaps between modules survive a save/load round-trip.
    const rows = rack.rows.map(row => ({
      height: row.height,
      modules: [...row.modules]
        .sort((a, b) => a.offset - b.offset)
        .map(m => {
          const entry = { type: m.type, id: m.id, offset: m.offset }
          const reg = modules.get(m.id)
          const state = reg?.stateRef?.current
          if (state && Object.keys(state).length > 0) entry.state = { ...state }
          return entry
        }),
    }))

    // Enabled modules — capture the actual enabled state, not "has output".
    const on = []
    for (const [id, mod] of modules) {
      if (mod.enabledRef?.current) on.push(id)
    }

    const full = { name, rows, connections: snapshot, on }
    navigator.clipboard.writeText(JSON.stringify(full, null, 2)).catch(() => {})
  }

  const handleClear = () => {
    routing.loadPatch([])
    setCurrent('init')
  }

  const handleExport = () => {
    const caseName = sessionStorage.getItem('caseName')?.replace(/^"|"$/g, '') || current
    const desc = sessionStorage.getItem('caseDescription')?.replace(/^"|"$/g, '') || ''
    savePatchFile(rack, routing.connections, modulesRef, caseName, desc || undefined)
  }

  const handleImport = async () => {
    const patch = await loadPatchFile()
    if (!patch) return
    if (patch.name) sessionStorage.setItem('caseName', JSON.stringify(patch.name))
    if (patch.description) sessionStorage.setItem('caseDescription', JSON.stringify(patch.description))
    if (patch.rows) rack.loadPreset(patch)
    if (patch.connections) routing.loadPatch(patch.connections)
  }

  return <PatchPanel tab={tab} onTabChange={setTab} current={current} names={names} cableCount={routing.connections.length} onCurrentChange={setCurrent} onLoad={handleLoad} onSave={handleSave} onClear={handleClear} onExport={handleExport} onImport={handleImport} />
}
