/**
 * librarySync — the saves survive the machine (plan 13 W7, 2026-10-15; kol-mirror's of 2026-10-14,
 * kol-fxr's plan 07 behind it).
 *
 * The app names the API once (`setLibraryApi(import.meta.env.VITE_MONITOR_API)`); unset, there is no
 * Sign in and everything is localStorage, exactly as before. Signed in:
 *
 *   - the library (`monitor-library`: saved patches) merges with D1 at sign-in, and every explicit
 *     save or delete is pushed after the local write
 *   - the rail shows Media — the kol-media stores through the DS picker
 *
 * The API is `kol-monitor-api` (`api/`): one shared password, traded at `/api/session` for a 90-day
 * token. The TOKEN is kept in localStorage — never the password — so a reload stays signed in. Pushes
 * are fire-and-forget; a failed one is reconciled by the next sign-in's merge. Nothing autosaves to it.
 */
import { useSyncExternalStore } from 'react'
import { getSaved, replaceSaved, seedLibrary, STARTERS } from './useLibraryStore'
import { mergeLibrary } from './mergeLibrary'

const SESSION_KEY = 'kol.monitor.library-session'
const SEEDED_KEY = 'kol.monitor.seeded'

let apiBase = null
let session = null
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

export class UnauthorizedError extends Error { constructor() { super('unauthorized'); this.name = 'UnauthorizedError' } }

export function setLibraryApi(base) {
  apiBase = typeof base === 'string' && base.trim() ? base.trim().replace(/\/+$/, '') : null
  seedFirstFiles()
  restoreSession()
}
export const getLibraryApi = () => apiBase
const getSession = () => session
export const useLibrarySession = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getSession, getSession)

function backend(token) {
  const call = async (path, init = {}) => {
    const res = await fetch(`${apiBase}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
    if (res.status === 401) { signOutLibrary(); throw new UnauthorizedError() }
    if (!res.ok) throw new Error(`library api ${res.status}`)
    return res.json()
  }
  return {
    hydrate: async () => (await call('/api/documents')).documents,
    put: (id, kind, name, spec, updatedAt) => call(`/api/documents/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ kind, name, spec, updatedAt }) }),
    remove: (id) => call(`/api/documents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  }
}

const quiet = (p) => p.catch((e) => console.warn('library sync:', e.message))

function store(value) {
  try { value ? localStorage.setItem(SESSION_KEY, JSON.stringify(value)) : localStorage.removeItem(SESSION_KEY) } catch { /* storage blocked — the session lasts the tab */ }
}
function restoreSession() {
  if (session || !apiBase) return
  let s = null
  try { s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { /* unreadable — signed out */ }
  if (!s?.token || s.base !== apiBase || !(s.expiresAt > Date.now())) return
  session = { api: backend(s.token) }
  seedFirstFiles()
  emit()
}

/* the first files: every starter not yet seeded becomes the user's own — at boot, signed in or not (user
   2026-10-18: signed out still looks like a user). SEEDED_KEY lists what was seeded, so a starter deleted on
   purpose stays gone and one added to STARTERS later still arrives. The legacy '1' meant the first three. */
function seedFirstFiles() {
  let done = []
  try { const v = localStorage.getItem(SEEDED_KEY); done = v === '1' ? STARTERS.slice(0, 3) : JSON.parse(v || '[]') } catch { /* blocked or unreadable — check the library alone */ }
  const have = new Set(getSaved().map((i) => i.seedOf))
  const missing = STARTERS.filter((n) => !done.includes(n) && !have.has(n))
  if (missing.length) seedLibrary(missing)
  try { localStorage.setItem(SEEDED_KEY, JSON.stringify(STARTERS)) } catch { /* storage blocked */ }
}

/** Trades the password for a token, merges the library, starts syncing. Resolves to the number of
 *  saves after the merge. Wrong password → UnauthorizedError, nothing changes. */
export async function signInLibrary(password) {
  if (!apiBase) throw new Error('no library api')
  const res = await fetch(`${apiBase}/api/session`, { method: 'POST', headers: { authorization: 'Basic ' + btoa(`admin:${password}`) } })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error(`library api ${res.status}`)
  const { token, expiresAt } = await res.json()
  const api = backend(token)
  const rows = await api.hydrate()

  const { next, pushes } = mergeLibrary(getSaved(), rows)
  replaceSaved(next)
  for (const i of pushes) quiet(api.put(i.id, i.kind, i.name, i, i.savedAt ?? Date.now()))

  session = { api }
  seedFirstFiles()
  store({ base: apiBase, token, expiresAt })
  emit()
  return getSaved().length
}

export function signOutLibrary() { store(null); if (!session) return; session = null; emit() }

/* the store's two verbs call these after the local write */
export function pushSave(item) { if (session) quiet(session.api.put(item.id, item.kind, item.name, item, item.savedAt)) }
export function pushRemove(id) { if (session) quiet(session.api.remove(id)) }
