import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patches } from '../data/patches'
import Button from '../components/atoms/Button'
import Icon from '../components/icons/Icon'
import GridCard from '../components/atoms/GridCard'
import PageHeader from '../components/PageHeader'
import ContentFilters from '../components/organisms/filters/ContentFilters'
import { Illustration } from '../walkthrough'

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
    tags: p.tags || [],
    tag: p.tags?.[0],
  }
})

const TAGS = [...new Set(PRESET_NAMES.flatMap(n => patches[n].tags || []))]
const FILTER_GROUPS = [
  { label: 'Tags', key: 'tags', values: TAGS },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [step, setStep] = useState(0)

  return (
    <div style={{ padding: '48px 48px', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      <PageHeader
        title="Monitor"
        subtitle="Video synthesis workstation"
      />

      <div style={{ flex: 1, position: 'relative' }}>
        {showWalkthrough && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', gap: 16,
            maxWidth: 960, width: '100%', zIndex: 10,
          }}>
            <Button
              variant="secondary"
              size="sm"
              iconOnly="chevron-left"
              disabled={step === 0}
              onClick={() => setStep(s => Math.max(0, s - 1))}
              style={{ padding: 8 }}
            />

            <div
              className="bg-surface-tertiary border border-fg-08"
              style={{
                flex: 1, display: 'flex', borderRadius: 4, minHeight: 480,
                overflow: 'hidden',
              }}
            >
              {WALKTHROUGH_STEPS[step].actions ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <Button variant="secondary" size="sm" onClick={() => { setShowWalkthrough(false); navigate('/create') }}>Create Rack</Button>
                  <Button variant="secondary" size="sm" onClick={() => { setShowWalkthrough(false); navigate('/library') }}>Browse Library</Button>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, padding: '64px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 className="text-fg-80 kol-text-sm" style={{ marginBottom: 12 }}>{WALKTHROUGH_STEPS[step].title}</h3>
                      {(Array.isArray(WALKTHROUGH_STEPS[step].text) ? WALKTHROUGH_STEPS[step].text : [WALKTHROUGH_STEPS[step].text]).map((t, i) => (
                        <p key={i} className="text-fg-48 kol-helper-xs" style={{ lineHeight: 1.8, marginTop: i > 0 ? 12 : 0 }}>{t}</p>
                      ))}
                    </div>
                    <span className="text-fg-48 kol-helper-xs">{step + 1} / {WALKTHROUGH_STEPS.length}</span>
                  </div>
                  <div style={{ flex: '0 0 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.48)' }}>
                    <Illustration name={WALKTHROUGH_STEPS[step].svg} />
                  </div>
                </>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              iconOnly="chevron-right"
              disabled={step === WALKTHROUGH_STEPS.length - 1}
              onClick={() => setStep(s => Math.min(WALKTHROUGH_STEPS.length - 1, s + 1))}
              style={{ padding: 8 }}
            />
          </div>
        )}
        <ContentFilters
            items={allPresets}
            title="All Presets"
            totalCount={allPresets.length}
            filterGroups={FILTER_GROUPS}
            showCountOnlyWhenFiltering
            viewModeOptions={[
              { value: 'recent', label: 'Recent' },
              { value: 'saved', label: 'Saved' },
            ]}
            defaultViewMode="recent"
            layoutOptions={showWalkthrough ? undefined : [
              { value: 'list', label: 'List' },
              { value: 'grid', label: 'Grid' },
            ]}
            defaultLayout="grid"
            renderItem={(items, viewMode, layout) => {
              if (showWalkthrough) return null

              if (viewMode === 'recent') {
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: layout === 'list' ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)', gap: layout === 'list' ? 8 : 24 }}>
                    <GridCard
                      variant={layout === 'list' ? 'list' : undefined}
                      title="Empty 7U"
                      detail="7U — power, perf, patch"
                      previewFit="compact"
                      preview={layout !== 'list' ? <img src="/previews/patches/empty.png" alt="Empty 7U" /> : undefined}
                      onClick={() => navigate('/rack/patch/empty')}
                    />
                  </div>
                )
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: layout === 'list' ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)', gap: layout === 'list' ? 8 : 24 }}>
                  {items.map(p => (
                    <GridCard
                      key={p.name}
                      variant={layout === 'list' ? 'list' : undefined}
                      title={p.title}
                      detail={p.detail}
                      previewFit="compact"
                      preview={layout !== 'list' ? <img src={`/previews/patches/${p.name}.png`} alt={p.title} /> : undefined}
                      onClick={() => navigate(`/rack/preset/${p.name}`)}
                    />
                  ))}
                </div>
              )
            }}
          />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 48, alignSelf: 'flex-start' }}>
        <Button variant="secondary" size="sm" onClick={() => navigate('/create')}>
          New Rack
        </Button>
        <Button variant="secondary" size="sm" onClick={() => { setShowWalkthrough(!showWalkthrough); setStep(0) }}>
          {showWalkthrough ? 'Close' : 'Walkthrough'}
        </Button>
      </div>
    </div>
  )
}
