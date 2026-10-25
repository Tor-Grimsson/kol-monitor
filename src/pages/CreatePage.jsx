import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { StudioCreate, StudioCreateAction } from '@kolkrabbi/kol-shell'
import { Button, Slider } from '@kolkrabbi/kol-component'
import { MODULE_DEFS } from '../modules/registry'
import RackViewport from '../rack/RackViewport.jsx'
import usePersistedState from '../hooks/usePersistedState'
import { useRack } from '../hooks/useRackContext.jsx'
import { usePatchRouting } from '../hooks/usePatchRouting.jsx'
import { useShipped } from './shipped'

/**
 * CreatePage — `/create` ON `StudioCreate` (user 2026-10-24: *"same issue wrong everything in create"* · *"WHY DID THE
 * PAGEHEADER CHANGE"*). Monitor's own page was the SOURCE `StudioCreate` was read off, and it kept running its own copy
 * — the mono masthead, the old catalog cards and rows, its own grids — so it drifted from studio-hub on every one. The
 * page is kol-shell's now, as studio-hub's is: the display masthead (editable, the pencil in the filter row), the one
 * filter row with CASE ⇄ MODULES, the `app` part card and row with Insert, the rack's own viewport on the whole-page
 * dot grid through the `canvas` seam, the bottom bar with the zoom readout. What stays Monitor's is the MODEL — the
 * rack store, the rows and HP, drag-to-place, `?insert=` — and the three bar actions: Rows, HP, Case preview. The
 * old page and its two dialogs are in `_tmp/2026-10-24-create-on-studiocreate/`.
 */

const MODULE_FILTER_GROUPS = [
  { label: 'Category', key: 'category', values: ['control', 'math', 'generators', 'display', 'utility'], exclusive: true },
  { label: 'Size', key: 'u_label', values: ['1U', '3U'], exclusive: true },
]

