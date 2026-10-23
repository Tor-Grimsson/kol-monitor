import { useNavigate } from 'react-router-dom'
import { patches } from '../data/patches'
import Button from '../components/atoms/Button'
import { Illustration } from '../walkthrough'
import { useLibrary, addToLibrary, renameInLibrary, removeFromLibrary } from '../hooks/useLibraryStore'
import { downloadPatch } from '../hooks/usePatchFile'

/**
 * HomePage — `/`, as the DATA the Studio's `HubHome` renders (kol-shell
 * `AppStudio`, 2026-10-15 — mirror's shape). The masthead (the app's name and
 * subtitle), RECENT · SAVED, the Walkthrough button and its Close label are the
 * Hub's; what is left here is monitor's: RECENT is the empty case and your newest
 * files, SAVED is your files, a click opens the rack. `App.jsx` hands `useHomeProps()` to the
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

/* a saved patch (the library — plan 13 W7) as a card: a seeded starter keeps its preset's picture,
   anything else shows the empty case's */
const savedCard = (item) => {
  const p = item.data
  const moduleCount = p.rows?.reduce((sum, r) => sum + (r.modules?.length || 0), 0) || 0
  return {
    name: item.id,
    title: item.name,
    detail: `${moduleCount} modules, ${p.connections?.length || 0} connections`,
    type: 'patches',
    tags: [],
    preview: item.seedOf || 'empty',
    to: `/rack/patch/${item.id}`,
    item,
  }
}
const RECENT_FILES = 12

const TAGS = [...new Set(PRESET_NAMES.flatMap(n => patches[n].tags || []))]
/* TYPE stacks as a narrow column (`stack`), TAGS wraps beside it — the DS's own group shapes */
const FILTER_GROUPS = [
  { label: 'Type', key: 'type', values: ['envelope', 'effects', 'patches'], stack: true },
  { label: 'Tags', key: 'tags', values: TAGS },
]

/* RECENT: the empty case, then your newest files. SAVED: your files. Signed in or not — signed out is a
   user with a local library (seeded with the starters), sign-in only syncs it (user 2026-10-18). Every
   preset lives in Library. The Hub's RECENT · SAVED strip picks. */
const EMPTY_CASE = { name: 'empty', title: 'Empty 7U', detail: '7U — power, perf, patch', type: 'patches', tags: [], preview: 'empty', to: '/rack/patch/empty' }

export function useHomeProps() {
  const navigate = useNavigate()
  /* newest first — a sign-in merge appends remote saves anywhere, so the stamp orders, not the list */
  const library = useLibrary()
  const saves = [...library].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)).map(savedCard)
  const recent = [EMPTY_CASE, ...saves.slice(0, RECENT_FILES)]

  const walkthrough = WALKTHROUGH_STEPS.map(s => s.actions
    ? {
        ...s,
        actions: (close) => (
          <>
            <Button tone="grey" size="md" onClick={() => { close(); navigate('/create') }}>Create Rack</Button>
            <Button tone="grey" size="md" onClick={() => { close(); navigate('/library') }}>Browse Library</Button>
          </>
        ),
      }
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
    className: 'no-card-hover',
    items: (view) => (view === 'recent' ? recent : saves),
    defaultView: 'recent',
    filtersTitle: 'All Presets',
    filterGroups: FILTER_GROUPS,
    filtersProps: { mutuallyExclusiveFilters: ['type'], tone: 'sunken' },
    /* the `app` card and row, as Library — HubHome forces `rowVariant="file"`, so the row is named too */
    preset: 'app',
    rowVariant: 'app',
    /* HubHome forces `listLayout="stack"` — Library's list is the preset's grid */
    listLayout: 'grid',
    /* the family's one `app` fill (fxr plan 39, mirror, monitor 2026-10-23): a saved file is
       date · size · verbs · download; the blank start is title · meta · media only */
    toCard: (p, { layout }) => ({
      key: p.name,
      title: p.title,
      detail: p.detail,
      /* the app card has no detail line — the counts ride its meta slot */
      meta: p.detail,
      ...(layout !== 'list' && { fit: 'compact' }),
      ...(p.item && {
        date: p.item.updatedAt ?? p.item.savedAt,
        size: new Blob([JSON.stringify(p.item.data)]).size,
        download: () => downloadPatch(p.item.data, p.item.name),
        verbs: {
          rename: (name) => renameInLibrary(p.item.id, name),
          duplicate: () => addToLibrary({ ...p.item.data, name: `${p.item.name} copy` }),
          remove: () => removeFromLibrary(p.item.id),
        },
      }),
      /* the app row takes the preview as a src */
      media: layout === 'list' ? `/previews/patches/${p.preview}.png` : <img src={`/previews/patches/${p.preview}.png`} alt={p.title} />,
      onClick: () => navigate(p.to),
    }),
    actions: (
      <Button tone="grey" size="md" onClick={() => navigate('/create')}>
        New Rack
      </Button>
    ),
  }

  return { home, walkthrough }
}
