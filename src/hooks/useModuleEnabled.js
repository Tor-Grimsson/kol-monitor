// Per-module enabled state that syncs with case-level toggleAll
import { useState, useEffect } from 'react'
import { useCasePower } from './useCasePower.jsx'

export function useModuleEnabled(initial = true) {
  const { allEnabled } = useCasePower()
  const [enabled, setEnabled] = useState(initial)

  useEffect(() => {
    setEnabled(allEnabled)
  }, [allEnabled])

  return [enabled, setEnabled]
}
