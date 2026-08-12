import { useState } from 'react'
import Divider from './atoms/Divider'

export default function CaseRowDialog({ rows, onAddRow, onToggleRowHeight, onRemoveRow }) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <span onClick={() => setShowPicker(true)} className="kol-helper-16 text-fg-80 hover:text-fg-96 cursor-pointer select-none">[Add row]</span>
        {showPicker && (
          <div className="flex items-center gap-4" style={{ marginTop: 12, paddingLeft: 8 }}>
            <span onClick={() => { onAddRow('1u'); setShowPicker(false) }} className="kol-helper-14 text-fg-48 hover:text-fg-96 cursor-pointer select-none">[1U]</span>
            <span onClick={() => { onAddRow('3u'); setShowPicker(false) }} className="kol-helper-14 text-fg-48 hover:text-fg-96 cursor-pointer select-none">[3U]</span>
          </div>
        )}
      </div>
      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {rows.map((row, ri) => (
            <div key={ri} onClick={() => onRemoveRow(ri)} className="flex items-center gap-2 cursor-pointer select-none hover:text-fg-96" style={{ whiteSpace: 'nowrap' }}>
              <span className="kol-helper-16 text-fg-80">Row {ri + 1}</span>
              <span className="kol-helper-16 text-fg-80">[{row.height.toUpperCase()}]</span>
            </div>
          ))}
          <div style={{ width: 64 }}><Divider opacity="80" className="my-1" /></div>
          <span className="kol-helper-16 text-fg-80">[{rows.reduce((s, r) => s + (r.height === '1u' ? 1 : 3), 0)}U]</span>
        </div>
      )}
    </div>
  )
}
