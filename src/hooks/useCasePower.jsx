// Case-level power context — when off, all modules are disabled

import { createContext, useContext, useState, useCallback } from 'react'

const CasePowerContext = createContext(true)

export function CasePowerProvider({ children }) {
  const [power, setPower] = useState(true)
  return (
    <CasePowerContext.Provider value={{ power, setPower }}>
      {children}
    </CasePowerContext.Provider>
  )
}

export function useCasePower() {
  return useContext(CasePowerContext)
}
