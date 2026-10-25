import { useParams, useNavigate } from 'react-router-dom'
import { StudioDetail } from '@kolkrabbi/kol-shell'
import { patches } from '../data/patches'
import { MODULE_DEFS } from '../modules/registry'

/**
 * PatchDetailPage — `/library/patch/:patchName`, one patch's page on kol-shell's `StudioDetail` (plan
 * home-library-detail-one-card 3.1 · 3.2, 2026-10-24). A patch card opens THIS page, never the rack (user: *"it goes
 * to the same PATCH detail slug, from where you can load if you want"*); Load into the rack is the first action.
 */
const titleOf = (name) => name.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase())

export default function PatchDetailPage() {
  const { patchName } = useParams()
  const navigate = useNavigate()
  const patch = patches[patchName]
  if (!patch) return <StudioDetail notFound={{ title: 'Patch not found', subtitle: patchName }} />

  const moduleCount = patch.rows?.reduce((sum, r) => sum + (r.modules?.length || 0), 0) || 0
  const connCount = patch.connections?.length || 0
  const rackUrl = `/rack/patch/${patchName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`
  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/library'))

  return (
    <StudioDetail
      back={{ onClick: goBack }}
      title={titleOf(patchName)}
      subtitle={`${moduleCount} modules, ${connCount} connections`}
      description={patch.description || ''}
      sections={[
        { label: 'Specifications', rows: [{ label: `Modules: ${moduleCount}` }, { label: `Connections: ${connCount}` }, ...(patch.tags ? [{ label: `Tags: ${patch.tags.join(', ')}` }] : [])] },
        /* the rack, row by row — a module per row with its width and category */
        { label: 'Modules', rows: (patch.rows ?? []).flatMap((row, ri) => [
          { label: `Row ${ri + 1} — ${row.height.toUpperCase()}` },
          ...(row.modules ?? []).map((m) => MODULE_DEFS[m.type]).filter(Boolean).map((def) => ({ kind: '', label: def.label, value: `${def.hp}HP — ${def.category}` })),
        ]) },
      ]}
      /* the patch's OUTPUT, never the rack (1.6) — /previews/patches holds the output capture once the generator is re-run */
      preview={{ src: `/previews/patches/${patchName}.png`, alt: titleOf(patchName) }}
      actions={[
        { label: 'Load', onClick: () => navigate(rackUrl) },
      ]}
    />
  )
}
