import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MODULE_DEFS } from '../modules/registry'
import { patches } from '../data/patches'
import Button from '../components/atoms/Button'
import usePersistedState from '../hooks/usePersistedState'
import { CatalogPage } from '@kolkrabbi/kol-shell'

/**
 * LibraryPage — `/library`: MODULES · PATCHES on kol-shell's `CatalogPage`
 * (0.10.0 — `CatalogPageMonitorParity`: the page hides the 2×2 expanded card's
 * three neighbours itself, and `fit natural / compact` are the retired
 * GridCard's fits). `key={tab}`: the organism's active-filter set is keyed by
 * group, and the two views have different groups — a stale Category chip would
 * filter every patch out. Remount per view, one instance in code.
 */

const PRESET_NAMES = Object.keys(patches).filter(k => k !== 'ref' && k !== 'empty')

const allModules = Object.entries(MODULE_DEFS).map(([type, def]) => ({
  type, ...def,
  u_label: `${def.u}U`,
  // Authored case — the DS cards render strings as written (no auto-casing)
  categoryLabel: def.category.charAt(0).toUpperCase() + def.category.slice(1),
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

const VIEW_MODE_OPTIONS = [
  { value: 'modules', label: 'MODULES' },
  { value: 'patches', label: 'PATCHES' },
]

/* ContentFilters' own default — CatalogPage narrows it to title/name, and a module searches by label/type */
const SEARCH_KEYS = ['label', 'name', 'title', 'type']

/* what each view feeds the one page */
const VIEWS = {
  modules: { items: allModules, title: 'All Modules', filterGroups: MODULE_FILTER_GROUPS, exclusive: ['category', 'u_label'] },
  patches: { items: allPatches, title: 'All Patches', filterGroups: PATCH_FILTER_GROUPS, exclusive: [] },
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = usePersistedState('library-tab', 'modules')
  const [expandedModule, setExpandedModule] = useState(location.state?.expandedModule || null)
  const [expandedPatch, setExpandedPatch] = useState(location.state?.expandedPatch || null)
  const view = VIEWS[tab] ?? VIEWS.modules

  const moduleCard = (m, { layout }) => {
    if (layout === 'list') return { key: m.type, title: m.label, detail: m.categoryLabel, onClick: () => navigate(`/library/${m.type}`) }
    const isExpanded = expandedModule === m.type
    return {
      key: m.type,
      title: m.label,
      detail: `${m.hp}HP ${m.u}U — ${m.categoryLabel}`,
      fit: 'natural',
      media: <img className="absolute top-0 left-0" src={`/previews/modules/${m.type}.png`} alt={m.label} />,
      expanded: isExpanded,
      onClick: () => setExpandedModule(isExpanded ? null : m.type),
      expandedContent: (
        <>
          <div>
            <h2 className="text-fg-96 kol-mono-heading-03" style={{ marginBottom: 8 }}>{m.label}</h2>
            <p className="text-fg-48 kol-helper-12" style={{ marginBottom: 16, textTransform: 'capitalize' }}>{m.hp}HP — {m.u}U — {m.category}</p>
            <p className="text-fg-48 kol-helper-10" style={{ lineHeight: 1.6 }}>
              {m.description || 'No description yet.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <div className="text-fg-48 kol-helper-12" style={{ textTransform: 'capitalize' }}>Category: {m.category}</div>
            <div className="text-fg-48 kol-helper-12">Width: {m.hp}HP</div>
            <div className="text-fg-48 kol-helper-12">Height: {m.u}U</div>
            <Button variant="grey" size="md" style={{ alignSelf: 'flex-start', background: 'var(--kol-surface-primary)', marginTop: 16 }}
              onClick={(e) => { e.stopPropagation(); navigate(`/library/${m.type}`) }}
            >Details</Button>
          </div>
        </>
      ),
    }
  }

  const patchCard = (p, { layout }) => {
    if (layout === 'list') return { key: p.name, title: p.title, detail: p.detail, onClick: () => navigate(`/rack/patch/${p.name}`) }
    const isExpanded = expandedPatch === p.name
    return {
      key: p.name,
      title: p.title,
      detail: p.detail,
      fit: 'compact',
      media: <img className="absolute top-0 left-0" src={`/previews/patches/${p.name}.png`} alt={p.title} />,
      expanded: isExpanded,
      onClick: () => setExpandedPatch(isExpanded ? null : p.name),
      expandedContent: (
        <>
          <div>
            <h2 className="text-fg-96 kol-mono-heading-03" style={{ marginBottom: 8 }}>{p.title}</h2>
            <p className="text-fg-48 kol-helper-12" style={{ marginBottom: 16 }}>{p.detail}</p>
            <p className="text-fg-48 kol-helper-10" style={{ lineHeight: 1.6 }}>
              {patches[p.name]?.description || ''}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {p.tags.length > 0 && <div className="text-fg-48 kol-helper-12">Tags: {p.tags.join(', ')}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <Button variant="grey" size="md" style={{ background: 'var(--kol-surface-primary)' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/library/patch/${p.name}`) }}
              >Details</Button>
              <Button variant="grey" size="md" style={{ background: 'var(--kol-surface-primary)' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/rack/patch/${p.name}`) }}
              >Open in Rack</Button>
            </div>
          </div>
        </>
      ),
    }
  }

  return (
    <CatalogPage
      className="no-card-hover"
      key={tab}
      header={{ title: 'Library', subtitle: 'Modules and patches', size: 'sm', voice: 'mono' }}
      items={view.items}
      filtersTitle={view.title}
      filterGroups={view.filterGroups}
      searchKeys={SEARCH_KEYS}
      views={VIEW_MODE_OPTIONS}
      view={tab}
      onViewChange={setTab}
      filtersProps={{ mutuallyExclusiveFilters: view.exclusive, tone: 'sunken' }}
      toCard={tab === 'patches' ? patchCard : moduleCard}
      actions={
        <Button variant="grey" size="md" onClick={() => navigate('/create')}>
          New Rack
        </Button>
      }
    />
  )
}
