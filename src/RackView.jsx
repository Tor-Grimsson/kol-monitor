// RackView — renders the eurorack case with modules in rows

import { ModuleInitContext } from './hooks/useModuleEnabled'
import { MODULE_DEFS } from './moduleRegistry'
import { TOTAL_HP, hpToPx } from './modules/utility/eurorack'
import Case, { RackRow } from './modules/utility/Case.jsx'

export default function RackView({ rows, editMode, onSendToWorkbench, rowRefs }) {
  return (
    <Case>
      {rows.map(row => (
        <RackRow key={row.id} height={row.height}>
          <div
            ref={el => { if (el) rowRefs.current[row.id] = el }}
            style={{ display: 'flex', width: '100%', height: '100%', gap: 2, alignItems: 'flex-start' }}
          >
            {[...row.modules].sort((a, b) => a.offset - b.offset).map(mod => {
              const def = MODULE_DEFS[mod.type]
              if (!def) return null
              const Comp = def.component
              const u = def.u || 3
              const aspectDiv = u === 1 ? 12 : 4
              return (
                <div
                  key={mod.id}
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
            })}
          </div>
        </RackRow>
      ))}
    </Case>
  )
}
