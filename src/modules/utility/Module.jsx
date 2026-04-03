// Module wrapper — front panel with header pinned at top
// Header (label + power dot) is managed here, children render below

import { MODULE_PADDING } from './eurorack'
import ModuleHeader from '../controls/ModuleHeader'

export default function Module({ children, className = 'bg-surface-secondary', label, enabled, onToggle }) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${MODULE_PADDING}px 0`,
        userSelect: 'none',
      }}
    >
      {label && (
        <div style={{ flexShrink: 0, padding: '0 4px' }}>
          <ModuleHeader label={label} enabled={enabled} onToggle={onToggle} />
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 4px', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
