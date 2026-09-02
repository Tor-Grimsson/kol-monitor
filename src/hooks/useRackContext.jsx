// RackContext — shared rack state across /rack and /create routes

import { createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { useRackState } from './useRackState'
import { ModuleRegistryProvider } from './useModuleRegistry.jsx'
import { PatchRoutingProvider } from './usePatchRouting.jsx'
import { CasePowerProvider } from './useCasePower.jsx'
import { patches } from '../data/patches.js'

const RackContext = createContext(null)

export function useRack() {
  return useContext(RackContext)
}

export function RackProvider({ initialRows }) {
  const rack = useRackState(initialRows)
  return (
    <RackContext.Provider value={rack}>
      <ModuleRegistryProvider>
        <PatchRoutingProvider initialConnections={patches.ref.connections}>
          <CasePowerProvider>
            <Outlet />
          </CasePowerProvider>
        </PatchRoutingProvider>
      </ModuleRegistryProvider>
    </RackContext.Provider>
  )
}
