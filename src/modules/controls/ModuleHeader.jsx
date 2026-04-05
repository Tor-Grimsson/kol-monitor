// ModuleHeader — enable dot + module name, left-aligned
// Respects case power: when case is off, dot shows off

import { useCasePower } from '../../hooks/useCasePower.jsx'
import Toggle from './Toggle'

export default function ModuleHeader({ label, enabled, onToggle }) {
  const { power } = useCasePower()
  const isOn = power && enabled

  return (
    <div onClick={() => onToggle?.()} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '0 2px', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}>
      <Toggle value={isOn} size="sm" onChange={() => {}} padding={0} />
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
