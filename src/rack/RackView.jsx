// RackView — renders the eurorack case with modules in rows

import { memo, useMemo, useState, useRef, useEffect } from 'react'
import { ModuleInitContext } from '../hooks/useModuleEnabled'
import { MODULE_DEFS } from '../modules/registry'
import { hpToPx, ROW_HEIGHT } from '../modules/utility/eurorack'
import { findFreeOffset } from '../hooks/useRackState'
import Case, { RackRow } from '../modules/utility/Case.jsx'
import { ModuleEditContext } from '../modules/utility/Module.jsx'
import Icon from '../icons/Icon.jsx'

function ChevronButton({ icon, onClick, title }) {
  // Hover-driven active state — a simple momentary pulse doesn't survive the
  // remount that happens when the module moves to a new offset. Inactive alpha
  // is deliberately brighter than the shared IconButton default so chevrons
  // read clearly against the panel without needing a hover.
  const [hover, setHover] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: hover ? '#e74c3c' : 'rgba(255,255,255,0.24)',
        backgroundColor: hover ? 'rgba(231,76,60,0.15)' : 'transparent',
        color: hover ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.64)',
        cursor: 'pointer',
        transition: 'border-color 100ms, background-color 100ms, color 100ms',
      }}
    >
      <Icon name={icon} size={10} />
    </button>
  )
}

function ArrowOverlay({ onLeft, onRight, onUp, onDown }) {
  if (!onLeft && !onRight && !onUp && !onDown) return null
  // Chevron anchored at the panel edge, shifted outward by 25% of its own size —
  // ~25% of the button sits outside the panel, ~75% inside.
  const base = { position: 'absolute', zIndex: 3, pointerEvents: 'auto' }
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      {onLeft && (
        <div style={{ ...base, left: 0, top: '50%', transform: 'translate(-25%, -50%)' }}>
          <ChevronButton icon="chevron-left" onClick={onLeft} title="Move left" />
        </div>
      )}
      {onRight && (
        <div style={{ ...base, right: 0, top: '50%', transform: 'translate(25%, -50%)' }}>
          <ChevronButton icon="chevron-right" onClick={onRight} title="Move right" />
        </div>
      )}
      {onUp && (
        <div style={{ ...base, top: 0, left: '50%', transform: 'translate(-50%, -25%)' }}>
          <ChevronButton icon="chevron-up" onClick={onUp} title="Move up" />
        </div>
      )}
      {onDown && (
        <div style={{ ...base, bottom: 0, left: '50%', transform: 'translate(-50%, 25%)' }}>
          <ChevronButton icon="chevron-down" onClick={onDown} title="Move down" />
        </div>
      )}
    </div>
  )
}

// Minimum dwell before arrows SWITCH from one module to another. First hover
// (no arrows visible yet) shows instantly — only the cross-module jump waits.
const SWITCH_DWELL_MS = 400

const ModuleSlot = memo(function ModuleSlot({ mod, row, rowIdx, rows, editMode, siblingIdx, siblingCount, activeArrowsId, requestActivate, cancelActivate, onSendToWorkbench, onSwapInRow, onMoveToRow }) {
  const def = MODULE_DEFS[mod.type]
  if (!def) return null
  const Comp = def.component
  const u = def.u || 3
  const editCtx = editMode ? { editMode: true, onRemove: () => onSendToWorkbench(mod.id), hp: mod.hp } : null
  const active = editMode && activeArrowsId === mod.id

  let arrows = null
  if (active) {
    const targetHeight = u === 1 ? '1u' : '3u'
    const above = rows[rowIdx - 1]
    const below = rows[rowIdx + 1]
    const aboveRow = above && above.height === targetHeight && findFreeOffset(above.modules, mod.hp) !== null ? above : null
    const belowRow = below && below.height === targetHeight && findFreeOffset(below.modules, mod.hp) !== null ? below : null
    arrows = {
      onLeft: siblingIdx > 0 ? () => onSwapInRow(row.id, mod.id, 'left') : null,
      onRight: siblingIdx >= 0 && siblingIdx < siblingCount - 1 ? () => onSwapInRow(row.id, mod.id, 'right') : null,
      onUp: aboveRow ? () => onMoveToRow(mod.id, aboveRow.id) : null,
      onDown: belowRow ? () => onMoveToRow(mod.id, belowRow.id) : null,
    }
  }

  return (
    <div
      data-module-id={mod.id}
      onMouseEnter={() => { if (editMode) requestActivate(mod.id) }}
      onMouseLeave={() => { if (editMode) cancelActivate(mod.id) }}
      style={{
        width: hpToPx(mod.hp),
        /* a definite px height, not an aspect-ratio: WebKit does not resolve the
           module's `height: 100%` against an aspect-ratio box, so on iOS a 3U
           module sized to its content and ran past the rails (2026-09-02) */
        height: ROW_HEIGHT[u === 1 ? '1u' : '3u'],
        flexShrink: 0,
        // Clip module internals by default; lift the clip while reposition arrows
        // are showing so edge-centred chevrons can overflow the panel border.
        overflow: arrows ? 'visible' : 'hidden',
        position: 'relative',
      }}
    >
      <ModuleEditContext.Provider value={editCtx}>
        <ModuleInitContext.Provider value={mod.state}>
          <Comp id={mod.id} init={mod.state} />
        </ModuleInitContext.Provider>
      </ModuleEditContext.Provider>
      {arrows && <ArrowOverlay {...arrows} />}
    </div>
  )
})

