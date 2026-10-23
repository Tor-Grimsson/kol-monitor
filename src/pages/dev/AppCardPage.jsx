import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CatalogPage } from '@kolkrabbi/kol-shell'
import { MODULE_DEFS } from '../../modules/registry'
import { useLibrary, addToLibrary, renameInLibrary, removeFromLibrary } from '../../hooks/useLibraryStore'
import { downloadPatch } from '../../hooks/usePatchFile'

/**
 * AppCardPage — the Dev tab that reviews kol-component's `app` card (CatalogPage `preset="app"`, kol-shell
 * 0.75.0, ticket MonitorLibraryOnAppPreset) on monitor's own data before Library switches: SAVED is your
 * library with every verb it has, MODULES is the registry with none.
 */

const MODULES = Object.entries(MODULE_DEFS).map(([type, def]) => ({ type, ...def, title: def.label }))

const VIEWS = [
  { value: 'saved', label: 'SAVED' },
  { value: 'modules', label: 'MODULES' },
]

export default function AppCardPage() {
  const navigate = useNavigate()
  const library = useLibrary()
  const [view, setView] = useState('saved')

  const toCard = (item, { view }) => view === 'modules'
    ? {
        key: item.type,
        title: item.label,
        meta: `${item.hp}HP ${item.u}U`,
        fit: 'natural',
        media: <img className="absolute top-0 left-0" src={`/previews/modules/${item.type}.png`} alt={item.label} />,
        onClick: () => navigate(`/library/${item.type}`),
      }
    : {
        key: item.id,
        title: item.name,
        meta: `${item.data.rows?.reduce((s, r) => s + (r.modules?.length || 0), 0) || 0} modules`,
        fit: 'compact',
        media: <img src={`/previews/patches/${item.seedOf || 'empty'}.png`} alt={item.name} />,
        date: item.savedAt,
        size: JSON.stringify(item.data).length,
        download: () => downloadPatch(item.data, item.name),
        verbs: {
          rename: (name) => renameInLibrary(item.id, name),
          duplicate: () => addToLibrary({ ...item.data, name: `${item.name} copy` }),
          remove: () => removeFromLibrary(item.id),
        },
        onClick: () => navigate(`/rack/patch/${item.id}`),
      }

  return (
    <CatalogPage
      preset="app"
      header={{ title: 'App card', subtitle: 'CatalogPage preset="app" on your files' }}
      key={view}
      items={view === 'modules' ? MODULES : library}
      views={VIEWS}
      view={view}
      onViewChange={setView}
      searchKeys={['title', 'name']}
      toCard={toCard}
    />
  )
}
