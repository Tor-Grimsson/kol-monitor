// LibrarySearchOverlay — Cmd+K palette for direct module insertion.
// Type to filter; Enter inserts first match into first compatible row with space; Esc closes.

import { useState, useRef, useEffect, useMemo } from 'react'
import { MODULE_DEFS } from '../modules/registry'
import { TOTAL_HP } from '../modules/utility/eurorack'

function findCompatibleRow(rows, mod) {
  const targetHeight = mod.u === 1 ? '1u' : '3u'
  return rows.find(r => {
    if (r.height !== targetHeight) return false
    const used = r.modules.reduce((s, m) => s + m.hp, 0)
    return used + mod.hp <= TOTAL_HP
  })
}

export default function LibrarySearchOverlay({ rows, onAddModule, onClose }) {
  const [searchText, setSearchText] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const allModules = useMemo(
    () => Object.entries(MODULE_DEFS).map(([type, def]) => ({ type, ...def })),
    []
  )

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return allModules
    return allModules.filter(m =>
      m.label?.toLowerCase().includes(q) ||
      m.type?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    )
  }, [allModules, searchText])

  useEffect(() => { setSelectedIdx(0) }, [searchText])

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  const insert = (idx) => {
    const mod = filtered[idx]
    if (!mod) return
    const row = findCompatibleRow(rows, mod)
    if (!row) return
    onAddModule(mod.type, row.id)
    onClose()
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(filtered.length - 1, i + 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(0, i - 1)) }
    if (e.key === 'Enter')     { e.preventDefault(); insert(selectedIdx) }
    if (e.key === 'Escape')    { e.preventDefault(); onClose() }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 select-none bg-fg-inverse-08"
      style={{ display: 'grid', placeItems: 'center', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface-primary border border-fg-08"
        style={{ width: 400, height: 320, borderRadius: 4, display: 'flex', flexDirection: 'column' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search modules…"
          className="bg-transparent outline-none kol-helper-xs text-fg-80 caret-current"
          style={{ padding: '14px 16px', border: 'none', flexShrink: 0 }}
        />
        <div className="border-t border-fg-08" />
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {filtered.map((mod, i) => {
            const row = findCompatibleRow(rows, mod)
            const disabled = !row
            return (
              <div
                key={mod.type}
                onClick={() => insert(i)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`kol-helper-xs flex items-center justify-between ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${i === selectedIdx && !disabled ? 'text-fg-96 bg-fg-08' : disabled ? 'text-fg-32' : 'text-fg-64'}`}
                style={{ padding: '6px 16px' }}
              >
                <span>{mod.label}</span>
                <span className="text-fg-32">{mod.hp}HP {mod.u}U · {mod.category}</span>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="kol-helper-xs text-fg-32" style={{ padding: '12px 16px' }}>No matches</div>
          )}
        </div>
      </div>
    </div>
  )
}
