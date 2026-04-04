// Module wrapper — front panel with header pinned at top
// Header (label + power dot) is managed here, children render below

import { MODULE_PADDING } from './eurorack'
import ModuleHeader from '../controls/ModuleHeader'

export default function Module({ children, className = 'bg-surface-secondary', label, enabled, onToggle, u = 3 }) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${MODULE_PADDING}px 0 ${u === 1 ? 8 : MODULE_PADDING}px`,
        userSelect: 'none',
      }}
    >
      {label && (
        <div style={{ flexShrink: 0, padding: `0 4px ${u === 1 ? 8 : 16}px` }}>
          <ModuleHeader label={label} enabled={enabled} onToggle={onToggle} />
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 4px', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
