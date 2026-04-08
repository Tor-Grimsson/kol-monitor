import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNavHidden } from './components/AppLayout'
import usePersistedState from './hooks/usePersistedState'
import { usePatchRouting } from './hooks/usePatchRouting.jsx'
import { useCasePower } from './hooks/useCasePower.jsx'
import { useRack } from './hooks/useRackContext.jsx'
import { useKeybindings } from './hooks/useKeybindings'
import { patches } from './patches'
import { ROW_WIDTH } from './modules/utility/eurorack'
import RackViewport from './RackViewport.jsx'
import ModuloSidebar from './ModuloSidebar.jsx'
import ShortcutsOverlay from './ShortcutsOverlay.jsx'
import Icon from './icons/Icon.jsx'

const BASE_WIDTH = ROW_WIDTH + 52

function VideoModuloInner() {
  const { presetName } = useParams()
  const navigate = useNavigate()
  const routing = usePatchRouting()
  const { toggleAll } = useCasePower()
  const rack = useRack()
  const nav = useNavHidden()
  const [zoom, setZoom] = usePersistedState('rack-zoom', 1)
  const [sidebarOpen, setSidebarOpenRaw] = useState(false)
  const sidebarOpenRef = useRef(false)
  const setSidebarOpen = useCallback((v) => {
    setSidebarOpenRaw(prev => {
      const val = typeof v === 'function' ? v(prev) : v
      sidebarOpenRef.current = val
      nav?.setNavHidden(val)
      return val
    })
  }, [nav])
  const [viewLocked, setViewLocked] = useState(false)
  const viewLockedRef = useRef(false)
  const [cableLocked, setCableLocked] = usePersistedState('rack-cableLocked', false)
  const [cableVisibility, setCableVisibility] = usePersistedState('rack-cableVis', 'trans')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [displayHidden, setDisplayHidden] = usePersistedState('rack-displayHidden', true)

  const rackRef2 = useRef(rack)
  rackRef2.current = rack
  const rackOuterRef = useRef(null)

  useKeybindings({ setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef: rackRef2, toggleAll, setCableLocked, setCableVisibility, setShowShortcuts, setDisplayHidden })

  // Reset nav visibility when leaving rack
  const navRef = useRef(nav)
  navRef.current = nav
  useEffect(() => () => navRef.current?.setNavHidden(false), [])

  // Load preset from URL param on mount, or init if bare /rack
  const presetLoadedRef = useRef(null)
  useEffect(() => {
    const key = presetName || '__init__'
    if (presetLoadedRef.current === key) return
    presetLoadedRef.current = key
    let p
    if (presetName === 'custom') {
      try { p = JSON.parse(sessionStorage.getItem('customPatch')) } catch {}
    } else if (presetName) {
      const key = presetName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      p = patches[key] || patches[presetName]
    } else {
      // Only load init if rack has no modules (fresh or after reset)
      const hasModules = rack.rows.some(r => r.modules.length > 0)
      if (hasModules) return
      p = patches.init
    }
    if (!p) return
    requestAnimationFrame(() => {
      rack.loadPreset(p)
      if (p.connections) routing.loadPatch(p.connections)
    })
  }, [presetName, rack, routing])

  return (
    <div className="bg-surface-primary flex relative" style={{ overflow: 'hidden', height: '100vh' }}>
      {sidebarOpen && (
        <div className="sidebar-width flex-shrink-0 border-r border-fg-08 overflow-y-auto" style={{
          backgroundColor: 'var(--kol-bg-surface-primary, #0a0a0a)',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 40,
        }}>
          <ModuloSidebar
            rack={rack}
            routing={usePatchRouting()}
            zoom={zoom}
            onZoomChange={setZoom}
            onZoomFit={() => {
              const el = rackOuterRef.current
              if (el) setZoom(Math.min(2, Math.max(0.5, el.clientWidth / BASE_WIDTH)))
            }}
            onHide={() => setSidebarOpen(false)}
            cableVisibility={cableVisibility}
            onCableVisibility={setCableVisibility}
            cableLocked={cableLocked}
            onCableLocked={setCableLocked}
          />
        </div>
      )}

      {!sidebarOpen && !displayHidden && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed z-50 kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
          style={{ left: 60, top: 16, background: 'none', border: 'none', padding: 0 }}
        >
          [Show]
        </button>
      )}

      {!sidebarOpen && !displayHidden && <div className="fixed z-50 select-none" style={{ bottom: 16, left: 60, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, transition: 'left 0.15s' }}>
        <div className="kol-helper-xs text-fg-48" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          [Cables
          <span onClick={() => setCableLocked(v => !v)} className="hover:text-fg-96 cursor-pointer" style={{ color: cableLocked ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <Icon name={cableLocked ? 'cable-lock' : 'cable-unlock'} size={14} />
          </span>
          <span onClick={() => setCableVisibility(v => v === 'on' ? 'off' : v === 'off' ? 'trans' : 'on')} className="hover:text-fg-96 cursor-pointer" style={{ color: cableVisibility === 'off' ? 'rgba(231,76,60,0.9)' : undefined, lineHeight: 0, height: '1em', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}>
            <Icon name={cableVisibility === 'on' ? 'cable-on' : cableVisibility === 'off' ? 'cable-off' : 'cable-trans'} size={14} />
          </span>]
        </div>
      </div>}

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

      {!displayHidden && <button
        onClick={() => setViewLocked(v => { viewLockedRef.current = !v; return !v })}
        className="fixed z-50 kol-helper-xs text-fg-48 hover:text-fg-96 cursor-pointer select-none"
        style={{ bottom: 16, right: 16, background: 'none', border: 'none', padding: 0, color: viewLocked ? 'rgba(231,76,60,0.9)' : undefined }}
      >
        [{viewLocked ? 'Locked' : 'Lock'}]
      </button>}

      <RackViewport style={{ minHeight: '100vh', marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0 }} onEditCase={() => navigate('/create?from=rack')} />
    </div>
  )
}

export default function VideoModulo() {
  return <VideoModuloInner />
}
