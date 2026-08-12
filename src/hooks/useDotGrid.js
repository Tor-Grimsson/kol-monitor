// Dotted background grid — off by default, on by default in Create New,
// `g` toggles it anywhere the hook is mounted and the choice sticks across
// pages for the session (override beats the page default).
import { useEffect, useSyncExternalStore } from 'react'

// ponytail: module-level store, session-scoped — no persistence asked for
let override = null // null = follow page default
let listeners = []
const emit = () => listeners.forEach(l => l())

export const DOT_GRID_BG = {
  backgroundImage: 'radial-gradient(var(--kol-fg-04) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
}

/** Returns whether the grid is on; installs the `g` toggle while mounted. */
export function useDotGrid(pageDefault = false) {
  const ov = useSyncExternalStore(
    (cb) => { listeners.push(cb); return () => { listeners = listeners.filter(l => l !== cb) } },
    () => override,
  )
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest('input, textarea')) return
      if (e.key === 'g') { e.preventDefault(); override = !(override ?? pageDefault); emit() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pageDefault])
  return ov ?? pageDefault
}
