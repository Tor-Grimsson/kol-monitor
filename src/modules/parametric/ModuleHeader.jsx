// ModuleHeader — enable dot + module name, left-aligned
// Respects case power: when case is off, dot shows off

import { useCasePower } from '../../hooks/useCasePower.jsx'
import Toggle from './Toggle'

export default function ModuleHeader({ label, enabled, onToggle, editMode, onRemove, bypass, onBypass }) {
  const { power } = useCasePower()
  const isOn = power && enabled

  return (
    <div onClick={() => onToggle?.()} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '0 2px', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}>
      <Toggle value={isOn} size="sm" onChange={() => {}} padding={0} />
      <span className="kol-helper-xxs" style={{
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        flex: 1,
      }}>
        {label}
      </span>
      {editMode && onRemove ? (
        <div
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          title="Send module to workbench"
          style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: '#facc15',
            cursor: 'pointer', flexShrink: 0,
          }}
        />
      ) : onBypass ? (
        <div
          onClick={(e) => { e.stopPropagation(); onBypass() }}
          title={bypass ? 'Bypassed — click to re-engage' : 'Bypass'}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: 'var(--kol-cv-attenuate)',
            opacity: bypass ? 0.25 : 1,
            cursor: 'pointer', flexShrink: 0,
          }}
        />
      ) : null}
    </div>
  )
}
