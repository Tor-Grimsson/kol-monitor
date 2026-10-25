// Workbench — the edit-mode bottom Rail (plan 14 W4; plan 16 W3, user 2026-10-24: "edit rack library would be a rail
// like siderail inside the bottomrail? then Case and Parked could use height better"). `Rail role="bottom"` runs the
// full width over the nav rail with `RailNav` inside it — Edit · Rack · Library as the collapsed nav rail's glyphs,
// under the nav rail's rows (RailRolesOnMonitor 2026-10-25) — and the view to its right fills the bottom Rail's height:
//   EDIT     Case (the rows) and Parked (modules taken out of the rack) side by side, a draggable divider between
//            them. A parked module is drawn WHOLE at the shelf's height — click returns it, × deletes it.
//   RACK     the modules in this rack, row by row, each with an × that deletes it; search at the top
//   LIBRARY  every module; Add drops it into the first row with room; search at the top
// Right-click on a module anywhere here opens the module menu (W2). The role carries the shell: over the rack, no
// scrim, 30dvh, drag the top edge to resize (80–600). No control in it leaves the rack: the case width is set in the
// Case pane. The tabbed version this replaced is in `_tmp/2026-10-24-plan16/Workbench.tabs.jsx`.
import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import Rail from '@kolkrabbi/kol-component/molecules/Rail'
import { RailHeader, RailNav } from '@kolkrabbi/kol-component/organisms/RailKit'
import Input from '@kolkrabbi/kol-component/atoms/Input'
import { Icon } from '@kolkrabbi/kol-icons'
import { MODULE_DEFS, CATEGORIES } from '../modules/registry'
import Button from '../components/atoms/Button'
import { TOTAL_HP, hpToPx } from '../modules/utility/eurorack'
import { useModuleMenu } from './ModuleMenu.jsx'

/* the RailNav's glyphs — the views */
const VIEWS = [
  { id: 'edit', label: 'Edit', icon: 'edit' },
  { id: 'rack', label: 'Rack', icon: 'nav-rack' },
  { id: 'library', label: 'Library', icon: 'nav-library' },
]
/* a module's drawn size at 1×: its HP wide, its U tall (the rack's own aspect) */
const nativeSize = (hp, u) => {
  const w = hpToPx(hp)
  return { w, h: (w * TOTAL_HP) / (hp * (u === 1 ? 12 : 4)) }
}

/* the height the parked shelf has — measured, so modules fit it however tall the Rail is dragged */
/* a callback ref: the Rail renders its body only once open, so the shelf node arrives after mount */
function useHeight() {
  const [el, setEl] = useState(null)
  const [h, setH] = useState(0)
  useLayoutEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return [setEl, h]
}

