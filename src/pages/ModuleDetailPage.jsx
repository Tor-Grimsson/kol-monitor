import { useParams, useNavigate } from 'react-router-dom'
import { MODULE_DEFS } from '../moduleRegistry'
import ModulePreview from '../components/ModulePreview'
import Button from '../components/atoms/Button'

export default function ModuleDetailPage() {
  const { moduleType } = useParams()
  const navigate = useNavigate()
  const mod = MODULE_DEFS[moduleType]

  if (!mod) {
    return (
      <div style={{ padding: '48px 48px', paddingTop: 48, minHeight: '100vh' }} className="bg-surface-primary">
        <h1 className="text-fg-96 kol-heading-sm" style={{ marginTop: 24 }}>Module not found</h1>
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 48px', paddingTop: 48, overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      {/* Grid: card + info in same row as library grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
        {/* Card — same as library grid card */}
        <div
          className="bg-fg-04"
          style={{ borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)', aspectRatio: '1 / 1.41421', overflow: 'hidden', display: 'flex', flexDirection: 'column', gridColumn: 'span 1' }}
        >
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <ModulePreview moduleType={moduleType} />
          </div>
          <div className="bg-surface-primary" style={{ padding: '12px 16px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-fg-96 kol-helper-s" style={{ marginBottom: 4 }}>{mod.label}</div>
            <div className="text-fg-32 kol-helper-xxxs">{mod.hp}HP {mod.u}U — {mod.category}</div>
          </div>
        </div>

        {/* Info — spans remaining columns */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4 }}>
          <div>
            <h1 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>{mod.label}</h1>
            <p className="text-fg-48 kol-text-sm" style={{ marginBottom: 24 }}>{mod.hp}HP — {mod.u}U — {mod.category}</p>

            <h2 className="text-fg-64 kol-helper-s" style={{ marginBottom: 12 }}>Description</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(mod.description || 'No description yet.').split('. ').filter(Boolean).map((s, i) => (
                <div key={i} className="text-fg-48 kol-helper-xxs">
                  {s.endsWith('.') ? s : s + '.'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-fg-64 kol-helper-s" style={{ marginBottom: 12 }}>Specifications</h2>
            <div style={{ display: 'flex', gap: 24 }}>
              <div className="text-fg-48 kol-helper-xxs" style={{ textTransform: 'capitalize' }}>Category: {mod.category}</div>
              <div className="text-fg-48 kol-helper-xxs">Width: {mod.hp}HP</div>
              <div className="text-fg-48 kol-helper-xxs">Height: {mod.u}U</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <Button variant="secondary" size="sm" onClick={() => navigate('/library')} style={{ marginTop: 48, alignSelf: 'flex-start' }}>
        Back
      </Button>
    </div>
  )
}
