// PatchPreview — renders a patch's rack layout read-only at 50% scale

import { useRef } from 'react'
import { CasePowerProvider } from '../hooks/useCasePower.jsx'
import { ModuleRegistryProvider } from '../hooks/useModuleRegistry.jsx'
import { PatchRoutingProvider } from '../hooks/usePatchRouting.jsx'
import { ModuleInitContext } from '../hooks/useModuleEnabled.js'
import { MODULE_DEFS } from '../modules/registry'
import { TOTAL_HP, hpToPx, ROW_WIDTH } from '../modules/utility/eurorack'
import Case, { RackRow } from '../modules/utility/Case.jsx'

function PreviewSlot({ mod }) {
  const def = MODULE_DEFS[mod.type]
  if (!def) return null
  const Comp = def.component
  const u = def.u || 3
  const aspectDiv = u === 1 ? 12 : 4
  return (
    <div style={{
      width: hpToPx(def.hp),
      aspectRatio: `${def.hp * aspectDiv} / ${TOTAL_HP}`,
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <ModuleInitContext.Provider value={{ enabled: true }}>
        <Comp id={`preview-${mod.id}`} init={{ enabled: true }} />
      </ModuleInitContext.Provider>
    </div>
  )
}

export default function PatchPreview({ patch, scale = 0.5 }) {
  const rows = patch.rows || []

  // Calculate total native height: each row's height based on aspect ratio + gaps + case padding
  const rowHeights = rows.map(row => {
    const aspect = row.height === '1u' ? 12 : 4
    return ROW_WIDTH / aspect
  })
  const nativeHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (rows.length - 1) * 2 + 6 // gaps + case padding
  const scaledWidth = (ROW_WIDTH + 96) * scale // 96 = side panels + padding
  const scaledHeight = nativeHeight * scale

  return (
    <CasePowerProvider>
      <ModuleRegistryProvider>
        <PatchRoutingProvider>
          <div style={{ pointerEvents: 'none', width: scaledWidth, height: scaledHeight, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <Case>
                {rows.map(row => {
                  const sorted = [...(row.modules || [])].sort((a, b) => a.offset - b.offset)
                  return (
                    <RackRow key={row.id} height={row.height}>
                      <div style={{ display: 'flex', width: '100%', height: '100%', gap: 2, alignItems: 'flex-start' }}>
                        {sorted.map(mod => (
                          <PreviewSlot key={mod.id} mod={mod} />
                        ))}
                      </div>
                    </RackRow>
                  )
                })}
              </Case>
            </div>
          </div>
        </PatchRoutingProvider>
      </ModuleRegistryProvider>
    </CasePowerProvider>
  )
}
