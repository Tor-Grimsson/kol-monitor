// Keyboard shortcuts overlay — toggle with 'S'

export default function ShortcutsOverlay({ onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 select-none bg-fg-inverse-08"
      style={{ display: 'grid', placeItems: 'center', backdropFilter: 'blur(2px)' }}
    >
      <div className="text-fg-64 kol-helper-xs bg-surface-primary border border-fg-16" style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '10px 62px', padding: 24, borderRadius: 4 }}>
        <span>Shortcuts</span><span className="text-fg-96">S</span>
        <span>Sidebar</span><span className="text-fg-96">H</span>
        <span>Edit mode</span><span className="text-fg-96">E</span>
        <span>Mute all</span><span className="text-fg-96">M</span>
        <span>Lock view</span><span className="text-fg-96">L</span>
        <span>Cable lock</span><span className="text-fg-96">C</span>
        <span>Cable visibility</span><span className="text-fg-96">O</span>
        <span>Zoom in / out</span><span className="text-fg-96">+ / −</span>
        <span>Reset zoom</span><span className="text-fg-96">0</span>
        <span>Clear display</span><span className="text-fg-96">D</span>
        <span>Snap positions</span><span className="text-fg-96">1–9</span>
        <span>Pan (drag)</span><span className="text-fg-96">Space</span>
        <span>Zoom</span><span className="text-fg-96">Alt+Scroll</span>
        <span>Pan</span><span className="text-fg-96">Scroll</span>
      </div>
    </div>
  )
}
