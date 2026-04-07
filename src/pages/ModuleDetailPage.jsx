import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MODULE_DEFS } from '../moduleRegistry'
import Divider from '../components/atoms/Divider'
import Button from '../components/atoms/Button'

export default function ModuleDetailPage() {
  const { moduleType } = useParams()
  const navigate = useNavigate()
  const mod = MODULE_DEFS[moduleType]
  const [fullView, setFullView] = useState(false)

  if (!mod) {
    return (
      <div style={{ padding: '48px 48px', paddingTop: 48, minHeight: '100vh' }} className="bg-surface-primary">
        <h1 className="text-fg-96 kol-heading-sm" style={{ marginTop: 24 }}>Module not found</h1>
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 48px', paddingTop: 48, overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      <h1 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>{mod.label}</h1>
      <p className="text-fg-48 kol-text-sm" style={{ marginBottom: 40, textTransform: 'capitalize' }}>{mod.hp}HP — {mod.u}U — {mod.category}</p>

      <Divider className="mb-6" />

      <div style={{ display: 'flex', gap: 48, flex: 1, minHeight: 0 }}>
        {/* Image container */}
        <div
          className="bg-surface-tertiary"
          onClick={() => setFullView(true)}
          style={{ flex: '0 0 50%', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 24 }}
        >
          <img
            src={`/previews/modules/${moduleType}.png`}
            alt={mod.label}
            style={{ maxWidth: 'none', height: '100%', width: 'auto' }}
          />
          <div className="patch-preview-overlay" style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}>
            <span className="kol-helper-xs text-fg-64">Click to expand</span>
          </div>
        </div>

        {/* Info column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4 }}>
          <div>
            <h2 className="text-fg-64 kol-helper-s" style={{ marginBottom: 16 }}>Description</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(mod.description || 'No description yet.').split('. ').filter(Boolean).map((s, i) => (
                <div key={i} className="text-fg-48 kol-helper-xxs">
                  {s.endsWith('.') ? s : s + '.'}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-fg-64 kol-helper-s" style={{ marginBottom: 16 }}>Specifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="text-fg-48 kol-helper-xxs" style={{ textTransform: 'capitalize' }}>Category: {mod.category}</div>
              <div className="text-fg-48 kol-helper-xxs">Width: {mod.hp}HP</div>
              <div className="text-fg-48 kol-helper-xxs">Height: {mod.u}U</div>
            </div>
          </div>
        </div>
      </div>

      <Divider className="my-6" />

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* Fullscreen image overlay */}
      {fullView && (
        <div
          onClick={() => setFullView(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span
            onClick={(e) => { e.stopPropagation(); setFullView(false) }}
            className="text-fg-48 hover:text-fg-96"
            style={{ position: 'absolute', top: 24, right: 24, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >&times;</span>
          <img
            src={`/previews/modules/${moduleType}.png`}
            alt={mod.label}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
