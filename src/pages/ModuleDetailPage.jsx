import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StudioDetail } from '@kolkrabbi/kol-shell'
import { MODULE_DEFS } from '../modules/registry'

/**
 * ModuleDetailPage — `/library/module/:moduleType`, one module's page on kol-shell's `StudioDetail` (plan
 * home-library-detail-one-card 3.1, 2026-10-24). This page (2026-09-02) was the SOURCE the scaffold was read off,
 * and it kept its own Back, heading classes and button row; now it hands DATA and the Studio draws the page. What
 * stays Monitor's: the module's definition, its source glob, Insert into Create. The old page is in
 * `_tmp/2026-10-24-detail-on-studiodetail/`.
 */
const MODULE_SOURCES = import.meta.glob('../modules/**/*.jsx', { query: '?raw', import: 'default' })

const CONTROL_TYPE_LABELS = { knob: 'Knob', input: 'Input', output: 'Output', selector: 'Selector', toggle: 'Toggle', button: 'Button' }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export default function ModuleDetailPage() {
  const { moduleType } = useParams()
  const navigate = useNavigate()
  const mod = MODULE_DEFS[moduleType]
  const [source, setSource] = useState(null)
  const sourceKey = useMemo(() => (mod ? Object.keys(MODULE_SOURCES).find((k) => k.toLowerCase().includes(`${moduleType.toLowerCase()}module`)) : null), [moduleType, mod])
  useEffect(() => { if (sourceKey && !source) MODULE_SOURCES[sourceKey]().then(setSource) }, [sourceKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mod) return <StudioDetail notFound={{ title: 'Module not found', subtitle: moduleType }} />

  /* Back is history back — Create, Library, wherever this was opened from; a direct load with no history falls back to
     the library (user, 2026-09-02) */
  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/library'))

  return (
    <StudioDetail
      back={{ onClick: goBack }}
      title={mod.label}
      subtitle={`${mod.hp}HP — ${mod.u}U — ${cap(mod.category)}`}
      description={mod.description || 'No description yet.'}
      sections={[
        ...(mod.controls ? [{ label: 'Controls', rows: mod.controls.map((c) => ({ kind: CONTROL_TYPE_LABELS[c.type] || c.type, label: c.name, value: c.description, hint: c.range ?? c.signal ?? c.options })) }] : []),
        { label: 'Specifications', rows: [{ label: `Category: ${cap(mod.category)}` }, { label: `Width: ${mod.hp}HP` }, { label: `Height: ${mod.u}U` }] },
      ]}
      code={source ? { source, filename: sourceKey.split('/').pop() } : undefined}
      preview={{ src: `/previews/modules/${moduleType}.png`, alt: mod.label, contain: true }}
      actions={[
        { label: 'Insert', onClick: () => navigate(`/create?insert=${moduleType}`) },
      ]}
    />
  )
}
