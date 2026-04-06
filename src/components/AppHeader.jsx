import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'

const NAV_ITEMS = [
  { icon: 'shape-cube', path: '/', label: 'Home' },
  { icon: 'radial-star', path: '/library', label: 'Library' },
  { icon: 'filter-bp', path: '/settings', label: 'Settings' },
  { icon: 'line-grid', path: '/rack', label: 'Rack' },
]

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 32, zIndex: 70, display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }} className="bg-surface-tertiary border-b border-fg-08">
      {NAV_ITEMS.map(({ icon, path, label }) => (
        <div
          key={path}
          onClick={() => navigate(path)}
          title={label}
          style={{ cursor: 'pointer', color: location.pathname === path ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', lineHeight: 0 }}
        >
          <Icon name={icon} size={16} />
        </div>
      ))}
    </div>
  )
}
