import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULE_DEFS } from '../moduleRegistry'
import { patches } from '../patches'
import Button from '../components/atoms/Button'
import PatchCard from '../components/atoms/PatchCard'
import PageHeader from '../components/PageHeader'
import usePersistedState from '../hooks/usePersistedState'
import ContentFilters from '../components/organisms/filters/ContentFilters'
import ModulePreview from '../components/ModulePreview'
import GridCard from '../components/atoms/GridCard'

const PRESET_NAMES = Object.keys(patches).filter(k => k !== 'ref' && k !== 'empty')

const allModules = Object.entries(MODULE_DEFS).map(([type, def]) => ({
  type, ...def,
  u_label: `${def.u}U`,
}))

const allPatches = PRESET_NAMES.map(name => {
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

const MODULE_FILTER_GROUPS = [
  { label: 'Category', key: 'category', values: ['control', 'math', 'generators', 'display', 'utility'] },
  { label: 'Size', key: 'u_label', values: ['1U', '3U'] },
]

const PATCH_TAGS = [...new Set(PRESET_NAMES.flatMap(n => patches[n].tags || []))]
const PATCH_FILTER_GROUPS = [
  { label: 'Tags', key: 'tags', values: PATCH_TAGS },
]

export default function LibraryPage() {
  const navigate = useNavigate()
  const [tab, setTab] = usePersistedState('library-tab', 'modules')
  const [expandedModule, setExpandedModule] = useState(null)
  const [expandedPatch, setExpandedPatch] = useState(null)

  return (
    <div style={{ padding: '48px 48px', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      <PageHeader
        title="Library"
        subtitle="Modules and patches"
      />

      <div style={{ flex: 1 }}>
        {tab === 'modules' && (
          <ContentFilters
            items={allModules}
            title={`All Modules`}
            totalCount={allModules.length}
            viewModeOptions={[
              { value: 'modules', label: 'Modules' },
              { value: 'patches', label: 'Patches' },
            ]}
            defaultViewMode="modules"
            onFilterChange={(filters, mode) => { if (mode !== tab) setTab(mode) }}
            filterGroups={MODULE_FILTER_GROUPS}
            mutuallyExclusiveFilters={['category', 'u_label']}
            renderItem={(items) => {
              // Find which 2x2 block the expanded card belongs to
              const expandedIdx = items.findIndex(m => m.type === expandedModule)
              let hiddenSet = new Set()
              if (expandedIdx >= 0) {
                const blockCol = Math.floor((expandedIdx % 6) / 2) // 0, 1, or 2
                const blockRow = Math.floor(Math.floor(expandedIdx / 6) / 2)
                // The 4 indices in this 2x2 block
                const base = blockRow * 12 + blockCol * 2
                ;[base, base + 1, base + 6, base + 7].forEach(i => {
                  if (i !== expandedIdx && i < items.length) hiddenSet.add(i)
                })
              }
              return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                {items.map((m, idx) => {
                  if (hiddenSet.has(idx)) return null
                  const isExpanded = expandedModule === m.type
                  return (
                    <GridCard
                      key={m.type}
                      title={m.label}
                      detail={`${m.hp}HP ${m.u}U — ${m.category}`}
                      expanded={isExpanded}
                      preview={<ModulePreview moduleType={m.type} />}
                      onClick={() => setExpandedModule(isExpanded ? null : m.type)}
                      expandedContent={
                        <>
                          <div>
                            <h2 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>{m.label}</h2>
                            <p className="text-fg-48 kol-helper-xs" style={{ marginBottom: 16, textTransform: 'capitalize' }}>{m.hp}HP — {m.u}U — {m.category}</p>
                            <p className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.6 }}>
                              {m.description || 'No description yet.'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                            <div className="text-fg-48 kol-helper-xs" style={{ textTransform: 'capitalize' }}>Category: {m.category}</div>
                            <div className="text-fg-48 kol-helper-xs">Width: {m.hp}HP</div>
                            <div className="text-fg-48 kol-helper-xs">Height: {m.u}U</div>
                          </div>
                        </>
                      }
                    />
                  )
                })}
              </div>
              )
            }}
          />
        )}

        {tab === 'patches' && (
          <ContentFilters
            items={allPatches}
            title={`All Patches`}
            totalCount={allPatches.length}
            filterGroups={PATCH_FILTER_GROUPS}
            viewModeOptions={[
              { value: 'modules', label: 'Modules' },
              { value: 'patches', label: 'Patches' },
            ]}
            defaultViewMode="patches"
            onFilterChange={(filters, mode) => { if (mode !== tab) setTab(mode) }}
            renderItem={(items) => {
              const expandedIdx = items.findIndex(p => p.name === expandedPatch)
              let hiddenSet = new Set()
              if (expandedIdx >= 0) {
                const blockCol = Math.floor((expandedIdx % 6) / 2)
                const blockRow = Math.floor(Math.floor(expandedIdx / 6) / 2)
                const base = blockRow * 12 + blockCol * 2
                ;[base, base + 1, base + 6, base + 7].forEach(i => {
                  if (i !== expandedIdx && i < items.length) hiddenSet.add(i)
                })
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                  {items.map((p, idx) => {
                    if (hiddenSet.has(idx)) return null
                    const isExpanded = expandedPatch === p.name
                    return (
                      <GridCard
                        key={p.name}
                        title={p.title}
                        detail={p.detail}
                        expanded={isExpanded}
                        onClick={() => setExpandedPatch(isExpanded ? null : p.name)}
                        expandedContent={
                          <>
                            <div>
                              <h2 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>{p.title}</h2>
                              <p className="text-fg-48 kol-helper-xs" style={{ marginBottom: 16 }}>{p.detail}</p>
                              <p className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.6 }}>
                                {patches[p.name]?.description || 'No description yet.'}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                              {p.tags.length > 0 && <div className="text-fg-48 kol-helper-xs">Tags: {p.tags.join(', ')}</div>}
                              <span
                                className="patch-link kol-helper-s"
                                onClick={(e) => { e.stopPropagation(); navigate(`/rack/patch/${p.name}`) }}
                              >Open in Rack</span>
                            </div>
                          </>
                        }
                      />
                    )
                  })}
                </div>
              )
            }}
          />
        )}
      </div>

      <Button variant="secondary" size="sm" onClick={() => navigate('/create')} style={{ marginTop: 48, alignSelf: 'flex-start' }}>
        New Rack
      </Button>
    </div>
  )
}
