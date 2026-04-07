import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULE_DEFS, CATEGORIES } from '../moduleRegistry'
import Button from '../components/atoms/Button'
import Divider from '../components/atoms/Divider'
import Icon from '../components/icons/Icon'
import PageHeader from '../components/PageHeader'
import ContentFilters from '../components/organisms/filters/ContentFilters'
import CaseRowDialog from '../components/CaseRowDialog'
import CaseArea from '../components/CaseArea'
import GridCard from '../components/atoms/GridCard'
import CaseHpDialog from '../components/CaseHpDialog'
import usePersistedState from '../hooks/usePersistedState'

const TOTAL_HP = 104

function findFreeOffset(modules, hp) {
  const sorted = [...modules].sort((a, b) => a.offset - b.offset)
  let pos = 0
  for (const m of sorted) {
    if (pos + hp <= m.offset) return pos
    pos = m.offset + m.hp
  }
  return pos + hp <= TOTAL_HP ? pos : null
}

const allModules = Object.entries(MODULE_DEFS).map(([type, def]) => ({
  type, ...def,
  u_label: `${def.u}U`,
}))

const MODULE_FILTER_GROUPS = [
  { label: 'Category', key: 'category', values: ['control', 'math', 'generators', 'display', 'utility'] },
  { label: 'Size', key: 'u_label', values: ['1U', '3U'] },
]

