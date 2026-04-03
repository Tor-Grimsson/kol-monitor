// PatchModule — save/load/clear patch presets
// 6HP 3U

import { useState, useRef } from 'react'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { patches } from '../../patches.js'
import Module from './Module'
import ModuleHeader from '../controls/ModuleHeader'
import Dropdown from '../controls/Dropdown'

function PatchPanel({ current, names, cableCount, onCurrentChange, onLoad, onSave, onClear }) {
  const btnStyle = {
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 2,
    padding: '2px 6px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'left',
  }

  return (
    <Module>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '4px 2px', gap: 6,
      }}>
        <ModuleHeader label="Patch" enabled={true} onToggle={() => {}} />

        <div style={{ padding: '0 2px' }}>
          <Dropdown value={current} options={names} onChange={onCurrentChange} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 2px' }}>
          <button className="kol-helper-xxxs" style={btnStyle} onClick={onLoad}>load</button>
          <button className="kol-helper-xxxs" style={btnStyle} onClick={onSave}>save</button>
          <button className="kol-helper-xxxs" style={btnStyle} onClick={onClear}>clear</button>
        </div>

        <span className="kol-helper-xxxxs" style={{
          color: 'rgba(255,255,255,0.25)',
          padding: '0 4px',
        }}>
          {cableCount} cables
        </span>
      </div>
    </Module>
  )
}

export default function PatchModule({ id = 'patch1', preview }) {
  if (preview) return <PatchPanel current="init" names={['init']} cableCount={0} onCurrentChange={() => {}} onLoad={() => {}} onSave={() => {}} onClear={() => {}} />

  const routing = usePatchRouting()
  const [saved, setSaved] = useState(() => ({ ...patches }))
  const [current, setCurrent] = useState('init')
  const [saveSlot, setSaveSlot] = useState(1)

  const names = Object.keys(saved)

  const handleLoad = () => {
    const patch = saved[current]
    if (patch) routing.loadPatch([...patch])
  }

  const handleSave = () => {
    const name = `usr-${String(saveSlot).padStart(2, '0')}`
    const snapshot = routing.connections.map(c => ({ ...c }))
    setSaved(prev => ({ ...prev, [name]: snapshot }))
    setCurrent(name)
    setSaveSlot(s => s + 1)
  }

  const handleClear = () => {
    routing.loadPatch([])
    setCurrent('init')
  }

  return <PatchPanel current={current} names={names} cableCount={routing.connections.length} onCurrentChange={setCurrent} onLoad={handleLoad} onSave={handleSave} onClear={handleClear} />
}
