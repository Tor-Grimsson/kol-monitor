// Case-level power context — when off, all modules are disabled
// Also carries render-loop timing ref for perf monitoring

import { createContext, useContext, useState, useRef, useCallback } from 'react'

const CasePowerContext = createContext(true)

export function CasePowerProvider({ children }) {
  const [power, setPower] = useState(true)
  const [allEnabled, setAllEnabled] = useState(false)
  const timingRef = useRef({ evalMs: 0, frameCount: 0, fps: 60, moduleCount: 0 })
  const toggleAll = useCallback(() => setAllEnabled(v => !v), [])
  return (
    <CasePowerContext.Provider value={{ power, setPower, timingRef, allEnabled, toggleAll }}>
      {children}
    </CasePowerContext.Provider>
  )
}

export function useCasePower() {
  return useContext(CasePowerContext)
}
