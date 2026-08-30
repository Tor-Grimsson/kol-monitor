// Dotted background grid — on by default in the rack and Create New,
// `g` toggles it anywhere the hook is mounted and the choice sticks across
// pages for the session (override beats the page default).
import { useEffect, useSyncExternalStore } from 'react'

// ponytail: module-level store, session-scoped — no persistence asked for
let override = null // null = follow page default
let listeners = []
const emit = () => listeners.forEach(l => l())

// Split into parts so RackViewport can scale the cell with the rack's zoom.
export const DOT_GRID_IMAGE = 'radial-gradient(var(--kol-fg-12) 1px, transparent 1px)'
export const DOT_GRID_SIZE = 36 // px, at zoom 1

export const DOT_GRID_BG = {
  backgroundImage: DOT_GRID_IMAGE,
  backgroundSize: `${DOT_GRID_SIZE}px ${DOT_GRID_SIZE}px`,
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
