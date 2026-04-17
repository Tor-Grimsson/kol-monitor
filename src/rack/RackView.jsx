// RackView — renders the eurorack case with modules in rows

import { memo, useMemo, useState } from 'react'
import { ModuleInitContext } from '../hooks/useModuleEnabled'
import { MODULE_DEFS } from '../modules/registry'
import { TOTAL_HP, hpToPx } from '../modules/utility/eurorack'
import { findFreeOffset } from '../hooks/useRackState'
import Case, { RackRow } from '../modules/utility/Case.jsx'
import { ModuleEditContext } from '../modules/utility/Module.jsx'
import IconButton from '../modules/parametric/IconButton.jsx'

function ArrowOverlay({ onLeft, onRight, onUp, onDown }) {
  if (!onLeft && !onRight && !onUp && !onDown) return null
  const base = { position: 'absolute', zIndex: 3, pointerEvents: 'auto' }
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      {onLeft && (
        <div style={{ ...base, left: 2, top: '50%', transform: 'translateY(-50%)' }}>
          <IconButton icon="chevron-left" onClick={onLeft} momentary title="Move left" />
        </div>
      )}
      {onRight && (
        <div style={{ ...base, right: 2, top: '50%', transform: 'translateY(-50%)' }}>
          <IconButton icon="chevron-right" onClick={onRight} momentary title="Move right" />
        </div>
      )}
      {onUp && (
        <div style={{ ...base, top: 2, left: '50%', transform: 'translateX(-50%)' }}>
          <IconButton icon="chevron-up" onClick={onUp} momentary title="Move up" />
        </div>
      )}
      {onDown && (
        <div style={{ ...base, bottom: 2, left: '50%', transform: 'translateX(-50%)' }}>
          <IconButton icon="chevron-down" onClick={onDown} momentary title="Move down" />
        </div>
      )}
    </div>
  )
}

const ModuleSlot = memo(function ModuleSlot({ mod, row, rowIdx, rows, editMode, siblingIdx, siblingCount, onSendToWorkbench, onSwapInRow, onMoveToRow }) {
  const def = MODULE_DEFS[mod.type]
  const [hovered, setHovered] = useState(false)
  if (!def) return null
  const Comp = def.component
  const u = def.u || 3
  const aspectDiv = u === 1 ? 12 : 4
  const editCtx = editMode ? { editMode: true, onRemove: () => onSendToWorkbench(mod.id), hp: mod.hp } : null

  let arrows = null
  if (editMode && hovered) {
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
      onMouseEnter={() => editMode && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: hpToPx(mod.hp),
        aspectRatio: `${mod.hp * aspectDiv} / ${TOTAL_HP}`,
        flexShrink: 0,
        overflow: 'hidden',
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

const RackRowContent = memo(function RackRowContent({ row, rowIdx, rows, editMode, onSendToWorkbench, onSwapInRow, onMoveToRow, rowRefs }) {
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
  return (
    <div data-rack-view>
    <Case>
      {rows.map((row, rowIdx) => (
        <RackRowContent
          key={row.id}
          row={row}
          rowIdx={rowIdx}
          rows={rows}
          editMode={editMode}
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
