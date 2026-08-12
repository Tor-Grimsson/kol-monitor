// ModuleLibraryGrid — module catalog palette: category rail + preview grid + row picker
// Shared by the edit-mode Workbench panel and (later) the Cmd+K overlay.

import { useState, useMemo } from 'react'
import { MODULE_DEFS, CATEGORIES, getModulesByCategory } from '../modules/registry'
import { TOTAL_HP, hpToPx } from '../modules/utility/eurorack'

const CATEGORY_LABELS = {
  control: 'Control',
  math: 'Math',
  generators: 'Generators',
  display: 'Display',
  utility: 'Utility',
}

function ModuleCard({ type, hp, u, selected, rows, onSelect, onAddToRow }) {
  const def = MODULE_DEFS[type]
  if (!def) return null
  const aspectDiv = u === 1 ? 12 : 4
  const targetHeight = u === 1 ? '1u' : '3u'
  const compatibleRows = rows?.filter(r => r.height === targetHeight) || []

  return (
    <div
      onClick={() => onSelect(selected ? null : type)}
      style={{
        width: hpToPx(hp),
        aspectRatio: `${hp * aspectDiv} / ${TOTAL_HP}`,
        flexShrink: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: selected ? 1 : 0.8,
        transition: 'opacity 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.opacity = 0.8 }}
    >
      <img src={`/previews/modules/${type}.png`} alt={def.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {selected && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {compatibleRows.map(row => (
            <span
              key={row.id}
              className="text-fg-48 hover:text-fg-96 kol-helper-10 cursor-pointer"
              onPointerDown={(e) => { e.stopPropagation(); onAddToRow(type, row.id); onSelect(null) }}
            >Row {rows.indexOf(row) + 1}</span>
          ))}
          {compatibleRows.length === 0 && (
            <span className="text-fg-32 kol-helper-10">No {targetHeight.toUpperCase()} row</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ModuleLibraryGrid({
  rows,
  onAddModule,
  searchText = '',
  showCategoryRail = true,
}) {
  const [category, setCategory] = useState(null)
  const [uFilter, setUFilter] = useState(null)
  const [selectedType, setSelectedType] = useState(null)

  const libraryModules = useMemo(() => {
    const base = category
      ? getModulesByCategory(category)
      : CATEGORIES.flatMap(c => getModulesByCategory(c))
    const uFiltered = base.filter(m => uFilter === null || m.u === uFilter)
    const q = searchText.trim().toLowerCase()
    if (!q) return uFiltered
    return uFiltered.filter(m =>
      m.label?.toLowerCase().includes(q) ||
      m.type?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    )
  }, [category, uFilter, searchText])

  return (
    <div className="flex" style={{ flex: 1, minHeight: 0 }}>
      {showCategoryRail && (
        <div className="flex flex-col gap-1 pr-4 shrink-0" style={{ paddingTop: 12 }}>
          <div className="flex gap-2">
            <span
              onClick={() => setUFilter(uFilter === 3 ? null : 3)}
              className={`kol-helper-12 select-none cursor-pointer ${uFilter === 3 ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
            >3U</span>
            <span
              onClick={() => setUFilter(uFilter === 1 ? null : 1)}
              className={`kol-helper-12 select-none cursor-pointer ${uFilter === 1 ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
            >1U</span>
          </div>
          <div className="border-t border-fg-08" />
          <span
            onClick={() => setCategory(null)}
            className={`kol-helper-12 select-none cursor-pointer ${category === null ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
          >All</span>
          {CATEGORIES.map(cat => (
            <span
              key={cat}
              onClick={() => setCategory(category === cat ? null : cat)}
              className={`kol-helper-12 select-none cursor-pointer ${category === cat ? 'text-fg-64' : 'text-fg-32 hover:text-fg-48'}`}
            >{CATEGORY_LABELS[cat]}</span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-1 flex-1" style={{ paddingTop: 12, overflowX: 'auto', overflowY: 'hidden', flexWrap: 'nowrap' }}>
        {libraryModules.map(mod => (
          <ModuleCard
            key={mod.type}
            type={mod.type}
            hp={mod.hp}
            u={mod.u}
            selected={selectedType === mod.type}
            rows={rows}
            onSelect={setSelectedType}
            onAddToRow={(type, rowId) => onAddModule?.(type, rowId)}
          />
        ))}
      </div>
    </div>
  )
}
