import { useState, useEffect } from 'react'

const STORAGE_KEY = 'kol-monitor-state'

export default function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (key in parsed) return parsed[key]
      }
    } catch {}
    return defaultValue
  })

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      const obj = stored ? JSON.parse(stored) : {}
      obj[key] = value
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    } catch {}
  }, [key, value])

  return [value, setValue]
}
