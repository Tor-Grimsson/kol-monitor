import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'

const NAV_ITEMS = [
  { icon: 'nav-home', path: '/', label: 'Home' },
  { icon: 'nav-rack', path: '/rack', label: 'Rack' },
  { icon: 'nav-library', path: '/library', label: 'Library' },
  { icon: 'nav-settings', path: '/settings', label: 'Settings' },
]

export default function NavRail() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 32, zIndex: 60,
      display: 'flex', alignItems: 'center',
      paddingLeft: 12, gap: 4,
    }} className="bg-surface-primary border-b border-fg-08">
      {NAV_ITEMS.map(({ icon, path, label }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            title={label}
            style={{
              background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer',
              color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
            }}
          >
            <Icon name={icon} size={14} />
          </button>
        )
      })}
    </nav>
  )
}
