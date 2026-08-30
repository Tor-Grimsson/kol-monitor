import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MODULE_DEFS, CATEGORIES } from '../modules/registry'
import Button from '../components/atoms/Button'
import Divider from '../components/atoms/Divider'
import Icon from '../icons/Icon'
import { PageShell, PageHeader } from '@kolkrabbi/kol-shell'
import { ContentFilters, ContentCard, ContentRow } from '@kolkrabbi/kol-component'
import CaseRowDialog from '../components/CaseRowDialog'
import RackViewport from '../rack/RackViewport.jsx'
import CaseHpDialog from '../components/CaseHpDialog'
import usePersistedState from '../hooks/usePersistedState'
import { useRack } from '../hooks/useRackContext.jsx'
import { usePatchRouting } from '../hooks/usePatchRouting.jsx'

const allModules = Object.entries(MODULE_DEFS).map(([type, def]) => ({
  type, ...def,
  u_label: `${def.u}U`,
  // Authored case — the DS cards render strings as written (no auto-casing)
  categoryLabel: def.category.charAt(0).toUpperCase() + def.category.slice(1),
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
  const dotGridRef = useRef(null)
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
  const justDraggedRef = useRef(false)

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
  const rack = useRack()
  const routing = usePatchRouting()
  const [searchParams] = useSearchParams()
  const resetDone = useRef(false)
  useLayoutEffect(() => {
    if (resetDone.current) return
    resetDone.current = true
    if (searchParams.get('from') !== 'rack') {
      rack.resetRack()
      routing.loadPatch([])
    }
  }, [])
  const rows = rack.rows
  const [caseHp, setCaseHp] = usePersistedState('caseHp', 104)

  const addModule = (type) => {
    const def = MODULE_DEFS[type]
    if (!def) return
    const targetHeight = def.u === 1 ? '1u' : '3u'
    const row = rows.find(r => r.height === targetHeight)
    if (row) rack.addModule(type, row.id)
    setView('case')
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
        justDraggedRef.current = true
        addModule(type)
        setDraggingModule(null)
        requestAnimationFrame(() => { justDraggedRef.current = false })
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const moveModule = (rowIdx, modId, newOffset) => {
    rack.moveModule(rowIdx, modId, newOffset)
  }

  const removeModule = (rowIdx, modIdx) => {
    const row = rows[rowIdx]
    if (!row) return
    const mod = row.modules[modIdx]
    if (mod) rack.sendToWorkbench(mod.id)
  }

  const totalModules = rows.reduce((s, r) => s + r.modules.length, 0)
  const totalU = rows.reduce((s, r) => s + (r.height === '1u' ? 1 : 3), 0)

  const openInRack = () => navigate('/rack')

  return (
    /* Create sits on the app tier's fg-02 (AppLayout); only the rack steps up to fg-04 */
    <PageShell mode="fixed" style={{ '--kol-shell-page-wash': 'var(--kol-fg-02)', position: 'relative', isolation: 'isolate' }}>
      {/* the dot grid on the WHOLE page — over the wash, under the chrome, the
        * padding ignored (inset 0 spans the padding box). RackViewport drives it
        * through gridRef so it still rides zoom/pan (user, 2026-08-27). */}
      {showCase && <div ref={dotGridRef} aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }} />}
      {/* the masthead is `PageHeader`, not an h1 + p pair copied off its classes
        * — the hand-rolled version sat at 61.2 (mb 8 instead of the role's 12)
        * against every other page's 65.2. `title` and `subtitle` take nodes, so
        * the editable inputs drop straight in and the rhythm comes from the DS. */}
      <PageHeader
        size="sm"
        voice="mono"
        title={
          <input
            ref={titleRef}
            type="text"
            value={caseName}
            onChange={e => setCaseName(e.target.value)}
            readOnly={!editingName}
            className="block p-0 h-[35.2px] leading-[35.2px] bg-transparent outline-none text-fg-96 kol-mono-heading-03"
            style={{ width: `${caseName.length + 1}ch`, cursor: editingName ? 'text' : 'default', border: 'none', boxShadow: editingName ? 'inset 0 -1px 0 rgba(255,255,255,0.12)' : 'none', caretColor: editingName ? 'auto' : 'transparent', pointerEvents: editingName ? 'auto' : 'none' }}
          />
        }
        subtitle={
          <input
            type="text"
            value={caseDescription}
            onChange={e => setCaseDescription(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false) }}
            readOnly={!editingName}
            className="block p-0 h-[18px] leading-[18px] bg-transparent outline-none text-fg-48 kol-mono-14"
            style={{ width: `${caseDescription.length + 1}ch`, cursor: editingName ? 'text' : 'default', border: 'none', boxShadow: editingName ? 'inset 0 -1px 0 rgba(255,255,255,0.12)' : 'none', caretColor: editingName ? 'auto' : 'transparent', pointerEvents: editingName ? 'auto' : 'none' }}
          />
        }
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ContentFilters
          tone="sunken"
          items={view === 'case' ? [] : allModules}
          title={view === 'case' ? 'Case' : 'All Modules'}
          totalCount={view === 'case' ? totalModules : allModules.length}
          filterGroups={view === 'case' ? [] : MODULE_FILTER_GROUPS}
          mutuallyExclusiveFilters={['category', 'u_label']}
          showCountOnlyWhenFiltering
          headerActions={
            <Button
              variant="nav"
              size="md"
              iconOnly="edit"
              aria-label="Rename case"
              title="Rename case"
              onPointerDown={(e) => {
                e.preventDefault()
                setEditingName(prev => {
                  if (prev) {
                    titleRef.current?.blur()
                    window.getSelection()?.removeAllRanges()
                    return false
                  }
                  requestAnimationFrame(() => { titleRef.current?.focus(); titleRef.current?.select() })
                  return true
                })
              }}
            />
          }
          viewModeOptions={[
            { value: 'case', label: 'CASE' },
            { value: 'modules', label: 'MODULES' },
          ]}
          viewMode={view}
          onViewModeChange={setView}
          layoutOptions={view === 'modules' ? [
            { value: 'list', label: 'LIST' },
            { value: 'grid', label: 'GRID' },
          ] : undefined}
          defaultLayout="list"
          renderItem={(items, viewMode, layout) => {
            if (view === 'case') {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  {addingRow && (
                    <CaseRowDialog
                      rows={rows}
                      onAddRow={(height) => rack.addRow(height)}
                      onToggleRowHeight={(ri) => { const row = rows[ri]; if (row) rack.setRowHeight(row.id, row.height === '1u' ? '3u' : '1u') }}
                      onRemoveRow={(ri) => { const row = rows[ri]; if (row) rack.removeRow(row.id) }}
                    />
                  )}
                  {showHpPicker && (
                    <CaseHpDialog caseHp={caseHp} onSetHp={setCaseHp} />
                  )}
                  {(addingRow || showHpPicker) && <Divider className="mb-4" />}
                  {showCase && <RackViewport gridRef={dotGridRef} style={{ flex: 1, margin: '0 calc(var(--kol-shell-page-pad) * -1)' }} editMode={false} />}
                </div>
              )
            }

            if (layout === 'grid') {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                  {items.map(m => (
                    <div key={m.type} onPointerDown={(e) => handleModuleDragStart(m.type, e)}>
                      <ContentCard
                        variant="catalog"
                        fit="natural"
                        title={m.label}
                        detail={`${m.hp}HP ${m.u}U — ${m.categoryLabel}`}
                        media={<img src={`/previews/modules/${m.type}.png`} alt={m.label} />}
                        onClick={() => { if (justDraggedRef.current) return; addModule(m.type) }}
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
                    <ContentRow
                      variant="catalog"
                      title={m.label}
                      actions={
                        <span
                          onClick={(e) => { e.stopPropagation(); if (justDraggedRef.current) return; addModule(m.type) }}
                          className="cursor-pointer flex items-center gap-2 kol-helper-10 text-fg-80"
                        >
                          INSERT
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--kol-palette-red)', flexShrink: 0 }} />
                        </span>
                      }
                    />
                  </div>
                ))}
              </div>
            )
          }}
        />

        {/* `--monitor-rail` (AppLayout): the rail's width or 0 when hidden — a fixed layer must follow it itself */}
        <div className="fixed flex items-center justify-between" style={{ bottom: 24, left: 'calc(var(--monitor-rail, var(--kol-shell-rail-width)) + 24px)', right: 24 }}>
        <div className="flex items-center gap-2">
          <span onClick={() => setCaseZoom(z => Math.max(0.1, z - 0.1))} className="kol-helper-12 text-fg-48 hover:text-fg-96 cursor-pointer select-none">−</span>
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
            className="kol-helper-12 text-fg-64 bg-transparent text-right border-none outline-none"
            style={{ width: 32 }}
          />
          <span className="kol-helper-12 text-fg-32">%</span>
          <span onClick={() => setCaseZoom(z => Math.min(2, z + 0.1))} className="kol-helper-12 text-fg-48 hover:text-fg-96 cursor-pointer select-none">+</span>
          <span onClick={() => navigate('/rack')} className="kol-helper-12 text-fg-48 module-detail-code-link cursor-pointer select-none" style={{ marginLeft: 16 }}>[Open in Rack]</span>
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
          <span className="kol-helper-14 text-fg-96 bg-fg-08 px-3 py-1 rounded" style={{ whiteSpace: 'nowrap' }}>
            {MODULE_DEFS[draggingModule]?.label}
          </span>
        </div>
      )}
    </PageShell>
  )
}