export default function CreatePage() {
  const navigate = useNavigate()
  const [caseName, setCaseName] = usePersistedState('caseName', 'Untitled')
  const [caseDescription, setCaseDescription] = usePersistedState('caseDescription', 'Design a new case')
  const [editingName, setEditingName] = useState(false)
  const titleRef = useRef(null)
  const [view, setView] = useState('case')
  const [addingRow, setAddingRow] = useState(false)
  const [showHpPicker, setShowHpPicker] = useState(false)
  const [showCase, setShowCase] = useState(true)
  const [caseZoom, setCaseZoom] = useState(1)
  const [zoomInput, setZoomInput] = useState('100')
  const [lastInserted, setLastInserted] = useState(null)
  const [draggingModule, setDraggingModule] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const zoomInputEditing = useRef(false)

  useEffect(() => {
    if (!zoomInputEditing.current) setZoomInput(String(Math.round(caseZoom * 100)))
  }, [caseZoom])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.closest('input, textarea')) return
      if (e.key === '=' || e.key === '+') { e.preventDefault(); setCaseZoom(z => Math.min(2, z + 0.1)) }
      if (e.key === '-') { e.preventDefault(); setCaseZoom(z => Math.max(0.1, z - 0.1)) }
      if (e.key === '0') { e.preventDefault(); setCaseZoom(1) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  const [caseHp, setCaseHp] = usePersistedState('caseHp', 104)
  const [rows, setRows] = usePersistedState('rows', [
    { height: '1u', modules: [] },
    { height: '3u', modules: [] },
  ])
  const idRef = useRef(10)

  const addModule = (type) => {
    const def = MODULE_DEFS[type]
    if (!def) return
    const targetHeight = def.u === 1 ? '1u' : '3u'
    const newId = `${type}${++idRef.current}`
    setRows(prev => {
      const updated = prev.map(r => ({ ...r, modules: [...r.modules] }))
      const row = updated.find(r => {
        if (r.height !== targetHeight) return false
        return findFreeOffset(r.modules, def.hp) !== null
      })
      if (!row) return prev
      const offset = findFreeOffset(row.modules, def.hp)
      if (offset === null) return prev
      row.modules.push({ type, id: newId, hp: def.hp, offset })
      return updated
    })
    setLastInserted(newId)
    setView('case')
    setTimeout(() => setLastInserted(null), 600)
  }

  const handleModuleDragStart = (type, e) => {
    const startX = e.clientX
    const startY = e.clientY
    let started = false

    const onMove = (me) => {
      if (!started && Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY) > 8) {
        started = true
        setDraggingModule(type)
        setView('case')
      }
      if (started) setDragPos({ x: me.clientX, y: me.clientY })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (started) {
        addModule(type)
        setDraggingModule(null)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const moveModule = (rowIdx, modId, newOffset) => {
    const snapped = Math.round(newOffset / 2) * 2
    setRows(prev => prev.map((r, ri) => {
      if (ri !== rowIdx) return r
      const mod = r.modules.find(m => m.id === modId)
      if (!mod) return r
      const others = r.modules.filter(m => m.id !== modId)
      const clamped = Math.max(0, Math.min(TOTAL_HP - mod.hp, snapped))
      const end = clamped + mod.hp
      const overlaps = others.some(m => clamped < m.offset + m.hp && end > m.offset)
      if (overlaps) return r
      return { ...r, modules: r.modules.map(m => m.id === modId ? { ...m, offset: clamped } : m) }
    }))
  }

  const removeModule = (rowIdx, modIdx) => {
    setRows(prev => prev.map((r, ri) =>
      ri === rowIdx ? { ...r, modules: r.modules.filter((_, mi) => mi !== modIdx) } : r
    ))
  }

  const totalModules = rows.reduce((s, r) => s + r.modules.length, 0)
  const totalU = rows.reduce((s, r) => s + (r.height === '1u' ? 1 : 3), 0)

  const openInRack = () => {
    const patch = {
      rows: rows.map(r => ({
        height: r.height,
        modules: r.modules.map(m => ({ type: m.type, id: m.id })),
      })),
      connections: [],
    }
    sessionStorage.setItem('customPatch', JSON.stringify(patch))
    navigate('/rack/preset/custom')
  }

  return (
    <div
      className="bg-surface-primary"
      style={{
        padding: '48px 48px', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <h1 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>
        <input
          ref={titleRef}
          type="text"
          value={caseName}
          onChange={e => setCaseName(e.target.value)}
          readOnly={!editingName}
          className="bg-transparent outline-none text-fg-96 kol-heading-sm"
          style={{ width: `${caseName.length + 1}ch`, cursor: editingName ? 'text' : 'default', border: 'none', borderBottom: editingName ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent' }}
        />
      </h1>
      <p style={{ marginBottom: 40 }}>
        <input
          type="text"
          value={caseDescription}
          onChange={e => setCaseDescription(e.target.value)}
          onBlur={() => setEditingName(false)}
          onKeyDown={e => { if (e.key === 'Enter') setEditingName(false) }}
          readOnly={!editingName}
          className="bg-transparent outline-none text-fg-48 kol-text-sm"
          style={{ width: `${caseDescription.length + 1}ch`, cursor: editingName ? 'text' : 'default', border: 'none', borderBottom: editingName ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent' }}
        />
      </p>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ContentFilters
          items={view === 'case' ? [] : allModules}
          title={view === 'case' ? 'Case' : 'All Modules'}
          totalCount={view === 'case' ? totalModules : allModules.length}
          filterGroups={view === 'case' ? [] : MODULE_FILTER_GROUPS}
          mutuallyExclusiveFilters={['category', 'u_label']}
          showCountOnlyWhenFiltering
          headerActions={
            <button
              onClick={() => { setEditingName(true); requestAnimationFrame(() => { titleRef.current?.focus(); titleRef.current?.select() }) }}
              className="p-2 hover:bg-container-secondary rounded-sm transition-colors leading-none"
              aria-label="Rename case"
              title="Rename case"
            >
              <Icon name="edit" size={16} />
            </button>
          }
          viewModeOptions={[
            { value: 'case', label: 'Case' },
            { value: 'modules', label: 'Modules' },
          ]}
          defaultViewMode="case"
          layoutOptions={view === 'modules' ? [
            { value: 'list', label: 'List' },
            { value: 'grid', label: 'Grid' },
          ] : undefined}
          defaultLayout="list"
          onFilterChange={(filters, mode) => { if (mode !== view) setView(mode) }}
          renderItem={(items, viewMode, layout) => {
            if (view === 'case') {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  {addingRow && (
                    <CaseRowDialog
                      rows={rows}
                      onAddRow={(height) => setRows(prev => [...prev, { height, modules: [] }])}
                      onToggleRowHeight={(ri) => setRows(prev => prev.map((r, i) => i === ri ? { ...r, height: r.height === '1u' ? '3u' : '1u' } : r))}
                      onRemoveRow={(ri) => setRows(prev => prev.filter((_, i) => i !== ri))}
                    />
                  )}
                  {showHpPicker && (
                    <CaseHpDialog caseHp={caseHp} onSetHp={setCaseHp} />
                  )}
                  {(addingRow || showHpPicker) && <Divider className="mb-4" />}
                  {showCase && <CaseArea rows={rows} zoom={caseZoom} onZoomChange={setCaseZoom} lastInserted={lastInserted} onMoveModule={moveModule} />}
                </div>
              )
            }

            if (layout === 'grid') {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                  {items.map(m => (
                    <div key={m.type} onPointerDown={(e) => handleModuleDragStart(m.type, e)}>
                      <GridCard
                        title={m.label}
                        detail={`${m.hp}HP ${m.u}U — ${m.category}`}
                        preview={<img src={`/previews/modules/${m.type}.png`} alt={m.label} />}
                        onClick={() => addModule(m.type)}
                      />
                    </div>
                  ))}
                </div>
              )
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {items.map(m => (
                  <div key={m.type} onPointerDown={(e) => handleModuleDragStart(m.type, e)}>
                    <GridCard
                      variant="list"
                      title={m.label}
                      action={
                        <span
                          onClick={(e) => { e.stopPropagation(); addModule(m.type) }}
                          className="cursor-pointer"
                          style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c0392b', flexShrink: 0 }}
                        />
                      }
                    />
                  </div>
                ))}
              </div>
            )
          }}
        />

        <div className="fixed flex items-center justify-between" style={{ bottom: 24, left: 72, right: 24 }}>
        <div className="flex items-center gap-2">
          <span onClick={() => setCaseZoom(z => Math.max(0.1, z - 0.1))} className="kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none">−</span>
          <input
            type="text"
            inputMode="numeric"
            value={zoomInput}
            onFocus={(e) => { zoomInputEditing.current = true; e.target.select() }}
            onChange={(e) => setZoomInput(e.target.value)}
            onBlur={() => {
              zoomInputEditing.current = false
              const v = parseInt(zoomInput, 10)
              if (!isNaN(v)) setCaseZoom(Math.min(2, Math.max(0.1, v / 100)))
              else setZoomInput(String(Math.round(caseZoom * 100)))
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
            className="kol-helper-xs text-fg-64 bg-transparent text-right border-none outline-none"
            style={{ width: 32 }}
          />
          <span className="kol-helper-xs text-fg-32">%</span>
          <span onClick={() => setCaseZoom(z => Math.min(2, z + 0.1))} className="kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none">+</span>
        </div>
        <div className="flex items-center gap-1">
        <button
          onClick={() => setAddingRow(v => !v)}
          className="text-fg-80 hover:text-fg-96 transition-colors cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 8, lineHeight: 0 }}
          title="Rows"
        >
          <Icon name="row" size={20} />
        </button>
        <button
          onClick={() => setShowHpPicker(v => !v)}
          className="text-fg-80 hover:text-fg-96 transition-colors cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 8, lineHeight: 0 }}
          title="HP"
        >
          <Icon name="panel-left" size={20} />
        </button>
        <button
          onClick={() => setShowCase(v => !v)}
          className="text-fg-80 hover:text-fg-96 transition-colors cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 8, lineHeight: 0 }}
          title="Case preview"
        >
          <Icon name="grid-03" size={20} />
        </button>
        </div>
        </div>
      </div>

      {draggingModule && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: dragPos.x + 12, top: dragPos.y - 12 }}
        >
          <span className="kol-helper-s text-fg-96 bg-fg-08 px-3 py-1 rounded" style={{ whiteSpace: 'nowrap' }}>
            {MODULE_DEFS[draggingModule]?.label}
          </span>
        </div>
      )}
    </div>
  )
}
