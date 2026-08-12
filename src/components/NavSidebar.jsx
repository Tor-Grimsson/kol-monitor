import { useLocation, useNavigate } from 'react-router-dom'
import Logomark from './atoms/Logomark'
import Button from './atoms/Button'
// Deep import via the local patch (patches/@kolkrabbi__kol-framework.patch):
// the framework barrel drags the kol-component barrel into the bundle.
import ThemeToggle from '@kolkrabbi/kol-framework/src/ThemeToggle.jsx'

const NAV_ITEMS = [
  { icon: 'nav-library', path: '/library', label: 'Library' },
  { icon: 'nav-rack', path: '/rack', label: 'Rack' },
  { icon: 'nav-create', path: '/create', label: 'Create' },
]

const BOTTOM_ITEMS = [
  { icon: 'nav-settings', path: '/settings', label: 'Settings' },
]

// Rail item (user ruling 2026-08-12): DS Button, nav variant — oq-96 ink,
// the button's own hover wash, active route stays lit via `selected`.
function RailItem({ icon, path, label }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  return (
    <Button
      iconOnly={icon}
      iconSize={20}
      variant="nav"
      size="md"
      onClick={() => navigate(path)}
      title={label}
      style={{
        color: 'var(--kol-oq-96)',
        // active = the nav hover wash held on (same token), never the
        // inverted pressed tile; ink constant at oq-96 in every state
        backgroundColor: isActive ? 'var(--kol-oq-04)' : undefined,
      }}
    />
  )
}

export default function NavSidebar({ hidden = false }) {
  const navigate = useNavigate()

  if (hidden) return null

  return (
    <div
      className="bg-surface-tertiary border-r border-fg-04"
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 48, zIndex: 70,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 16, gap: 8,
      }}
    >
      <div
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer', marginBottom: 16, paddingTop: 4 }}
        title="Monitor"
      >
        <Logomark svgUrl="/svg/favicon-01.svg" size={20} />
      </div>
      {NAV_ITEMS.map((item) => <RailItem key={item.path} {...item} />)}
      <div style={{ flex: 1 }} />
      <ThemeToggle label={false} style={{ color: 'var(--kol-oq-96)' }} />
      {BOTTOM_ITEMS.map((item) => <RailItem key={item.path} {...item} />)}
      <div style={{ height: 8 }} />
    </div>
  )
}
