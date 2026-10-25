import { useSyncExternalStore } from 'react'
import { patches } from '../data/patches'
import { pushSave, pushRemove } from './librarySync'

/**
 * The library store — the user's saves, ONE localStorage list (plan 13 W7, 2026-10-15, kol-mirror's
 * store). Presets stay where they are (`src/data/patches.js`, `src/data/stages.js`, read-only); this
 * holds what Save makes — the Patch module's and the stage's (plan 16 W7). Every entry:
 *   { id: 'usr-…', kind: 'patch' | 'stage', name, description, savedAt, seedOf?, data,
 *     images?: [{ id, src, label? }], cover?, back? }
 * `images` are the file's pictures (plan 16 W8, FileRailImages): the output frame Save captures, uploads;
 * `cover` / `back` are srcs picked from them (the card's front and its hover back). Synced whole — the
 * API stores the item as its `spec`. A save from before 2026-10-24 carries `thumb`: read as the cover.
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

/* `thumb` (the output frame Save captured) becomes the first image and the cover */
export function addToLibrary(patch, { thumb, kind = 'patch', images } = {}) {
  const imgs = images ?? (thumb ? [{ id: 'output', src: thumb, label: 'Output' }] : [])
  const item = { id: `usr-${Date.now().toString(36)}`, kind, name: patch.name || 'Untitled', description: patch.description || '', savedAt: Date.now(), images: imgs, ...(imgs[0] && { cover: imgs[0].src }), data: patch }
  write([...items, item])
  pushSave(item)
  return item
}

export function renameInLibrary(id, name) {
  const next = items.map((i) => (i.id === id ? { ...i, name, data: { ...i.data, name } } : i))
  write(next)
  pushSave(next.find((i) => i.id === id))
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

/* a save's pictures and its picks — `images`, `cover`, `back` (plan 16 W8); a data URL or a path, synced with the save */
export function editSaved(id, patch) {
  let changed = null
  write(items.map((i) => (i.id === id ? (changed = { ...i, ...patch, savedAt: Date.now() }) : i)))
  if (changed) pushSave(changed)
}

export const findSaved = (id) => items.find((i) => i.id === id)

/* the sign-in merge (`librarySync.js`) reads the saves and writes the merged list back */
export const getSaved = () => items
export const replaceSaved = (next) => write(next)

/** The user's saved patches, oldest first. */
export const useLibrary = () => useSyncExternalStore(subscribe, getSnapshot)
