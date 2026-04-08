import { useNavigate } from 'react-router-dom'
import { patches } from '../patches'
import Button from '../components/atoms/Button'
import GridCard from '../components/atoms/GridCard'
import PageHeader from '../components/PageHeader'
import ContentFilters from '../components/organisms/filters/ContentFilters'

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

  return (
    <div style={{ padding: '48px 48px', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      <PageHeader
        title="Video Modulo"
        subtitle="Video synthesis workstation"
      />

      <div style={{ flex: 1 }}>
        <ContentFilters
          items={allPresets}
          title="All Presets"
          totalCount={allPresets.length}
          filterGroups={FILTER_GROUPS}
          viewModeOptions={[
            { value: 'recent', label: 'Recent' },
            { value: 'saved', label: 'Saved' },
          ]}
          defaultViewMode="recent"
          layoutOptions={[
            { value: 'list', label: 'List' },
            { value: 'grid', label: 'Grid' },
          ]}
          defaultLayout="grid"
          renderItem={(items, viewMode, layout) => {
            if (layout === 'list') {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {viewMode === 'recent' ? (
                    <GridCard variant="list" title="Empty 7U" detail="7U — power, perf, patch" onClick={() => navigate('/rack/patch/empty')} />
                  ) : (
                    items.map(p => (
                      <GridCard key={p.name} variant="list" title={p.title} detail={p.detail} onClick={() => navigate(`/rack/preset/${p.name}`)} />
                    ))
                  )}
                </div>
              )
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                {viewMode === 'recent' ? (
                  <GridCard
                    title="Empty 7U"
                    detail="7U — power, perf, patch"
                    previewFit="compact"
                    preview={<img src="/previews/patches/empty.png" alt="Empty 7U" />}
                    onClick={() => navigate('/rack/patch/empty')}
                  />
                ) : (
                  items.map(p => (
                    <GridCard
                      key={p.name}
                      title={p.title}
                      detail={p.detail}
                      previewFit="compact"
                      preview={<img src={`/previews/patches/${p.name}.png`} alt={p.title} />}
                      onClick={() => navigate(`/rack/preset/${p.name}`)}
                    />
                  ))
                )}
              </div>
            )
          }}
        />
      </div>

      <Button variant="secondary" size="sm" onClick={() => navigate('/rack/patch/empty')} style={{ marginTop: 48, alignSelf: 'flex-start' }}>
        New Rack
      </Button>
    </div>
  )
}
