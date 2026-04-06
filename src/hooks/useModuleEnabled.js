// Per-module enabled state that syncs with case-level toggleAll
import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useCasePower } from './useCasePower.jsx'

// Set per-module in RackView — carries init state including enabled
export const ModuleInitContext = createContext(null)

// Shared ref accessible by useModule for render loop skip
let _lastEnabledRef = null
export function getLastEnabledRef() { return _lastEnabledRef }

export function useModuleEnabled(initial) {
  const initCtx = useContext(ModuleInitContext)
  const { allEnabled } = useCasePower()
  const [enabled, setEnabled] = useState(initial ?? initCtx?.enabled ?? false)
  const lastAll = useRef(allEnabled)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  // Expose for useModule to pick up
  _lastEnabledRef = enabledRef

  useEffect(() => {
    if (lastAll.current === allEnabled) return
    lastAll.current = allEnabled
    setEnabled(allEnabled)
  }, [allEnabled])

  return [enabled, setEnabled]
}