const RackRowContent = memo(function RackRowContent({ row, rowIdx, rows, editMode, activeArrowsId, requestActivate, cancelActivate, onSendToWorkbench, onSwapInRow, onMoveToRow, rowRefs }) {
  const sorted = useMemo(() =>
    [...row.modules].sort((a, b) => a.offset - b.offset),
    [row.modules]
  )
  return (
    <RackRow height={row.height}>
      <div
        ref={el => { if (el) rowRefs.current[row.id] = el }}
        style={{ display: 'flex', width: '100%', height: '100%', gap: 2, alignItems: 'flex-start' }}
      >
        {sorted.map((mod, idx) => (
          <ModuleSlot
            key={mod.id}
            mod={mod}
            row={row}
            rowIdx={rowIdx}
            rows={rows}
            editMode={editMode}
            siblingIdx={idx}
            siblingCount={sorted.length}
            activeArrowsId={activeArrowsId}
            requestActivate={requestActivate}
            cancelActivate={cancelActivate}
            onSendToWorkbench={onSendToWorkbench}
            onSwapInRow={onSwapInRow}
            onMoveToRow={onMoveToRow}
          />
        ))}
      </div>
    </RackRow>
  )
})

export default memo(function RackView({ rows, editMode, onSendToWorkbench, onSwapInRow, onMoveToRow, rowRefs }) {
  // Shared across all ModuleSlots — only one module shows arrows at a time.
  // Once arrows are up on module A, they stay until another module dwells for
  // SWITCH_DWELL_MS. A glancing pass over B cancels its pending switch and
  // leaves A's arrows in place.
  const [activeArrowsId, setActiveArrowsId] = useState(null)
  const pendingRef = useRef({ id: null, timer: null })

  // When edit mode turns off, drop arrows. When it turns on, seed arrows on
  // the 2nd module in the first 3u row — that position generally has both
  // left and right neighbours, so the user immediately sees both swap arrows.
  useEffect(() => {
    if (!editMode) { setActiveArrowsId(null); clearPending(); return }
    if (activeArrowsId != null) return
    for (const row of rows) {
      if (row.height !== '3u' || row.modules.length < 2) continue
      const sorted = [...row.modules].sort((a, b) => a.offset - b.offset)
      setActiveArrowsId(sorted[1].id)
      return
    }
    // Fallback: any row, first available module.
    for (const row of rows) {
      if (row.modules.length === 0) continue
      const sorted = [...row.modules].sort((a, b) => a.offset - b.offset)
      setActiveArrowsId(sorted[0].id)
      return
    }
  }, [editMode])
  useEffect(() => clearPending, [])

  function clearPending() {
    if (pendingRef.current.timer) clearTimeout(pendingRef.current.timer)
    pendingRef.current = { id: null, timer: null }
  }

  const requestActivate = (id) => {
    // Fast path: nothing active yet → show instantly, no dwell.
    if (activeArrowsId == null) {
      clearPending()
      setActiveArrowsId(id)
      return
    }
    if (activeArrowsId === id) { clearPending(); return }
    if (pendingRef.current.id === id) return
    clearPending()
    pendingRef.current.id = id
    pendingRef.current.timer = setTimeout(() => {
      setActiveArrowsId(id)
      pendingRef.current = { id: null, timer: null }
    }, SWITCH_DWELL_MS)
  }

  const cancelActivate = (id) => {
    // Mouse left this module before the switch timer fired — cancel, keep
    // whatever arrows are currently up.
    if (pendingRef.current.id === id) clearPending()
  }

  return (
    <div
      data-rack-view
      // Leaving the rack cancels any pending switch but leaves the current
      // arrows up — they're an edit-mode affordance and persist until either
      // another module takes over or edit mode is turned off.
      onMouseLeave={clearPending}
    >
    <Case>
      {rows.map((row, rowIdx) => (
        <RackRowContent
          key={row.id}
          row={row}
          rowIdx={rowIdx}
          rows={rows}
          editMode={editMode}
          activeArrowsId={activeArrowsId}
          requestActivate={requestActivate}
          cancelActivate={cancelActivate}
          onSendToWorkbench={onSendToWorkbench}
          onSwapInRow={onSwapInRow}
          onMoveToRow={onMoveToRow}
          rowRefs={rowRefs}
        />
      ))}
    </Case>
    </div>
  )
})
