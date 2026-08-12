// Workbench — bottom panel with tabs: Library (module catalog), Workbench (held modules), Case
// Drag top edge to resize

import { useState, useRef, useEffect, useCallback } from 'react'
import { MODULE_DEFS } from '../modules/registry'
import Divider from '../components/atoms/Divider'
import Icon from '../icons/Icon'
import { TOTAL_HP, hpToPx } from '../modules/utility/eurorack'
import Module from '../modules/utility/Module'
import ModuleLibraryGrid from '../components/ModuleLibraryGrid'

const DEFAULT_HEIGHT = Math.round(window.innerHeight * 0.3)
const MIN_HEIGHT = 80
const MAX_HEIGHT = 600

export default function Workbench({ modules, rows, onReturn, onAddModule, onAddRow, onRemoveRow, onSetRowHeight, onEditCase }) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [tab, setTab] = useState('library')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const searchRef = useRef(null)
  const dragging = useRef(false)

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    const startY = e.clientY
    const startH = height

    const handleMove = (e) => {
      const delta = startY - e.clientY
      setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startH + delta)))
    }
    const handleUp = () => {
      dragging.current = false
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }, [height])

  return (
    <div data-workbench className="border-t border-fg-08 bg-surface-primary" style={{ flexShrink: 0, position: 'relative', zIndex: 60 }}>
      {/* Drag handle */}
      <div
        onPointerDown={handleDragStart}
        style={{ height: 4, cursor: 'ns-resize', flexShrink: 0, position: 'relative' }}
      >
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -4, width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', pointerEvents: 'none' }} />
      </div>
      {/* Tabs + Content */}
      <div className="p-4" style={{ height }}>
        <div className="flex items-center gap-4 mb-3">
          <div style={{ flex: 1, display: 'flex', gap: 16, alignItems: 'center' }}>
          <span
            onClick={(e) => { e.stopPropagation(); setTab('library') }}
            className={`kol-helper-12 uppercase select-none cursor-pointer ${tab === 'library' ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
          >Library</span>
          <span
            onClick={(e) => { e.stopPropagation(); setTab('workbench') }}
            className={`kol-helper-12 uppercase select-none cursor-pointer ${tab === 'workbench' ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
          >Workbench</span>
          <span
            onClick={(e) => { e.stopPropagation(); setTab('case') }}
            className={`kol-helper-12 uppercase select-none cursor-pointer ${tab === 'case' ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
          >Case</span>
          {tab !== 'case' && (
            <div
              className="flex items-center rounded-full cursor-pointer"
              style={{
                height: 20,
                width: searchOpen ? 180 : 20,
                background: searchOpen ? 'var(--kol-fg-04, rgba(255,255,255,0.04))' : 'transparent',
                transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1), background 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
                color: searchOpen || searchText ? 'rgba(255,255,255,0.64)' : 'rgba(255,255,255,0.32)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (searchOpen) { setSearchOpen(false); setSearchText('') }
                else setSearchOpen(true)
              }}
            >
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 20, height: 20,
                  opacity: searchOpen ? 0 : 1,
                  transition: 'opacity 200ms',
                  position: searchOpen ? 'absolute' : 'relative',
                }}
              >
                <Icon name="search-line" size={14} />
              </span>
              {searchOpen && (
                <input
                  ref={searchRef}
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="Search…"
                  className="bg-transparent outline-none kol-helper-10 flex-1 text-fg-80 caret-current px-3"
                  onBlur={() => { if (!searchText) setSearchOpen(false) }}
                  onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchText('') } }}
                />
              )}
            </div>
          )}
          </div>
          {onEditCase && (
            <span
              onClick={(e) => { e.stopPropagation(); onEditCase() }}
              className="kol-helper-12 uppercase select-none cursor-pointer text-fg-32 hover:text-fg-48"
            >Edit</span>
          )}
        </div>

        <Divider />

        {tab === 'library' && (
          <ModuleLibraryGrid rows={rows} onAddModule={onAddModule} searchText={searchText} />
        )}

        {tab !== 'library' && (
        <div className="flex items-start gap-1 flex-1" style={{ paddingTop: 12, overflowX: 'auto', overflowY: 'hidden', flexWrap: 'nowrap' }}>
        {tab === 'workbench' && modules.length === 0 && (
          <div style={{
            width: hpToPx(8),
            aspectRatio: `${8 * 4} / ${TOTAL_HP}`,
            flexShrink: 0,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Module>
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 2px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(180,175,165,0.25)', flexShrink: 0 }} />
                  <span className="kol-helper-10" style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Placeholder</span>
                </div>
              </div>
            </Module>
          </div>
        )}

        {tab === 'workbench' && modules.filter(mod => {
          if (!searchText) return true
          const q = searchText.toLowerCase()
          const def = MODULE_DEFS[mod.type]
          return def?.label?.toLowerCase().includes(q) || mod.type.toLowerCase().includes(q)
        }).map(mod => {
          const def = MODULE_DEFS[mod.type]
          if (!def) return null
          const Comp = def.component
          const u = def.u || 3
          const aspectDiv = u === 1 ? 12 : 4
          return (
            <div
              key={mod.id}
              onClick={() => onReturn(mod.id)}
              style={{
                width: hpToPx(mod.hp),
                aspectRatio: `${mod.hp * aspectDiv} / ${TOTAL_HP}`,
                flexShrink: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: 0.8,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 0.8 }}
            >
              <Comp id={mod.id} />
            </div>
          )
        })}

        {tab === 'case' && (
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rows?.map((row, i) => (
              <div key={row.id} className="flex items-center gap-4" style={{ height: 28 }}>
                <span className="kol-helper-12 text-fg-64" style={{ width: 48 }}>Row {i + 1}</span>
                <span
                  onClick={() => onSetRowHeight?.(row.id, row.height === '1u' ? '3u' : '1u')}
                  className="kol-helper-12 text-fg-48 hover:text-fg-96 cursor-pointer select-none"
                >[{row.height.toUpperCase()}]</span>
                <span className="kol-helper-12 text-fg-32">
                  {row.modules.reduce((s, m) => s + m.hp, 0)}hp
                </span>
                {rows.length > 1 && (
                  <span
                    onClick={() => onRemoveRow?.(row.id)}
                    className="kol-helper-12 text-fg-32 hover:text-fg-96 cursor-pointer select-none"
                  >x</span>
                )}
              </div>
            ))}
            <div className="flex gap-4" style={{ marginTop: 4 }}>
              <span
                onClick={() => onAddRow?.('3u')}
                className="kol-helper-12 text-fg-32 hover:text-fg-96 cursor-pointer select-none"
              >+ 3U row</span>
              <span
                onClick={() => onAddRow?.('1u')}
                className="kol-helper-12 text-fg-32 hover:text-fg-96 cursor-pointer select-none"
              >+ 1U row</span>
            </div>
          </div>
        )}
        </div>
        )}
      </div>
    </div>
  )
}
