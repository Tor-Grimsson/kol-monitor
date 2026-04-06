import { useParams, useNavigate } from 'react-router-dom'
import { patches } from '../patches'
import Divider from '../components/atoms/Divider'
import Button from '../components/atoms/Button'
import BlankPanel from '../modules/utility/BlankPanel'
import { TOTAL_HP } from '../modules/utility/eurorack'

export default function PatchDetailPage() {
  const { patchName } = useParams()
  const navigate = useNavigate()
  const patch = patches[patchName]

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
    <div style={{ padding: '48px 48px', paddingTop: 48, overflow: 'hidden', minHeight: '100vh' }} className="bg-surface-primary">
      <h1 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>{title}</h1>
      <p className="text-fg-48 kol-text-sm" style={{ marginBottom: 40 }}>View <span className="patch-link" onClick={() => navigate(rackUrl)}>[{title}]</span> in Rack</p>

      <Divider className="mb-6" />

      <div style={{ display: 'flex', gap: 48 }}>
        <div style={{ pointerEvents: 'none', width: 6 * 16 * 2, height: (6 * 16 * 2) * TOTAL_HP / (6 * 4), overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ width: 6 * 16, aspectRatio: `${6 * 4} / ${TOTAL_HP}`, overflow: 'hidden', transform: 'scale(2)', transformOrigin: 'top left' }}>
            <BlankPanel />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4 }}>
          <div>
            <h2 className="text-fg-64 kol-helper-s" style={{ marginBottom: 16 }}>Description</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(patch.description || 'No description yet.').split('. ').filter(Boolean).map((s, i) => (
                <div key={i} className="text-fg-48 kol-helper-xxs">
                  {s.endsWith('.') ? s : s + '.'}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-fg-64 kol-helper-s" style={{ marginBottom: 16 }}>Specifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="text-fg-48 kol-helper-xxs">Modules: {moduleCount}</div>
              <div className="text-fg-48 kol-helper-xxs">Connections: {connCount}</div>
              {patch.tags && <div className="text-fg-48 kol-helper-xxs">Tags: {patch.tags.join(', ')}</div>}
            </div>
          </div>
        </div>
      </div>

      <Divider className="my-6" />

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" size="sm" onClick={() => navigate('/library')}>
          Back
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate('/rack', { state: { preset: patchName } })}>
          Load in Rack
        </Button>
      </div>
    </div>
  )
}