export default function CreatePage() {
  const navigate = useNavigate()
  const [caseName, setCaseName] = usePersistedState('caseName', 'Untitled')
  const [caseDescription, setCaseDescription] = usePersistedState('caseDescription', 'Design a new case')
  const [page, setPage] = useState('case')
  const [rowsOpen, setRowsOpen] = useState(false)
  const [hpOpen, setHpOpen] = useState(false)
  const [showCase, setShowCase] = useState(true)
  const [draggingModule, setDraggingModule] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const justDraggedRef = useRef(false)

  /* THE ZOOM IS THE VIEWPORT'S (RackViewport's keys, wheel and pinch write it): the page's readout reads it back through
     `onZoomChange` and writes it through `zoomSetterRef` — one store */
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const zoomSetterRef = useRef(null)
  const onViewChange = (next) => { setView(next); zoomSetterRef.current?.(next.zoom) }
  const onZoomChange = useCallback((z) => setView((v) => (v.zoom === z ? v : { ...v, zoom: z })), [])

  const rack = useRack()
  const routing = usePatchRouting()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  /* Runs per ARRIVAL (location.key), not per mount: Create tapped in the rail while already on Create is a new key on
     the same component — a new case. RETURNING is not: history back lands on the same key it left, so a key seen before
     keeps the case (a module's page → Back, 2026-09-02). `from=rack` / `from=create` / `insert=` keep it too. */
  useLayoutEffect(() => {
    const from = searchParams.get('from')
    let returning = false
    try { returning = sessionStorage.getItem('create-key') === location.key; sessionStorage.setItem('create-key', location.key) } catch { /* storage blocked */ }
    if (!returning && from !== 'rack' && from !== 'create' && !searchParams.get('insert')) {
      rack.resetRack()
      routing.loadPatch([])
      setPage('case') // eslint-disable-line react-hooks/set-state-in-effect -- a new arrival resets the page with the case, same commit
    }
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = rack.rows

  /* place it, then SHOW you where it went */
  const addModule = (type) => {
    const def = MODULE_DEFS[type]
    if (!def) return
    const targetHeight = def.u === 1 ? '1u' : '3u'
    const row = rows.find(r => r.height === targetHeight)
    if (row) rack.addModule(type, row.id)
    setPage('case')
  }

  /* `/create?insert=<type>` — the module page's INSERT (2026-09-02): add it once, then clean the URL so a reload does not add it again */
  const insertDone = useRef(false)
  useEffect(() => {
    const type = searchParams.get('insert')
    if (!type || insertDone.current) return
    insertDone.current = true
    addModule(type)
    navigate('/create?from=create', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* drag-to-place: 8px threshold, the view flips to the case mid-drag, a ghost under the pointer; a finger on the list
     scrolls it — INSERT is the touch action (2026-09-02) */
  const handleModuleDragStart = (type, e) => {
    if (e.pointerType === 'touch') return
    const startX = e.clientX
    const startY = e.clientY
    let started = false
    const onMove = (me) => {
      if (!started && Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY) > 8) {
        started = true
        setDraggingModule(type)
        setPage('case')
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

  const totalModules = rows.reduce((s, r) => s + r.modules.length, 0)

  /* THE PARTS ARE THE ONE CARD (user 2026-10-24: every card the same fields and icons — there is no part card): the
   * module definitions as the Library's files, with their verbs; Insert is StudioCreate's; a click opens the page.
   * `src` is the module type (a duplicated file keeps its origin's) */
  const { modules, card } = useShipped()
  const partCard = (f) => { const c = card(f); return { ...c, onClick: () => { if (justDraggedRef.current) return; navigate(`/library/module/${f.src}`, { state: { from: 'create' } }) } } }

  /* the controls ABOVE the case, each shown by one of the bar's actions — studio-hub's row controls, and the HP slider */
  const caseControls = (rowsOpen || hpOpen) ? (
    <div className="flex flex-col gap-6 pb-6">
      {rowsOpen && (
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-2">
            <Button size="sm" tone="grey" onClick={() => rack.addRow('1u')}>Add 1U row</Button>
            <Button size="sm" tone="grey" onClick={() => rack.addRow('3u')}>Add 3U row</Button>
          </div>
          <div className="flex flex-col items-end gap-2">
            {rows.map((r, i) => (
              <Button key={r.id} size="sm" tone="grey" iconRight="trash" onClick={() => rack.removeRow(r.id)}>{`Row ${i + 1}, ${r.height.toUpperCase()}`}</Button>
            ))}
          </div>
        </div>
      )}
      {hpOpen && (
        <div className="flex items-center justify-between gap-4">
          <div style={{ width: 400 }}>
            {/* HP is the rack's — the DS slider draws the readout */}
            <Slider min={40} max={200} step={2} value={rack.caseHp} onChange={rack.setCaseHp} readout="value" formatValue={(v) => `${v}HP`} aria-label="Case HP" className="w-full" />
          </div>
        </div>
      )}
    </div>
  ) : null

  return (
    <>
      <StudioCreate
        header={{ title: caseName, subtitle: caseDescription, onTitleChange: setCaseName, onSubtitleChange: setCaseDescription }}
        parts={modules}
        partGroups={MODULE_FILTER_GROUPS}
        toCard={partCard}
        onPlace={(f) => addModule(f.src)}
        onPartPointerDown={(f, e) => handleModuleDragStart(f.src, e)}
        labels={{ case: 'CASE', parts: 'MODULES', partsTitle: 'All Modules', caseTitle: 'Case' }}
        caseCount={totalModules}
        showCase={showCase}
        page={page}
        onPageChange={setPage}
        view={view}
        onViewChange={onViewChange}
        caseControls={caseControls}
        caseActions={(
          <>
            <StudioCreateAction icon="row" label="Rows" pressed={rowsOpen} onClick={() => setRowsOpen((v) => !v)} />
            <StudioCreateAction icon="panel-left" label="HP" pressed={hpOpen} onClick={() => setHpOpen((v) => !v)} />
            <StudioCreateAction icon="grid" label="Case preview" pressed={showCase} onClick={() => setShowCase((v) => !v)} />
          </>
        )}
        caseLink={{ label: 'Open in Rack', onClick: () => navigate('/rack') }}
        /* the rack's own viewport (snap keys, cables, the workbench) on the page's grid — the canvas seam */
        canvas={({ gridRef }) => (
          <RackViewport
            gridRef={gridRef}
            style={{ flex: 1, margin: '0 calc(var(--kol-shell-page-pad) * -1)', overflow: 'visible' }}
            editMode={false}
            onZoomChange={onZoomChange}
            zoomSetterRef={zoomSetterRef}
          />
        )}
      />

      {draggingModule && (
        <div className="fixed z-50 pointer-events-none" style={{ left: dragPos.x + 12, top: dragPos.y - 12 }}>
          <span className="kol-helper-14 text-fg-96 bg-fg-08 px-3 py-1 rounded" style={{ whiteSpace: 'nowrap' }}>
            {MODULE_DEFS[draggingModule]?.label}
          </span>
        </div>
      )}
    </>
  )
}