/* a pointer drag that reports the travel since pointerdown */
function useDrag(onMove) {
  return useCallback((e) => {
    e.preventDefault()
    const x0 = e.clientX, y0 = e.clientY
    const move = (ev) => onMove(ev.clientX - x0, ev.clientY - y0)
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [onMove])
}

const used = (row) => row.modules.reduce((s, m) => s + m.hp, 0)

export default function Workbench({ open, onClose, modules, rows, caseHp = TOTAL_HP, onSetCaseHp, onReturn, onPark, onDelete, onAddRow, onRemoveRow, onSetRowHeight, onAddModule }) {
  const [view, setView] = useState('edit')
  const [searchText, setSearchText] = useState('')
  const [caseW, setCaseW] = useState(360)
  const [shelfRef, shelfH] = useHeight()
  const menu = useModuleMenu({ onPark, onReturn, onDelete })

  const w0 = useRef(caseW)
  const startSplit = useDrag(useCallback((dx) => setCaseW(Math.max(240, Math.min(720, w0.current + dx))), []))

  const q = searchText.trim().toLowerCase()
  const matches = (type) => !q || MODULE_DEFS[type]?.label?.toLowerCase().includes(q) || type.toLowerCase().includes(q)
  const roomFor = (def) => rows?.find((r) => r.height === (def.u === 1 ? '1u' : '3u') && used(r) + def.hp <= caseHp)

  const search = <Input size="sm" iconLeft="search" placeholder="Search…" value={searchText} onChange={(e) => setSearchText(e.target.value)} width="180px" />

  return (
    <Rail
      role="bottom"
      open={open}
      onClose={onClose}
      nav={<RailNav items={VIEWS} value={view} onChange={setView} iconComponent={Icon} />}
      header={<RailHeader title={VIEWS.find((v) => v.id === view)?.label} />}
    >
      <div data-workbench className="flex h-full min-h-0">
        {/* THE VIEW — fills the height to the RailNav's right */}
        <div className="flex min-w-0 flex-1 flex-col">
        {view === 'edit' && (
          <div className="flex min-h-0 flex-1">
            {/* CASE — the rows */}
            <div className="flex shrink-0 flex-col gap-1 overflow-y-auto pr-4" style={{ width: caseW }}>
              {/* the case width, edited here — nothing in the Rail sends you to Create (user 2026-10-17: "why would
                  you take the user from the bottom rail?"). Never narrower than what is mounted: the rack clamps. */}
              <div className="flex h-7 items-center gap-4">
                <span className="kol-helper-10 text-fg-48 uppercase w-12">Case</span>
                <Input size="sm" chars={3} suffix="HP" inputMode="numeric" inputClassName="text-right" value={String(caseHp)} onCommit={(v) => onSetCaseHp?.(v)} aria-label="Case width" />
              </div>
              {rows?.map((row, i) => (
                <div key={row.id} className="flex h-7 items-center gap-4">
                  <span className="kol-helper-12 text-fg-64 w-12">Row {i + 1}</span>
                  <Button size="sm" onClick={() => onSetRowHeight?.(row.id, row.height === '1u' ? '3u' : '1u')}>
                    [{row.height.toUpperCase()}]
                  </Button>
                  <span className="kol-helper-12 text-fg-32">{used(row)}hp</span>
                  {rows.length > 1 && <Button size="sm" onClick={() => onRemoveRow?.(row.id)}>x</Button>}
                </div>
              ))}
              <div className="mt-1 flex gap-4">
                <Button size="sm" onClick={() => onAddRow?.('3u')}>+ 3U row</Button>
                <Button size="sm" onClick={() => onAddRow?.('1u')}>+ 1U row</Button>
              </div>
            </div>

            {/* the divider — drag to share the width */}
            <div
              onPointerDown={(e) => { w0.current = caseW; startSplit(e) }}
              className="w-2 shrink-0 cursor-col-resize border-l border-fg-08 hover:border-fg-32"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize Case and Parked"
            />

            {/* PARKED — each module whole, at the shelf's height */}
            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-2">
              <span className="kol-helper-10 text-fg-48 uppercase">Parked</span>
              <div ref={shelfRef} className="flex min-h-0 flex-1 items-start gap-1 overflow-x-auto overflow-y-hidden">
                {modules.length === 0 && <span className="kol-helper-12 text-fg-32">Nothing parked</span>}
                {shelfH > 0 && modules.map((mod) => {
                  const def = MODULE_DEFS[mod.type]
                  if (!def) return null
                  const Comp = def.component
                  const { w, h } = nativeSize(mod.hp, def.u || 3)
                  const k = shelfH / h
                  return (
                    <div
                      key={mod.id}
                      data-parked-id={mod.id}
                      onClick={() => onReturn(mod.id)}
                      onContextMenu={(e) => menu.openAt(e, { mod, parked: true })}
                      /* a parked module is a picture you click to return — opacity steps up on hover; × deletes.
                         `transform`, not `zoom`: the module lays out at its native size and its canvases measure it,
                         the scale is paint-only — the whole panel, bottom row included, lands in the shelf */
                      className="group relative shrink-0 cursor-pointer opacity-80 transition-opacity hover:opacity-100"
                      style={{ width: w * k, height: shelfH }}
                    >
                      <div style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: 'top left' }}><Comp id={mod.id} /></div>
                      <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button tone="grey" size="xs" iconOnly="trash" aria-label={`Delete ${def.label}`} onClick={(e) => { e.stopPropagation(); onDelete?.(mod.id) }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'rack' && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {search}
            {rows?.map((row, i) => {
              const mods = [...row.modules].sort((a, b) => a.offset - b.offset).filter((m) => matches(m.type))
              return (
                <div key={row.id} className="flex flex-col gap-1">
                  <span className="kol-helper-10 text-fg-48 uppercase">Row {i + 1} · {row.height.toUpperCase()} · {used(row)}/{caseHp}HP</span>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {mods.map((m) => {
                      const label = MODULE_DEFS[m.type]?.label ?? m.type
                      return (
                        <div key={m.id} data-rack-row-id={m.id} className="flex h-7 items-center gap-2" onContextMenu={(e) => menu.openAt(e, { mod: m })}>
                          <span className="kol-mono-12">{label} <span className="text-fg-32">{m.hp}HP</span></span>
                          <Button tone="grey" size="xs" iconOnly="trash" aria-label={`Delete ${label}`} onClick={() => onDelete?.(m.id)} />
                        </div>
                      )
                    })}
                    {mods.length === 0 && <span className="kol-helper-12 text-fg-32">Empty</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {view === 'library' && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {search}
            {CATEGORIES.map((cat) => {
              const list = Object.entries(MODULE_DEFS).filter(([t, d]) => d.category === cat && matches(t))
              if (list.length === 0) return null
              return (
                <div key={cat} className="flex flex-col gap-1">
                  <span className="kol-helper-10 text-fg-48 uppercase">{cat}</span>
                  <div className="grid gap-x-6 gap-y-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {list.map(([type, def]) => {
                      const row = roomFor(def)
                      return (
                        <div key={type} className="flex h-7 items-center justify-between gap-2">
                          <span className="kol-mono-12 truncate">{def.label} <span className="text-fg-32">{def.hp}HP {def.u}U</span></span>
                          <Button size="xs" disabled={!row} onClick={() => row && onAddModule?.(type, row.id)}>{row ? 'Add' : 'No room'}</Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
        {menu.element}
      </div>
    </Rail>
  )
}
