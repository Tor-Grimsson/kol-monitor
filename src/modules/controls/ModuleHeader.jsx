// ModuleHeader — enable dot + module name, left-aligned
// Respects case power: when case is off, dot shows off

import { useCasePower } from '../../hooks/useCasePower.jsx'

export default function ModuleHeader({ label, enabled, onToggle }) {
  const { power } = useCasePower()
  const isOn = power && enabled

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', padding: '0 2px' }}>
      <div
        onClick={onToggle}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isOn ? '#e74c3c' : 'rgba(180,175,165,0.25)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
      <span className="kol-helper-xxs" style={{
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </span>
    </div>
  )
}
