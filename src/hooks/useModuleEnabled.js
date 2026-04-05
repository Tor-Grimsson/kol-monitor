// Per-module enabled state that syncs with case-level toggleAll
import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useCasePower } from './useCasePower.jsx'

// Set per-module in RackView — carries init state including enabled
export const ModuleInitContext = createContext(null)

export function useModuleEnabled(initial) {
  const initCtx = useContext(ModuleInitContext)
  const { allEnabled } = useCasePower()
  const [enabled, setEnabled] = useState(initial ?? initCtx?.enabled ?? false)
  const lastAll = useRef(allEnabled)

  useEffect(() => {
    if (lastAll.current === allEnabled) return
    lastAll.current = allEnabled
    setEnabled(allEnabled)
  }, [allEnabled])

  return [enabled, setEnabled]
}
