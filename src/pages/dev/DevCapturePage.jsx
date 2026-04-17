// DevCapturePage — Puppeteer render target for generating module/patch preview PNGs
// URL params: ?kind=module&type=clock or ?kind=patch&name=filmstrip

import { useSearchParams } from 'react-router-dom'
import ModulePreview from '../../components/ModulePreview'
import PatchPreview from '../../components/PatchPreview'
import { MODULE_DEFS } from '../../modules/registry'
import { patches } from '../../data/patches'

export default function DevCapturePage() {
  const [params] = useSearchParams()
  const kind = params.get('kind')
  const type = params.get('type')
  const name = params.get('name')

  // Expose registry data for Puppeteer to enumerate
  if (kind === 'list') {
    const moduleTypes = Object.keys(MODULE_DEFS)
    const patchNames = Object.keys(patches).filter(k => k !== 'ref' && k !== 'empty')
    return (
      <pre id="capture-list" style={{ color: '#fff' }}>
        {JSON.stringify({ moduleTypes, patchNames })}
      </pre>
    )
  }

  if (kind === 'module' && type && MODULE_DEFS[type]) {
    return (
      <div style={{ background: '#0a0a0a', padding: 0, display: 'inline-block' }}>
        <div id="capture-target">
          <ModulePreview moduleType={type} />
        </div>
      </div>
    )
  }

  if (kind === 'patch' && name && patches[name]) {
    const patch = patches[name]
    return (
      <div style={{ background: '#0a0a0a', padding: 0, display: 'inline-block' }}>
        <div id="capture-target">
          <PatchPreview patch={patch} scale={0.5} />
        </div>
      </div>
    )
  }

  return <div style={{ color: '#fff', padding: 48 }}>DevCapturePage — use ?kind=list, ?kind=module&type=clock, or ?kind=patch&name=filmstrip</div>
}
