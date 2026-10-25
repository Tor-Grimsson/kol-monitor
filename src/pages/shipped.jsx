import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadBlob } from '@kolkrabbi/kol-component'
import { patches } from '../data/patches'
import { stages, STAGE_KEYS } from '../data/stages'
import { MODULE_DEFS } from '../modules/registry'

/**
 * shipped — WHAT THE APP SHIPS, as the Library's files (kol-ds-ui plan home-library-detail-one-card, 2026-10-24;
 * twin `kol-ds-ui/apps/rack-hub/src/pages/shipped.jsx`). Home is the user's saves; the Library is the shipped presets
 * and the module definitions — system saves — and every one is THE card with every field and icon (user 2026-10-24:
 * *"EVERY CARD HAS THE SAME FIELDS AND ICONS … NON NEGOTIABLE"*): title · date · size · cover with download · cog
 * (the rail: Details, tags, note, Upload image) · trash. A card opens its page — `/library/patch/<id>` ·
 * `/library/module/<type>` — never the rack.
 *
 * The verbs write THIS DEVICE's copy of the lists (`monitor-shipped` in localStorage, seeded from the constants when
 * absent): a shipped item the user deletes stays gone; the app's data files are untouched. `data` is never stored —
 * a module def carries functions — it is re-read from the source by `src` (the shipped id a duplicate came from).
 */
const SHIP_DATE = Date.parse('2026-10-19T12:00:00Z') /* the preset set's stamp — bump it when the set changes */
const DAY = 86400000
const KEY = 'monitor-shipped'
const titleOf = (name) => name.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim()
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/* THE KIND ON THE COVER (plan 16 W7.2, user 2026-10-24: "label stage like fxr labels different chromes"): the card's
   top-left mark — a rack for a patch, the stage's glyph for a stage. Home's saves wear the same. */
export const MARKS = {
  patch: { icon: 'nav-rack', label: 'Patch' },
  stage: { icon: 'video', label: 'Stage' },
}
const counts = (src) => [{ label: 'Modules', value: src.rows?.reduce((n, r) => n + (r.modules?.length || 0), 0) || 0 }, { label: 'Connections', value: src.connections?.length || 0 }]

/* A PATCH'S PICTURES (plan 16 W8): the output frame in front, the rack it was built on behind (AppCardBackCover —
   the back shows on hover); both are the file's `images`, so the File Rail can open, swap or drop them */
export const patchImages = (name) => [
  { id: 'output', src: `/previews/patches/${name}.png`, label: 'Output' },
  { id: 'rack', src: `/previews/racks/${name}.png`, label: 'Rack' },
]

const PATCH_NAMES = Object.keys(patches).filter((k) => k !== 'ref' && k !== 'empty')
/* a shipped patch as a file — its cover is the patch's output capture, its back the rack */
export const SHIPPED_PATCHES = PATCH_NAMES.map((name, i) => {
  const src = patches[name]
  const images = patchImages(name)
  return {
    id: name, src: name, kind: 'patch', name: titleOf(name), type: src.type ?? 'patches', tags: src.tags ?? [],
    updatedAt: SHIP_DATE - i * DAY, bytes: new Blob([JSON.stringify(src)]).size, images, cover: images[0].src, back: images[1].src,
    details: counts(src),
  }
})
/* a shipped stage as a file (plan 16 W7.1) — no capture of its own yet, so the empty output frame is its cover */
export const SHIPPED_STAGES = STAGE_KEYS.map((key, i) => {
  const src = stages[key]
  return {
    id: `stage-${key}`, src: key, kind: 'stage', name: src.label, type: 'patches', tags: ['stage'],
    updatedAt: SHIP_DATE - i * DAY, bytes: new Blob([JSON.stringify(src)]).size, images: [], cover: '/previews/patches/empty.png',
    details: counts(src),
  }
})
/* a module definition as a file — the front, contained, is its cover */
export const SHIPPED_MODULES = Object.entries(MODULE_DEFS).map(([type, def], i) => ({
  id: type, src: type, kind: 'module', name: def.label, category: def.category, u_label: `${def.u}U`, tags: [def.category],
  updatedAt: SHIP_DATE - i * DAY, bytes: new Blob([JSON.stringify(def)]).size, cover: `/previews/modules/${type}.png`,
  details: [{ label: 'Category', value: cap(def.category) }, { label: 'Width', value: `${def.hp}HP` }, { label: 'Height', value: `${def.u}U` }],
}))

