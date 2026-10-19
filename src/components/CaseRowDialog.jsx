import { useState } from 'react'
import Divider from '@kolkrabbi/kol-component/atoms/Divider'
import Button from './atoms/Button'

/* rows — every bracket is a DS `Button` on the nav rung (plan 13 W4.1); labels verbatim */
export default function CaseRowDialog({ rows, onAddRow, onToggleRowHeight, onRemoveRow }) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <Button size="md" onClick={() => setShowPicker(true)}>[Add row]</Button>
        {showPicker && (
          <div className="flex items-center gap-4" style={{ marginTop: 12, paddingLeft: 8 }}>
            <Button size="sm" onClick={() => { onAddRow('1u'); setShowPicker(false) }}>[1U]</Button>
            <Button size="sm" onClick={() => { onAddRow('3u'); setShowPicker(false) }}>[3U]</Button>
          </div>
        )}
      </div>
      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {rows.map((row, ri) => (
            <Button key={ri} size="md" onClick={() => onRemoveRow(ri)} style={{ whiteSpace: 'nowrap' }}>
              Row {ri + 1} [{row.height.toUpperCase()}]
            </Button>
          ))}
          <div style={{ width: 64 }}><Divider opacity="80" className="my-1" /></div>
          <span className="kol-helper-16 text-fg-80">[{rows.reduce((s, r) => s + (r.height === '1u' ? 1 : 3), 0)}U]</span>
        </div>
      )}
    </div>
  )
}
