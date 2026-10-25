import { useSyncExternalStore } from 'react'

/* Settings → Display → Hover flips card (user 2026-10-24: "toggle for hover flips card? default off"). Off: a card
   never turns on hover — Library and Home pass no `back`, and Dev → Card flip turns only on `F`. Per browser. */
const KEY = 'monitor-hover-flip'
const listeners = new Set()
let on = (() => { try { return localStorage.getItem(KEY) === '1' } catch { return false } })()

export function setHoverFlip(v) {
  on = !!v
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* storage blocked — session only */ }
  listeners.forEach((l) => l())
}

export const useHoverFlip = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => on)
