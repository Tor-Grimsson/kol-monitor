// PatchModule — save/load/clear patch presets
// 6HP 3U

import { useState, useRef } from 'react'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { patches } from '../../patches.js'
import Module from './Module'

import Dropdown from '../controls/Dropdown'

function PatchPanel({ current, names, cableCount, onCurrentChange, onLoad, onSave, onClear }) {
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

        <div style={{ padding: '0 2px' }}>
          <Dropdown value={current} options={names} onChange={onCurrentChange} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 2px' }}>
          <button className="kol-helper-xxxs" style={{ ...btnStyle, flex: 1 }} onClick={onLoad}>Load</button>
          <button className="kol-helper-xxxs" style={{ ...btnStyle, flex: 1 }} onClick={onSave}>Save</button>
          <button className="kol-helper-xxxs" style={{ ...btnStyle, flex: 1 }} onClick={onClear}>Clear</button>
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
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2)).catch(() => {})
  }

  const handleClear = () => {
    routing.loadPatch([])
    setCurrent('init')
  }

  return <PatchPanel current={current} names={names} cableCount={routing.connections.length} onCurrentChange={setCurrent} onLoad={handleLoad} onSave={handleSave} onClear={handleClear} />
}
