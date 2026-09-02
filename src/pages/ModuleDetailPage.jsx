import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useNarrow } from '../hooks/useNarrow.js'
import { MODULE_DEFS } from '../modules/registry'
import Divider from '../components/atoms/Divider'
import Button from '../components/atoms/Button'
import { PageShell, PageHeader } from '@kolkrabbi/kol-shell'

const MODULE_SOURCES = import.meta.glob('../modules/**/*.jsx', { query: '?raw', import: 'default' })

const CONTROL_TYPE_LABELS = {
  knob: 'Knob',
  input: 'Input',
  output: 'Output',
  selector: 'Selector',
  toggle: 'Toggle',
  button: 'Button',
}

/* prose is mono (line-height-bearing), never helper; below 768 the description
   takes its own line so the row never clips sideways (user, 2026-09-02) */
function ControlRow({ ctrl, narrow }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: narrow ? 'wrap' : 'nowrap' }}>
      <span className="text-fg-32 kol-mono-12" style={{ width: 56, flexShrink: 0 }}>
        {CONTROL_TYPE_LABELS[ctrl.type] || ctrl.type}
      </span>
      <span className="text-fg-64 kol-mono-12" style={{ width: 72, flexShrink: 0 }}>{ctrl.name}</span>
      <span className="text-fg-48 kol-mono-12" style={{ flex: narrow ? '1 1 100%' : 1 }}>{ctrl.description}</span>
      {ctrl.range && <span className="text-fg-32 kol-mono-12" style={{ flexShrink: 0 }}>{ctrl.range}</span>}
      {ctrl.signal && <span className="text-fg-32 kol-mono-12" style={{ flexShrink: 0 }}>{ctrl.signal}</span>}
      {ctrl.options && <span className="text-fg-32 kol-mono-12" style={{ flexShrink: 0 }}>{ctrl.options}</span>}
    </div>
  )
}

export default function ModuleDetailPage() {
  const { moduleType } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const narrow = useNarrow()
  /* Back is history back — Create, Library, wherever this was opened from; a
     direct load with no history falls back to the library (user, 2026-09-02) */
  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/library', { state: { expandedModule: moduleType } }))
  const backLink = (
    <span onClick={goBack} className="kol-helper-12 text-fg-48 hover:text-fg-96 cursor-pointer select-none">‹ Back</span>
  )
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
      <PageShell>
        {/* the subtitle is not decoration: without one the masthead is 35.2 tall
            against every other page's 65.2, and the requested id is the one fact
            the reader is missing */}
        <PageHeader size="sm" voice="mono" title="Module not found" subtitle={moduleType} />
      </PageShell>
    )
  }

  return (
    <PageShell mode={narrow ? 'scroll' : 'fixed'}>
      <PageHeader size="sm" voice="mono" eyebrow={backLink} title={mod.label} subtitle={`${mod.hp}HP — ${mod.u}U — ${mod.category.charAt(0).toUpperCase() + mod.category.slice(1)}`} />

      <Divider className="mb-6" />

      <div style={{ display: 'flex', flexDirection: narrow ? 'column' : 'row', gap: narrow ? 24 : 48, flex: 1, minHeight: 0 }}>
        {/* Info column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: narrow ? 'visible' : 'auto', paddingTop: 4, paddingBottom: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h2 className="text-fg-80 kol-helper-14" style={{ marginBottom: 16 }}>Description</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(mod.description || 'No description yet.').split('. ').filter(Boolean).map((s, i) => (
                  <div key={i} className="text-fg-48 kol-mono-12">
                    {s.endsWith('.') ? s : s + '.'}
                  </div>
                ))}
              </div>
            </div>

            {mod.controls && (
              <div>
                <h2 className="text-fg-80 kol-helper-14" style={{ marginBottom: 16 }}>Controls</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mod.controls.map((ctrl, i) => <ControlRow key={i} ctrl={ctrl} narrow={narrow} />)}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-fg-80 kol-helper-14" style={{ marginBottom: 16 }}>Specifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="text-fg-48 kol-mono-12" style={{ textTransform: 'capitalize' }}>Category: {mod.category}</div>
                <div className="text-fg-48 kol-mono-12">Width: {mod.hp}HP</div>
                <div className="text-fg-48 kol-mono-12">Height: {mod.u}U</div>
              </div>
            </div>

            {source && (
              <div>
                <h2 className="text-fg-80 kol-helper-14" style={{ marginBottom: 16 }}>Code</h2>
                <pre className="text-fg-32" style={{
                  margin: 0, fontSize: 11, lineHeight: 1.5, fontFamily: 'monospace',
                  overflow: 'hidden',
                }}>{source.split('\n').slice(0, 5).join('\n')}</pre>
                <span
                  className="text-fg-48 kol-helper-10 module-detail-code-link"
                  onClick={loadSource}
                  style={{ cursor: 'pointer', marginTop: 8, display: 'inline-block' }}
                >View full source</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Divider />
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="grey" size="md" onClick={goBack}>
                Back
              </Button>
              <Button variant="grey" size="md" onClick={() => navigate(`/create?insert=${moduleType}`)}>
                Insert
              </Button>
              {sourceKey && (
                <Button variant="grey" size="md" onClick={loadSource}>
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
          style={{ flex: narrow ? '0 0 auto' : '0 0 50%', order: narrow ? -1 : 0, height: narrow ? 160 : undefined, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid var(--kol-fg-08)', borderRadius: 4, padding: narrow ? 12 : 24 }}
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
            <span className="kol-helper-12 text-fg-64">Click to expand</span>
          </div>
          {narrow && <span className="kol-helper-10 text-fg-32" style={{ position: 'absolute', right: 12, bottom: 8 }}>Tap to expand</span>}
        </div>
      </div>

      {/* Fullscreen image overlay */}
      {fullView && (
        <div
          onClick={() => setFullView(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 'var(--kol-z-modal)',
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span
            onClick={(e) => { e.stopPropagation(); setFullView(false) }}
            className="text-fg-48 module-detail-code-link kol-helper-12"
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
            position: 'fixed', inset: 0, zIndex: 'var(--kol-z-modal)',
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span
              onClick={(e) => { e.stopPropagation(); downloadSource() }}
              className="text-fg-48 module-detail-code-link kol-helper-12"
              style={{ cursor: 'pointer' }}
            >Download</span>
            <span
              onClick={(e) => { e.stopPropagation(); setCodeView(false) }}
              className="text-fg-48 module-detail-code-link kol-helper-12"
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
    </PageShell>
  )
}