/* THIS DEVICE'S COPY, MERGED WITH WHAT SHIPS (2026-10-24 — a device seeded before the stages, the backs and the
   images shipped never saw them): every stored file keeps its edits over the shipped fields it lacks; a shipped
   file the device never had is added; one the user deleted stays deleted (`removed`). */
const SHIPPED = { patches: [...SHIPPED_PATCHES, ...SHIPPED_STAGES], modules: SHIPPED_MODULES }
function read() {
  let s = null
  try { s = JSON.parse(localStorage.getItem(KEY)) } catch { /* storage blocked or corrupt — the constants */ }
  if (!Array.isArray(s?.patches) || !Array.isArray(s?.modules)) return { ...SHIPPED, removed: [] }
  const removed = Array.isArray(s.removed) ? s.removed : []
  const merge = (stored, shipped) => {
    const byId = new Map(shipped.map((f) => [f.id, f]))
    const kept = stored.map((f) => ({ ...(byId.get(f.id) ?? byId.get(f.src) ?? {}), ...f }))
    const have = new Set(kept.map((f) => f.id))
    return [...kept, ...shipped.filter((f) => !have.has(f.id) && !removed.includes(f.id))]
  }
  return { patches: merge(s.patches, SHIPPED.patches), modules: merge(s.modules, SHIPPED.modules), removed }
}
const dataOf = (f) => (f.kind === 'module' ? MODULE_DEFS[f.src] : f.kind === 'stage' ? stages[f.src] : patches[f.src])

/* the shipped lists as this device's library, with every verb, and the ONE card both views draw */
export function useShipped() {
  const navigate = useNavigate()
  const [lists, setLists] = useState(read)
  const update = (f, fn) => setLists((l) => {
    const k = f.kind === 'module' ? 'modules' : 'patches'
    const next = { ...l, [k]: fn(l[k]) }
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* quota — keep session state */ }
    return next
  })
  const edit = (f, patch) => update(f, (fs) => fs.map((x) => (x.id === f.id ? { ...x, ...patch } : x)))
  const card = (f) => ({
    key: f.id, title: f.name, date: f.updatedAt, size: f.bytes, media: f.cover, back: f.back, backReveal: 'flip-card', tags: f.tags, details: f.details,
    mark: MARKS[f.kind],
    onTags: (tags) => edit(f, { tags }),
    note: f.note, onNote: (note) => edit(f, { note }),
    /* the File Rail's pictures (FileRailImages): the whole list back on add/remove; Cover and Back are picks (null clears) */
    images: f.images, onImages: (images) => edit(f, { images }),
    onCover: (src) => edit(f, { cover: src }),
    onBack: (src) => edit(f, { back: src }),
    verbs: {
      rename: (name) => edit(f, { name, updatedAt: Date.now() }),
      duplicate: () => update(f, (fs) => [{ ...f, id: `${f.id}-${Date.now().toString(36)}`, name: `${f.name} copy`, updatedAt: Date.now() }, ...fs]),
      remove: () => setLists((l) => {
        const k = f.kind === 'module' ? 'modules' : 'patches'
        const next = { ...l, [k]: l[k].filter((x) => x.id !== f.id), removed: [...(l.removed ?? []), f.id] }
        try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* quota — keep session state */ }
        return next
      }),
    },
    download: () => downloadBlob(new Blob([JSON.stringify(dataOf(f), null, 2)], { type: 'application/json' }), `${f.name}.json`),
    onClick: () => navigate(f.kind === 'module' ? `/library/module/${f.src}` : f.kind === 'stage' ? `/stage/${f.src}` : `/library/patch/${f.src}`),
  })
  return { patches: lists.patches, modules: lists.modules, card }
}
