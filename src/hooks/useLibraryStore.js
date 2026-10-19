import { useSyncExternalStore } from 'react'
import { patches } from '../data/patches'
import { pushSave, pushRemove } from './librarySync'

/**
 * The library store — the user's saved patches, ONE localStorage list (plan 13 W7, 2026-10-15,
 * kol-mirror's store). Presets stay where they are (`src/data/patches.js`, read-only); this holds
 * what the Patch module's Save makes. Every entry:
 *   { id: 'usr-…', kind: 'patch', name, description, savedAt, seedOf?, data: <the patch> }
 * `data` is `snapshotPatch`'s shape — the same object Export writes to disk. Ids are URL-safe
 * (`usr-<base36>`) because the rack loads one at `/rack/patch/<id>` and the API routes on it.
 */
const KEY = 'monitor-library'

/* the starters every user gets as their own files, signed in or not — Home's first SAVED */
export const STARTERS = ['init', 'morph', 'trail-spin', 'raster', 'slit-echo']

function read() {
  try { const arr = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(arr) ? arr : [] } catch { return [] }
}
let items = read()
const listeners = new Set()
function write(next) {
  items = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* quota — keep session state */ }
  listeners.forEach((l) => l())
}
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
const getSnapshot = () => items

export const isSavedId = (id) => typeof id === 'string' && id.startsWith('usr-')

export function addToLibrary(patch) {
  const item = { id: `usr-${Date.now().toString(36)}`, kind: 'patch', name: patch.name || 'Untitled', description: patch.description || '', savedAt: Date.now(), data: patch }
  write([...items, item])
  pushSave(item)
  return item
}

export function removeFromLibrary(id) {
  write(items.filter((i) => i.id !== id))
  pushRemove(id)
}

/* THE FIRST FILES (kol-mirror, 2026-10-14): an account with no patch yet starts with copies of the
   starters as its OWN files — removable, exportable, synced. Stable ids, so two devices never seed twice. */
export function seedLibrary(names = STARTERS) {
  const now = Date.now()
  const copies = names.map((name, i) => ({
    id: `usr-seed-${name}`, kind: 'patch', name, description: patches[name].description || '', seedOf: name, savedAt: now - i,
    data: { name, ...patches[name] },
  }))
  write([...items, ...copies])
  copies.forEach(pushSave)
  return copies
}

export const findSaved = (id) => items.find((i) => i.id === id)

/* the sign-in merge (`librarySync.js`) reads the saves and writes the merged list back */
export const getSaved = () => items
export const replaceSaved = (next) => write(next)

/** The user's saved patches, oldest first. */
export const useLibrary = () => useSyncExternalStore(subscribe, getSnapshot)
