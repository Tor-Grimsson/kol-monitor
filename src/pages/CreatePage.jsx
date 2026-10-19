import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useNarrow } from '../hooks/useNarrow.js'
import { MODULE_DEFS, CATEGORIES } from '../modules/registry'
import Button from '../components/atoms/Button'
import Divider from '@kolkrabbi/kol-component/atoms/Divider'
import { PageShell } from '@kolkrabbi/kol-shell'
import { PageHeader, PAGE_HEADER_ROLES } from '@kolkrabbi/kol-component'
import { ContentFilters, ContentCard, ContentRow } from '@kolkrabbi/kol-component'
import Input from '@kolkrabbi/kol-component/atoms/Input'
import IconToggle from '@kolkrabbi/kol-component/atoms/IconToggle'
import { Tooltip } from '@kolkrabbi/kol-component/utilities/Popover'
import { Icon } from '@kolkrabbi/kol-icons'
import CaseRowDialog from '../components/CaseRowDialog'
import RackViewport from '../rack/RackViewport.jsx'
import ModuleSearch from '../rack/ModuleSearch.jsx'
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
  const narrow = useNarrow()
  const [caseName, setCaseName] = usePersistedState('caseName', 'Untitled')
  const [caseDescription, setCaseDescription] = usePersistedState('caseDescription', 'Design a new case')
  const [editingName, setEditingName] = useState(false)
  const titleRef = useRef(null)
  const dotGridRef = useRef(null)
  const [view, setView] = useState('case')
  const [addingRow, setAddingRow] = useState(false)
  const [showHpPicker, setShowHpPicker] = useState(false)
  const [showCase, setShowCase] = useState(true)
  const [caseZoom, setCaseZoom] = useState(1) // mirrors the viewport's zoom (onZoomChange)
  const zoomSetterRef = useRef(null) // the viewport's setZoom — the bar writes through it
  const applyZoom = (fn) => zoomSetterRef.current?.(fn)
  const [zoomInput, setZoomInput] = useState('100')
  const [lastInserted, setLastInserted] = useState(null)
  const [draggingModule, setDraggingModule] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const zoomInputEditing = useRef(false)
  const justDraggedRef = useRef(false)

  useEffect(() => {
    if (!zoomInputEditing.current) setZoomInput(String(Math.round(caseZoom * 100)))
  }, [caseZoom])

  /* +/−/0 are the viewport's own keys (RackViewport) — no second listener here. */
  const rack = useRack()
  const routing = usePatchRouting()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  /* Runs per ARRIVAL (location.key), not per mount: Create tapped in the rail
     while already on Create is a new key on the same component — a new case.
     A fresh arrival is a new case. RETURNING is not: history back lands on the
     same key it left, so a key seen before keeps the case (a module's page →
     Back, 2026-09-02). `from=rack` / `from=create` / `insert=` keep it too. */
  useLayoutEffect(() => {
    const from = searchParams.get('from')
    let returning = false
    try { returning = sessionStorage.getItem('create-key') === location.key; sessionStorage.setItem('create-key', location.key) } catch { /* storage blocked */ }
    if (!returning && from !== 'rack' && from !== 'create' && !searchParams.get('insert')) {
      rack.resetRack()
      routing.loadPatch([])
      setView('case')
    }
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = rack.rows

  /* `/create?insert=<type>` — the module page's INSERT (2026-09-02): add it once,
     then clean the URL so a reload does not add it again */
  const insertDone = useRef(false)
  useEffect(() => {
    const type = searchParams.get('insert')
    if (!type || insertDone.current) return
    insertDone.current = true
    addModule(type)
    navigate('/create?from=create', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ⌘K — the rack's module search, adding into the case being designed (plan 14 2.2: Create never bound it,
     so the browser kept ⌘K for its own web search) */
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen((v) => !v) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const addModule = (type) => {
    const def = MODULE_DEFS[type]
    if (!def) return
    const targetHeight = def.u === 1 ? '1u' : '3u'
    const row = rows.find(r => r.height === targetHeight)
    if (row) rack.addModule(type, row.id)
    setView('case')
  }

  /* INSERT — the one explicit way to add from the list (touch has no drag). Its own
     tap; the card / row itself opens the module's page (user, 2026-09-02). */
  const InsertAction = ({ type }) => (
    <Button
      size="sm"
      onClick={(e) => { e.stopPropagation(); if (justDraggedRef.current) return; addModule(type) }}
    >
      INSERT
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--kol-palette-red)', flexShrink: 0, marginLeft: 8 }} />
    </Button>
  )

  const handleModuleDragStart = (type, e) => {
    if (e.pointerType === 'touch') return // a finger on the list scrolls it; INSERT is the touch action (2026-09-02)
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
    /* Create sits on the app tier's fg-02 (the Studio's wash); only the rack steps up to fg-04 — its own PageShell, `create.shell: false` */
    <PageShell mode={view === 'case' ? 'fixed' : 'scroll'} /* the case is a fixed canvas; the modules list is a page that scrolls (2026-09-02) */ style={{ '--kol-shell-page-wash': 'var(--kol-fg-02)', position: 'relative', isolation: 'isolate' }}>
      {/* the dot grid on the WHOLE page — over the wash, under the chrome, the
        * padding ignored (inset 0 spans the padding box). RackViewport drives it
        * through gridRef so it still rides zoom/pan (user, 2026-08-27). */}
      {showCase && <div ref={dotGridRef} aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }} />}
      {/* the masthead is `PageHeader`, not an h1 + p pair copied off its classes
        * — the hand-rolled version sat at 61.2 (mb 8 instead of the role's 12)
        * against every other page's 65.2. `title` and `subtitle` take nodes, so
        * the editable inputs drop straight in and the rhythm comes from the DS. */}
      {/* chrome floats ABOVE the canvas: the case runs under the masthead and the filter row (user, 2026-09-02) */}
      <div style={{ position: 'relative', zIndex: 'var(--kol-z-sticky)' }}>
      <PageHeader
        level="app"
        title={
          <input
            ref={titleRef}
            type="text"
            value={caseName}
            onChange={e => setCaseName(e.target.value)}
            readOnly={!editingName}
            className={`block p-0 h-[46px] md:h-[60px] leading-none bg-transparent outline-none text-fg-96 ${PAGE_HEADER_ROLES.app.title}`}
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
            className={`block p-0 h-[26px] leading-[26px] bg-transparent outline-none ${PAGE_HEADER_ROLES.app.lede}`}
            style={{ width: `${caseDescription.length + 1}ch`, cursor: editingName ? 'text' : 'default', border: 'none', boxShadow: editingName ? 'inset 0 -1px 0 rgba(255,255,255,0.12)' : 'none', caretColor: editingName ? 'auto' : 'transparent', pointerEvents: editingName ? 'auto' : 'none' }}
          />
        }
      />
      </div>

      <div className="create-canvas" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ContentFilters
          tone="sunken"
          items={view === 'case' ? [] : allModules}
          title={view === 'case' ? 'Case' : 'All Modules'}
          totalCount={view === 'case' ? totalModules : allModules.length}
          filterGroups={view === 'case' ? [] : MODULE_FILTER_GROUPS}
          mutuallyExclusiveFilters={['category', 'u_label']}
          showCountOnlyWhenFiltering
          headerActions={
            <Tooltip label="Rename case" triggerClassName="inline-flex shrink-0">
              <Button
                variant="nav"
                size="md"
                iconOnly="edit"
                aria-label="Rename case"
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
            </Tooltip>
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
                    <CaseHpDialog caseHp={rack.caseHp} onSetHp={rack.setCaseHp} />
                  )}
                  {(addingRow || showHpPicker) && <Divider className="mb-4" />}
                  {showCase && <RackViewport gridRef={dotGridRef} style={{ flex: 1, margin: '0 calc(var(--kol-shell-page-pad) * -1)', overflow: 'visible' /* the canvas is the whole page: the case is never cut by the viewport's box; the chrome above it is lifted (below), not the case sunk — a sunk case sits under its own wrappers and stops receiving touches (2026-09-02) */ }} editMode={false} onZoomChange={setCaseZoom} zoomSetterRef={zoomSetterRef} />}
                </div>
              )
            }

            if (layout === 'grid') {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 24 }}>
                  {items.map(m => (
                    <div key={m.type} onPointerDown={(e) => handleModuleDragStart(m.type, e)}>
                      <ContentCard
                        variant="catalog"
                        fit={narrow ? 'compact' : 'natural'} /* 0.3 on a 163px card, 0.5 on a desk */
                        title={m.label}
                        detail={`${m.hp}HP ${m.u}U — ${m.categoryLabel}`}
                        media={<img src={`/previews/modules/${m.type}.png`} alt={m.label} />}
                        onClick={() => { if (justDraggedRef.current) return; navigate(`/library/${m.type}`, { state: { from: 'create' } }) }}
                      />
                      {/* INSERT gets its own strip under the card's text (user, 2026-09-02) */}
                      <div className="bg-surface-primary flex items-center justify-end" style={{ padding: '8px var(--kol-pad-card-md)', marginTop: 1 }}>
                        <InsertAction type={m.type} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 8 }}>
                {items.map(m => (
                  <div key={m.type} onPointerDown={(e) => handleModuleDragStart(m.type, e)}>
                    <ContentRow
                      variant="catalog"
                      title={m.label}
                      actions={<InsertAction type={m.type} />}
                      onClick={() => { if (justDraggedRef.current) return; navigate(`/library/${m.type}`, { state: { from: 'create' } }) }}
                    />
                  </div>
                ))}
              </div>
            )
          }}
        />

        {/* `--monitor-rail` (App.jsx RailFrame): the rail's width or 0 when hidden — a fixed layer must follow it itself */}
        {view === 'case' && <div className="fixed flex items-center justify-between" style={{ bottom: 24, left: 'calc(var(--monitor-rail, var(--kol-shell-rail-width)) + 24px)', right: 24 }}>
        {/* ONE tone for the bar (plan 14 7.1): unset, its Input fell back to `filled` while the toolbar search
            drew the dark well — every control here inherits the wrapper's ground instead */}
        <div className="kol-tone-sunken flex items-center gap-2">
          <Button size="sm" onClick={() => applyZoom(z => Math.max(0.1, z - 0.1))}>−</Button>
          <Input
            size="sm"
            chars={3}
            suffix="%"
            inputMode="numeric"
            inputClassName="text-right"
            value={zoomInput}
            onFocus={(e) => { zoomInputEditing.current = true; e.target.select() }}
            onChange={(e) => setZoomInput(e.target.value)}
            onBlur={() => {
              zoomInputEditing.current = false
              const v = parseInt(zoomInput, 10)
              if (!isNaN(v)) applyZoom(Math.min(2, Math.max(0.1, v / 100)))
              else setZoomInput(String(Math.round(caseZoom * 100)))
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
          />
          <Button size="sm" onClick={() => applyZoom(z => Math.min(2, z + 0.1))}>+</Button>
          <Button size="sm" style={{ marginLeft: 16 }} onClick={() => navigate('/rack')}>[Open in Rack]</Button>
        </div>
        <div className="flex items-center gap-1">
        {/* three panel toggles — DS `IconToggle` (the state is the ink, the name the tooltip); `Button pressed`
            paints the inverted fill, which the DS rules too loud for studio chrome */}
        <IconToggle size="md" icon="row" label="Rows" pressed={addingRow} onChange={setAddingRow} iconComponent={Icon} />
        <IconToggle size="md" icon="panel-left" label="HP" pressed={showHpPicker} onChange={setShowHpPicker} iconComponent={Icon} />
        <IconToggle size="md" icon="grid-3x3" label="Case preview" pressed={showCase} onChange={setShowCase} iconComponent={Icon} />
        </div>
        </div>}
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
      <ModuleSearch open={searchOpen} onClose={() => setSearchOpen(false)} rows={rows} capacity={rack.caseHp} onAdd={(type, rowId) => { rack.addModule(type, rowId); setView('case') }} />
    </PageShell>
  )
}
