import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'
import Logomark from './atoms/Logomark'

const NAV_ITEMS = [
  { icon: 'nav-library', path: '/library', label: 'Library' },
  { icon: 'nav-rack', path: '/rack', label: 'Rack' },
  { icon: 'nav-create', path: '/create', label: 'Create' },
]

const BOTTOM_ITEMS = [
  { icon: 'nav-settings', path: '/settings', label: 'Settings' },
]

export default function NavSidebar({ hidden = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isRack = location.pathname.startsWith('/rack')

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
      {NAV_ITEMS.map(({ icon, path, label }) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
        return (
          <div
            key={path}
            onClick={() => navigate(path)}
            title={label}
            style={{
              cursor: 'pointer',
              color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.48)',
              lineHeight: 0,
              padding: 8,
              borderRadius: 4,
            }}
            className="hover:bg-fg-04 transition-colors"
          >
            <Icon name={icon} size={20} />
          </div>
        )
      })}
      <div style={{ flex: 1 }} />
      {BOTTOM_ITEMS.map(({ icon, path, label }) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
        return (
          <div
            key={path}
            onClick={() => navigate(path)}
            title={label}
            style={{
              cursor: 'pointer',
              color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.48)',
              lineHeight: 0,
              padding: 8,
              borderRadius: 4,
              marginBottom: 8,
            }}
            className="hover:bg-fg-04 transition-colors"
          >
            <Icon name={icon} size={20} />
          </div>
        )
      })}
    </div>
  )
}
