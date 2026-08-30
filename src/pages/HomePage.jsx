import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patches } from '../data/patches'
import Button from '../components/atoms/Button'
import { Illustration } from '../walkthrough'
import { CatalogPage } from '@kolkrabbi/kol-shell'

/**
 * HomePage — the front door, at `/`, on kol-shell's `CatalogPage`
 * (ShellHomeSystem, kol-shell 0.8.0 — this page was one of its three sources;
 * adopted 2026-08-27 on kol-fxr's wiring). Semantics stay the consumer's:
 * RECENT is the one empty case, SAVED is every preset, a click opens the rack.
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

const allPresets = PRESET_NAMES.map(name => {
  const p = patches[name]
  const moduleCount = p.rows?.reduce((sum, r) => sum + (r.modules?.length || 0), 0) || 0
  const connCount = p.connections?.length || 0
  return {
    name,
    title: name.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim(),
    detail: `${moduleCount} modules, ${connCount} connections`,
    // ponytail: no preset carries a type yet — all read 'patches' until `type: 'envelope' | 'effects'` is set on one in patches.js
    type: p.type ?? 'patches',
    tags: p.tags || [],
    tag: p.tags?.[0],
  }
})

const TAGS = [...new Set(PRESET_NAMES.flatMap(n => patches[n].tags || []))]
/* TYPE stacks as a narrow column (`stack`), TAGS wraps beside it — the DS's own group shapes */
const FILTER_GROUPS = [
  { label: 'Type', key: 'type', values: ['envelope', 'effects', 'patches'], stack: true },
  { label: 'Tags', key: 'tags', values: TAGS },
]

const VIEWS = [
  { value: 'recent', label: 'RECENT' },
  { value: 'saved', label: 'SAVED' },
]

/* RECENT shows the one empty case; SAVED shows every preset — the hand-written
   page's semantics, now driven through CatalogPage's controlled view. */
const EMPTY_CASE = { name: 'empty', title: 'Empty 7U', detail: '7U — power, perf, patch', type: 'patches', tags: [] }

export default function HomePage() {
  const navigate = useNavigate()
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [view, setView] = useState('recent')
  const items = view === 'recent' ? [EMPTY_CASE] : allPresets

  const steps = WALKTHROUGH_STEPS.map(s => s.actions
    ? {
        ...s,
        actions: (
          <>
            <Button variant="grey" size="md" onClick={() => { setShowWalkthrough(false); navigate('/create') }}>Create Rack</Button>
            <Button variant="grey" size="md" onClick={() => { setShowWalkthrough(false); navigate('/library') }}>Browse Library</Button>
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

  return (
    <CatalogPage
      className="no-card-hover"
      header={{ title: 'Monitor', subtitle: 'Video synthesis workstation', size: 'sm', voice: 'mono' }}
      items={items}
      filtersTitle="All Presets"
      filterGroups={FILTER_GROUPS}
      views={VIEWS}
      view={view}
      onViewChange={setView}
      filtersProps={{ mutuallyExclusiveFilters: ['type'], tone: 'sunken' }}
      toCard={(p) => ({
        key: p.name,
        title: p.title,
        detail: p.detail,
        fit: 'compact',
        media: <img src={`/previews/patches/${p.name}.png`} alt={p.title} />,
        onClick: () => navigate(p.name === 'empty' ? '/rack/patch/empty' : `/rack/preset/${p.name}`),
      })}
      walkthrough={{ open: showWalkthrough, steps }}
      actions={
        <>
          <Button variant="grey" size="md" onClick={() => navigate('/create')}>
            New Rack
          </Button>
          <Button variant="grey" size="md" onClick={() => setShowWalkthrough(!showWalkthrough)}>
            {showWalkthrough ? 'Close' : 'Walkthrough'}
          </Button>
        </>
      }
    />
  )
}
