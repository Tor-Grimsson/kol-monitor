import { useState } from 'react'
import { CatalogPage } from '@kolkrabbi/kol-shell'
import { FILTER_GROUPS } from './HomePage'
import { useShipped } from './shipped'

/**
 * LibraryPage — `/library` on kol-shell's `CatalogPage`, preset `app`: what the app SHIPS (`shipped.jsx`) —
 * PATCHES the presets, MODULES the module defs, both on the ONE card with every field and verb. Home's saves
 * are not here (user 2026-10-24: Home is the user's saves, the Library the system's). A card opens its page.
 * It lands on the patches and never persists the view. `key={view}`: the organism's active-filter set is keyed by group, and the two views
 * have different groups — a stale Category chip would filter every patch out. No foot button.
 * The page before is in `_tmp/2026-10-24-library-on-file-card/`.
 */
const MODULE_GROUPS = [
  { label: 'Category', key: 'category', values: ['control', 'math', 'generators', 'display', 'utility'] },
  { label: 'Size', key: 'u_label', values: ['1U', '3U'] },
]

/* `flipped` (F) and `backHover` (Settings → Hover flips card) come from App — AppCardWholeFlip */
export default function LibraryPage({ flipped, backHover }) {
  const { patches, modules, card } = useShipped()
  const [view, setView] = useState('patches')
  const files = view === 'patches'
  return (
    <CatalogPage
      key={view}
      preset="app"
      header={{ title: 'Library', subtitle: 'Modules and patches' }}
      items={files ? patches : modules}
      views={[{ value: 'patches', label: 'PATCHES' }, { value: 'modules', label: 'MODULES' }]}
      view={view}
      onViewChange={setView}
      filtersTitle={files ? 'All Patches' : 'All Modules'}
      filterGroups={files ? FILTER_GROUPS.map(({ label, key, values }) => ({ label, key, values })) : MODULE_GROUPS}
      filtersProps={files ? undefined : { mutuallyExclusiveFilters: ['category', 'u_label'] }}
      searchKeys={['title', 'name', 'type']}
      toCard={card}
      flipped={flipped}
      backHover={backHover}
    />
  )
}
