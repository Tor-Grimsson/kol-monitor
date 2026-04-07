// RackView — renders the eurorack case with modules in rows

import { memo, useMemo } from 'react'
import { ModuleInitContext } from './hooks/useModuleEnabled'
import { MODULE_DEFS } from './moduleRegistry'
import { TOTAL_HP, hpToPx } from './modules/utility/eurorack'
import Case, { RackRow } from './modules/utility/Case.jsx'

const ModuleSlot = memo(function ModuleSlot({ mod, editMode, onSendToWorkbench }) {
  const def = MODULE_DEFS[mod.type]
  if (!def) return null
  const Comp = def.component
  const u = def.u || 3
  const aspectDiv = u === 1 ? 12 : 4
  return (
    <div
      style={{
        width: hpToPx(mod.hp),
        aspectRatio: `${mod.hp * aspectDiv} / ${TOTAL_HP}`,
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {editMode && (
        <div
          onClick={() => onSendToWorkbench(mod.id)}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 12,
            zIndex: 15, cursor: 'pointer',
          }}
        />
      )}
      <ModuleInitContext.Provider value={mod.state}>
        <Comp id={mod.id} init={mod.state} />
      </ModuleInitContext.Provider>
    </div>
  )
})

const RackRowContent = memo(function RackRowContent({ row, editMode, onSendToWorkbench, rowRefs }) {
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
        {sorted.map(mod => (
          <ModuleSlot key={mod.id} mod={mod} editMode={editMode} onSendToWorkbench={onSendToWorkbench} />
        ))}
      </div>
    </RackRow>
  )
})

export default memo(function RackView({ rows, editMode, onSendToWorkbench, rowRefs }) {
  return (
    <div data-rack-view>
    <Case>
      {rows.map(row => (
        <RackRowContent key={row.id} row={row} editMode={editMode} onSendToWorkbench={onSendToWorkbench} rowRefs={rowRefs} />
      ))}
    </Case>
    </div>
  )
})
