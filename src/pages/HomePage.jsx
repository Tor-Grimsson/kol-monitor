import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patches } from '../data/patches'
import { Illustration } from '../walkthrough'
import { useLibrary, addToLibrary, renameInLibrary, removeFromLibrary, editSaved } from '../hooks/useLibraryStore'
import { MARKS, patchImages } from './shipped'
import { downloadPatch } from '../hooks/usePatchFile'

/**
 * HomePage — `/`, as the DATA the Studio's `HubHome` renders (kol-shell
 * `AppStudio`, 2026-10-15 — mirror's shape). The masthead (the app's name and
 * subtitle), RECENT · SAVED, the Walkthrough button and its Close label are the
 * Hub's; what is left here is monitor's: the library's saves as files (the Hub
 * picks RECENT and SAVED), every verb, a click opens the rack. `App.jsx` hands `useHomeProps()` to the
 * Studio's `home=` / `walkthrough=`.
 */

const WALKTHROUGH_STEPS = [
  {
    title: '1. Build',
    svg: 'build',
    text: ['Add rows to your case and pick modules from the workbench. Use the icons in the bottom-right corner to add 1U/3U rows and set HP width.', 'Filter and search modules by category, or name your case with the edit button.'],
  },
  {
    title: '2. Patch',
    svg: 'patch',
    text: ['Click an output jack, then click an input jack — a cable connects them and signals flow.', 'Press C to lock cables, O to toggle cable visibility, D to clear the display.'],
  },
  {
    title: '3. Modulate',
    svg: 'modulate',
    text: ['Patch an LFO or envelope into any CV jack to animate parameters.', 'Sync modules to a shared Clock source for internal rhythm.'],
  },
  {
    title: '4. Watch',
    svg: 'watch',
    text: ['Your signal appears on display modules — Monitor, Scope, Console, Output.', 'Patch a Pen module into the pen input to control stroke, dash, and opacity of the signal vector.'],
  },
  {
    title: '5. Record & Save',
    svg: 'record',
    text: [
      'The Recorder module captures .webm video. Set resolution (720p–4K), frame rate (30/60fps), aspect ratio (1:1, 16:9, 9:16, and more), and duration before recording.',
      <>Convert with <a href="https://formulae.brew.sh/formula/ffmpeg" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-400">ffmpeg</a>: ffmpeg -i render.webm output.mp4 — or use a transcoder app like <a href="https://handbrake.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-400">HandBrake</a>.</>,
      'Export your patch as a JSON file from the Patch module or the sidebar. Import it later to restore your rack, modules, connections, and settings.',
    ],
  },
  {
    title: 'Get Started',
    actions: true,
  },
]

const PRESET_NAMES = Object.keys(patches).filter(k => k !== 'ref' && k !== 'empty')

/* a save (the library — plan 13 W7) as a file. Its pictures (plan 16 W8): what it stores, else a seeded starter's
   output + rack, else the old single `thumb`; the cover and the back are picks from them, else the first two —
   and with nothing at all, the empty case's frame. The mark names the kind (W7.2). */
const saveFile = (item) => {
  const p = item.data
  const images = item.images ?? (item.seedOf ? patchImages(item.seedOf) : item.thumb ? [{ id: 'output', src: item.thumb, label: 'Output' }] : [])
  return {
    id: item.id,
    name: item.name,
    kind: item.kind ?? 'patch',
    mark: MARKS[item.kind ?? 'patch'],
    type: 'patches',
    tags: item.tags ?? [],
    updatedAt: item.updatedAt ?? item.savedAt,
    bytes: new Blob([JSON.stringify(p)]).size,
    images,
    cover: item.cover ?? item.thumb ?? images[0]?.src ?? '/previews/patches/empty.png',
    back: item.back !== undefined ? item.back : images[1]?.src,
    details: [
      { label: 'Modules', value: p.rows?.reduce((n, r) => n + (r.modules?.length || 0), 0) || 0 },
      { label: 'Connections', value: p.connections?.length || 0 },
    ],
  }
}

const TAGS = [...new Set(PRESET_NAMES.flatMap(n => patches[n].tags || []))]
/* TYPE stacks as a narrow column (`stack`), TAGS wraps beside it — the DS's own group shapes; Type is exclusive */
export const FILTER_GROUPS = [
  { label: 'Type', key: 'type', values: ['envelope', 'effects', 'patches'], stack: true, exclusive: true },
  { label: 'Tags', key: 'tags', values: TAGS },
]

/* HOME IS A DATA CONTRACT: the library's saves as files — the Hub draws the cards and picks RECENT (the 12
   newest) and SAVED (all). Signed in or not — signed out is a user with a local library (seeded with the
   starters), sign-in only syncs it (user 2026-10-18). The blank start is New Rack, the action button. */
export function useHomeProps() {
  const navigate = useNavigate()
  const library = useLibrary()
  /* ids AND save stamps: a picked cover or an added image (editSaved) re-stamps its save, so the card follows */
  const key = library.map((e) => `${e.id}:${e.savedAt}`).join()
  const [files, setFiles] = useState(() => library.map(saveFile))
  /* re-seed when the library's ids change — during render, React's "adjust state on a prop change", not an effect */
  // ponytail: a Duplicate or Delete re-seeds from the library, so session-only tags and notes on other files reset then; lifts when the store carries tags
  const [seeded, setSeeded] = useState(key)
  if (seeded !== key) { setSeeded(key); setFiles(library.map(saveFile)) }
  const entry = (id) => library.find((e) => e.id === id)
  const edit = (id, patch) => setFiles((fs) => fs.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const walkthrough = WALKTHROUGH_STEPS.map(s => s.actions
    /* the Get started actions as DATA: the Hub draws the DS Buttons and closes the walkthrough before each handler */
    ? { ...s, actions: [{ label: 'Create Rack', onClick: () => navigate('/create') }, { label: 'Browse Library', onClick: () => navigate('/library') }] }
    : {
        title: s.title,
        text: Array.isArray(s.text) ? s.text : [s.text],
        illustration: (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="text-fg-48">
            <Illustration name={s.svg} />
          </div>
        ),
      })

  const home = {
    files,
    onOpen: (f) => navigate(f.kind === 'stage' ? `/stage/${f.id}` : `/rack/patch/${f.id}`),
    onDownload: (f) => { const e = entry(f.id); downloadPatch(e.data, e.name) },
    onRename: (f, name) => { renameInLibrary(f.id, name); edit(f.id, { name, updatedAt: Date.now() }) },
    onDuplicate: (f) => { const e = entry(f.id); addToLibrary({ ...e.data, name: `${e.name} copy` }, { kind: e.kind, images: f.images }) },
    onRemove: (f) => removeFromLibrary(f.id),
    onTags: (f, tags) => edit(f.id, { tags }),
    onNote: (f, note) => edit(f.id, { note }),
    /* the File Rail's pictures (FileRailImages): the whole list on add/remove; Cover and Back are picks, null clears */
    onImages: (f, images) => editSaved(f.id, { images }),
    onCover: (f, src) => editSaved(f.id, { cover: src }),
    onBack: (f, src) => editSaved(f.id, { back: src }),
    filterGroups: FILTER_GROUPS,
    action: { label: 'New Rack', onClick: () => navigate('/create') },
  }
  return { home, walkthrough }
}
