// ModuloSidebar — sections: Case, Modules, Presets

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, getModulesByCategory, MODULE_DEFS } from './moduleRegistry'
import { patches } from './patches'
import Icon from './components/icons/Icon'
import RackIcon from './icons/Icon'
import Logomark from './components/atoms/Logomark'

const NAV_ITEMS = [
  { icon: 'library', path: '/library', label: 'Library' },
  { icon: 'settings-01', path: '/settings', label: 'Settings' },
  { icon: 'plus', path: '/create', label: 'Create' },
]

function NavIcons() {
  const navigate = useNavigate()
  return (
    <>
      <div onClick={() => navigate('/')} title="Home" style={{ cursor: 'pointer', lineHeight: 0 }}>
        <Logomark svgUrl="/svg/favicon-01.svg" size={16} />
      </div>
      {NAV_ITEMS.map(({ icon, path, label }) => (
        <div
          key={path}
          onClick={() => navigate(path)}
          title={label}
          style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.48)', lineHeight: 0 }}
        >
          <Icon name={icon} size={16} />
        </div>
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
      if (used + hp <= 104) return row.id
    }
    return null
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ userSelect: 'none' }}>

      {/* Header */}
      <div className="border-b border-fg-08 flex items-center justify-between" style={{ height: 45, padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <NavIcons />
        </div>
        <span
          onClick={onHide}
          className="kol-helper-xs text-fg-32 hover:text-fg-96 cursor-pointer select-none"
        >
          [Hide]
        </span>
      </div>

      {/* CASE — compact row management */}
      <div className="p-4 border-b border-fg-08" style={{ maxHeight: 264, overflowY: 'auto' }}>
        <div className="kol-helper-xs text-fg-48 mb-3 uppercase">Case</div>
        <div className="flex flex-col gap-1">
          {rack.rows.map((row, i) => (
            <div key={row.id} className="flex items-center justify-between px-3 h-6">
              <span className="kol-helper-xs text-fg-64">Row {i + 1}</span>
              <div className="flex items-center gap-2">
                <span
                  onClick={() => rack.setRowHeight(row.id, row.height === '1u' ? '3u' : '1u')}
                  className="kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
                >
                  [{row.height.toUpperCase()}]
                </span>
                <span className="kol-helper-xs text-fg-32">
                  {row.modules.reduce((s, m) => s + m.hp, 0)}hp
                </span>
                {rack.rows.length > 1 && (
                  <span
                    onClick={() => rack.removeRow(row.id)}
                    className="kol-helper-xs text-fg-32 hover:text-fg-96 cursor-pointer select-none"
                  >x</span>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() => rack.addRow('3u')}
            className="text-left px-3 h-6 rounded kol-helper-xs text-fg-32 hover:text-fg-96 hover:bg-fg-04 transition-colors flex items-center"
          >
            + add row
          </button>

          {/* Zoom */}
          <div className="flex items-center justify-between px-3 h-6 mt-2">
            <span className="kol-helper-xs text-fg-48">Zoom</span>
            <div className="flex items-center gap-2">
              <span
                onClick={() => onZoomChange?.(Math.max(0.5, (zoom || 1) - 0.1))}
                className="kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
              >−</span>
              <input
                type="text"
                inputMode="numeric"
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
                className="kol-helper-xs text-fg-64 bg-transparent text-right border-none outline-none"
                style={{ width: 32 }}
              />
              <span className="kol-helper-xs text-fg-32">%</span>
              <span
                onClick={() => onZoomChange?.(Math.min(2, (zoom || 1) + 0.1))}
                className="kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
              >+</span>
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
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -4, width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', pointerEvents: 'none' }} />
      </div>
      <div className="p-4" style={{ height: presetHeight, overflowY: 'auto' }}>
        <div className="kol-helper-xs text-fg-48 mb-3 uppercase">Presets</div>
        <div className="flex flex-col gap-0.5">
          {Object.keys(patches).map(name => {
            const p = patches[name]
            const count = p.connections ? p.connections.length : 0
            return (
              <button
                key={name}
                onClick={() => {
                  if (p.rows) rack.loadPreset(p)
                  routing?.loadPatch(p.connections || [])
                }}
                className="text-left px-3 h-6 rounded kol-helper-xs text-fg-64 hover:text-fg-96 hover:bg-fg-04 transition-colors flex items-center justify-between"
              >
                <span>{name}</span>
                <span className="text-fg-32">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-fg-08 flex items-center justify-between">
        <span
          onClick={() => rack.setEditMode(!rack.editMode)}
          className="kol-helper-xs cursor-pointer select-none"
          style={{ color: rack.editMode ? 'rgba(231,76,60,0.9)' : undefined }}
        >
          [{rack.editMode ? 'Editing' : 'Modules'}]
        </span>
        <div className="kol-helper-xs text-fg-48" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          [Cables
          <span onClick={() => onCableLocked?.(!cableLocked)} className="hover:text-fg-96 cursor-pointer" style={{ color: cableLocked ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <RackIcon name={cableLocked ? 'cable-lock' : 'cable-unlock'} size={14} />
          </span>
          <span onClick={() => onCableVisibility?.(cableVisibility === 'on' ? 'off' : cableVisibility === 'off' ? 'trans' : 'on')} className="hover:text-fg-96 cursor-pointer" style={{ color: cableVisibility === 'off' ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <RackIcon name={cableVisibility === 'on' ? 'cable-on' : cableVisibility === 'off' ? 'cable-off' : 'cable-trans'} size={14} />
          </span>]
        </div>
      </div>
    </div>
  )
}
