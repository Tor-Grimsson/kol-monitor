// Workbench — bottom panel with two tabs: Workbench (held modules) and Library (module catalog)
// Drag top edge to resize

import { useState, useRef, useCallback } from 'react'
import { MODULE_DEFS, CATEGORIES, getModulesByCategory } from './moduleRegistry'
import Divider from './components/atoms/Divider'
import { TOTAL_HP, hpToPx } from './modules/utility/eurorack'
import Module from './modules/utility/Module'

const DEFAULT_HEIGHT = Math.round(window.innerHeight * 0.3)
const MIN_HEIGHT = 80
const MAX_HEIGHT = 600

const CATEGORY_LABELS = {
  control: 'Control',
  math: 'Math',
  generators: 'Generators',
  display: 'Display',
  utility: 'Utility',
}

function ModuleCard({ type, hp, u, onClick }) {
  const def = MODULE_DEFS[type]
  if (!def) return null
  const Comp = def.component
  const aspectDiv = u === 1 ? 12 : 4
  return (
    <div
      onClick={onClick}
      style={{
        width: hpToPx(hp),
        aspectRatio: `${hp * aspectDiv} / ${TOTAL_HP}`,
        flexShrink: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: 0.8,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
      onMouseLeave={e => { e.currentTarget.style.opacity = 0.8 }}
    >
      <Comp id={`preview_${type}`} preview />
    </div>
  )
}

export default function Workbench({ modules, onReturn, onAddModule }) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [tab, setTab] = useState('workbench')
  const [category, setCategory] = useState(null)
  const [uFilter, setUFilter] = useState(null)
  const dragging = useRef(false)

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

  const libraryModules = (category
    ? getModulesByCategory(category)
    : CATEGORIES.flatMap(c => getModulesByCategory(c))
  ).filter(m => uFilter === null || m.u === uFilter)

  return (
    <div className="border-t border-fg-08 bg-surface-primary" style={{ flexShrink: 0 }}>
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
          <span
            onClick={(e) => { e.stopPropagation(); setTab('workbench') }}
            className={`kol-helper-xs uppercase select-none cursor-pointer ${tab === 'workbench' ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
          >Workbench</span>
          <span
            onClick={(e) => { e.stopPropagation(); setTab('library') }}
            className={`kol-helper-xs uppercase select-none cursor-pointer ${tab === 'library' ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
          >Library</span>
        </div>

        <Divider />

        <div className="flex" style={{ flex: 1, minHeight: 0 }}>
        {/* Category filters (library only) */}
        {tab === 'library' && (
          <div className="flex flex-col gap-1 pr-4 shrink-0">
            <div className="flex gap-2">
              <span
                onClick={() => setUFilter(uFilter === 3 ? null : 3)}
                className={`kol-helper-xs select-none cursor-pointer ${uFilter === 3 ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
              >3U</span>
              <span
                onClick={() => setUFilter(uFilter === 1 ? null : 1)}
                className={`kol-helper-xs select-none cursor-pointer ${uFilter === 1 ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
              >1U</span>
            </div>
            <div className="border-t border-fg-08" />
            <span
              onClick={() => setCategory(null)}
              className={`kol-helper-xs select-none cursor-pointer ${category === null ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
            >All</span>
            {CATEGORIES.map(cat => (
              <span
                key={cat}
                onClick={() => setCategory(category === cat ? null : cat)}
                className={`kol-helper-xs select-none cursor-pointer ${category === cat ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
              >{CATEGORY_LABELS[cat]}</span>
            ))}
          </div>
        )}

        {/* Modules */}
        <div className="flex items-start gap-1 flex-1" style={{ paddingTop: 12, overflow: 'auto', flexWrap: 'wrap' }}>
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
                  <span className="kol-helper-xxs" style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Placeholder</span>
                </div>
              </div>
            </Module>
          </div>
        )}

        {tab === 'workbench' && modules.map(mod => {
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

        {tab === 'library' && libraryModules.map(mod => (
          <ModuleCard
            key={mod.type}
            type={mod.type}
            hp={mod.hp}
            u={mod.u}
            onClick={() => onAddModule?.(mod.type)}
          />
        ))}
        </div>
        </div>
      </div>
    </div>
  )
}
