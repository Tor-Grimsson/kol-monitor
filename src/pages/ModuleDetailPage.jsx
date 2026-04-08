import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MODULE_DEFS } from '../moduleRegistry'
import Divider from '../components/atoms/Divider'
import Button from '../components/atoms/Button'

const MODULE_SOURCES = import.meta.glob('../modules/**/*.jsx', { query: '?raw', import: 'default' })

const CONTROL_TYPE_LABELS = {
  knob: 'Knob',
  input: 'Input',
  output: 'Output',
  selector: 'Selector',
  toggle: 'Toggle',
  button: 'Button',
}

function ControlRow({ ctrl }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <span className="text-fg-32 kol-helper-xxs" style={{ width: 48, flexShrink: 0 }}>
        {CONTROL_TYPE_LABELS[ctrl.type] || ctrl.type}
      </span>
      <span className="text-fg-64 kol-helper-xxs" style={{ width: 56, flexShrink: 0 }}>{ctrl.name}</span>
      <span className="text-fg-48 kol-helper-xxs" style={{ flex: 1 }}>{ctrl.description}</span>
      {ctrl.range && <span className="text-fg-32 kol-helper-xxs" style={{ flexShrink: 0 }}>{ctrl.range}</span>}
      {ctrl.signal && <span className="text-fg-32 kol-helper-xxs" style={{ flexShrink: 0 }}>{ctrl.signal}</span>}
      {ctrl.options && <span className="text-fg-32 kol-helper-xxs" style={{ flexShrink: 0 }}>{ctrl.options}</span>}
    </div>
  )
}

export default function ModuleDetailPage() {
  const { moduleType } = useParams()
  const navigate = useNavigate()
  const mod = MODULE_DEFS[moduleType]
  const [fullView, setFullView] = useState(false)
  const [codeView, setCodeView] = useState(false)
  const [source, setSource] = useState(null)

  const sourceKey = useMemo(() => {
    if (!mod) return null
    return Object.keys(MODULE_SOURCES).find(k => k.toLowerCase().includes(moduleType.toLowerCase() + 'module'))
  }, [moduleType, mod])

  useEffect(() => {
    if (!sourceKey || source) return
    MODULE_SOURCES[sourceKey]().then(setSource)
  }, [sourceKey])

  const loadSource = () => setCodeView(true)

  const downloadSource = () => {
    if (!source || !sourceKey) return
    const filename = sourceKey.split('/').pop()
    const blob = new Blob([source], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

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
        {/* Info column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'auto', paddingTop: 4, paddingBottom: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Description</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(mod.description || 'No description yet.').split('. ').filter(Boolean).map((s, i) => (
                  <div key={i} className="text-fg-48 kol-helper-xxs">
                    {s.endsWith('.') ? s : s + '.'}
                  </div>
                ))}
              </div>
            </div>

            {mod.controls && (
              <div>
                <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Controls</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mod.controls.map((ctrl, i) => <ControlRow key={i} ctrl={ctrl} />)}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Specifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="text-fg-48 kol-helper-xxs" style={{ textTransform: 'capitalize' }}>Category: {mod.category}</div>
                <div className="text-fg-48 kol-helper-xxs">Width: {mod.hp}HP</div>
                <div className="text-fg-48 kol-helper-xxs">Height: {mod.u}U</div>
              </div>
            </div>

            {source && (
              <div>
                <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Code</h2>
                <pre className="text-fg-32" style={{
                  margin: 0, fontSize: 11, lineHeight: 1.5, fontFamily: 'monospace',
                  overflow: 'hidden',
                }}>{source.split('\n').slice(0, 5).join('\n')}</pre>
                <span
                  className="text-fg-48 kol-helper-xxs module-detail-code-link"
                  onClick={loadSource}
                  style={{ cursor: 'pointer', marginTop: 8, display: 'inline-block' }}
                >View full source</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Divider />
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" size="sm" onClick={() => navigate('/library', { state: { expandedModule: moduleType } })}>
                Back
              </Button>
              {sourceKey && (
                <Button variant="secondary" size="sm" onClick={loadSource}>
                  Code
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Image container */}
        <div
          className="bg-surface-tertiary"
          onClick={() => setFullView(true)}
          style={{ flex: '0 0 50%', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 24 }}
        >
          <img
            src={`/previews/modules/${moduleType}.png`}
            alt={mod.label}
            style={{ maxWidth: 'none', height: mod.u === 1 ? '33%' : '100%', width: 'auto' }}
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
            src={`/previews/modules/${moduleType}.png`}
            alt={mod.label}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Code overlay */}
      {codeView && source && (
        <div
          onClick={() => setCodeView(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span
              onClick={(e) => { e.stopPropagation(); downloadSource() }}
              className="text-fg-48 module-detail-code-link kol-helper-xs"
              style={{ cursor: 'pointer' }}
            >Download</span>
            <span
              onClick={(e) => { e.stopPropagation(); setCodeView(false) }}
              className="text-fg-48 module-detail-code-link kol-helper-xs"
              style={{ cursor: 'pointer' }}
            >Close</span>
          </div>
          <pre
            onClick={(e) => e.stopPropagation()}
            className="text-fg-64"
            style={{
              maxWidth: '85vw', maxHeight: '85vh', overflow: 'auto',
              padding: 32, margin: 0,
              fontSize: 12, lineHeight: 1.6, fontFamily: 'monospace',
              cursor: 'text', userSelect: 'text',
            }}
          >{source}</pre>
        </div>
      )}
    </div>
  )
}
