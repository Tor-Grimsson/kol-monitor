import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patches } from '../patches'
import { MODULE_DEFS } from '../moduleRegistry'
import Divider from '../components/atoms/Divider'
import Button from '../components/atoms/Button'

export default function PatchDetailPage() {
  const { patchName } = useParams()
  const navigate = useNavigate()
  const patch = patches[patchName]
  const [fullView, setFullView] = useState(false)

  if (!patch) {
    return (
      <div style={{ padding: '48px 48px', paddingTop: 48, minHeight: '100vh' }} className="bg-surface-primary">
        <h1 className="text-fg-96 kol-heading-sm" style={{ marginTop: 24 }}>Patch not found</h1>
      </div>
    )
  }

  const moduleCount = patch.rows?.reduce((sum, r) => sum + (r.modules?.length || 0), 0) || 0
  const connCount = patch.connections?.length || 0
  const title = patchName.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim()
    .replace(/\b\w/g, c => c.toUpperCase())
  const rackUrl = `/rack/patch/${patchName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`

  return (
    <div style={{ padding: '48px 48px', paddingTop: 48, overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      <h1 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>{title}</h1>
      <p className="text-fg-48 kol-text-sm" style={{ marginBottom: 40 }}>{moduleCount} modules, {connCount} connections</p>

      <Divider className="mb-6" />

      <div style={{ display: 'flex', gap: 48, flex: 1, minHeight: 0 }}>
        {/* Info column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'auto', paddingTop: 4, paddingBottom: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Description</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(patch.description || '').split('. ').filter(Boolean).map((s, i) => (
                  <div key={i} className="text-fg-48 kol-helper-xxs">
                    {s.endsWith('.') ? s : s + '.'}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Specifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="text-fg-48 kol-helper-xxs">Modules: {moduleCount}</div>
                <div className="text-fg-48 kol-helper-xxs">Connections: {connCount}</div>
                {patch.tags && <div className="text-fg-48 kol-helper-xxs">Tags: {patch.tags.join(', ')}</div>}
              </div>
            </div>

            <div>
              <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Modules</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {patch.rows?.map((row, ri) => (
                  <div key={ri}>
                    <div className="text-fg-32 kol-helper-xxs" style={{ marginBottom: 8 }}>Row {ri + 1} — {row.height.toUpperCase()}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
                      {row.modules?.map((m, mi) => {
                        const def = MODULE_DEFS[m.type]
                        if (!def) return null
                        return (
                          <div key={mi} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                            <span className="text-fg-64 kol-helper-xxs" style={{ width: 72, flexShrink: 0 }}>{def.label}</span>
                            <span className="text-fg-32 kol-helper-xxs">{def.hp}HP — {def.category}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Divider />
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" size="sm" onClick={() => navigate('/library', { state: { expandedPatch: patchName } })}>
                Back
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate(rackUrl)}>
                Open in Rack
              </Button>
            </div>
          </div>
        </div>

        {/* Image container */}
        <div
          onClick={() => setFullView(true)}
          className="bg-surface-tertiary"
          style={{ flex: '0 0 50%', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}
        >
          <img
            src={`/previews/patches/${patchName}.png`}
            alt={title}
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
            className="text-fg-48 module-detail-code-link kol-helper-xs"
            style={{ position: 'absolute', top: 24, right: 24, cursor: 'pointer' }}
          >Close</span>
          <img
            src={`/previews/patches/${patchName}.png`}
            alt={title}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
