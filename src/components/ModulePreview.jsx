// ModulePreview — renders a module component with all required context providers
// Used in library detail pages for static display

import { CasePowerProvider } from '../hooks/useCasePower.jsx'
import { ModuleRegistryProvider } from '../hooks/useModuleRegistry.jsx'
import { PatchRoutingProvider } from '../hooks/usePatchRouting.jsx'
import { ModuleInitContext } from '../hooks/useModuleEnabled.js'
import { MODULE_DEFS } from '../moduleRegistry'
import { TOTAL_HP } from '../modules/utility/eurorack'

export default function ModulePreview({ moduleType }) {
  const def = MODULE_DEFS[moduleType]
  if (!def) return null

  const Comp = def.component
  const hp = def.hp
  const u = def.u || 3
  const aspectDiv = u === 1 ? 12 : 4

  return (
    <CasePowerProvider>
      <ModuleRegistryProvider>
        <PatchRoutingProvider>
          <ModuleInitContext.Provider value={{ enabled: true }}>
            <div style={{ pointerEvents: 'none', width: hp * 16 * 2, height: (hp * 16 * 2) * TOTAL_HP / (hp * aspectDiv), overflow: 'hidden' }}>
              <div style={{
                width: hp * 16,
                aspectRatio: `${hp * aspectDiv} / ${TOTAL_HP}`,
                overflow: 'hidden',
                transform: 'scale(2)',
                transformOrigin: 'top left',
              }}>
                <Comp id={`preview-${moduleType}`} init={{ enabled: true }} />
              </div>
            </div>
          </ModuleInitContext.Provider>
        </PatchRoutingProvider>
      </ModuleRegistryProvider>
    </CasePowerProvider>
  )
}
