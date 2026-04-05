// LabeledControl — wraps any control with a text label
// Matches Knob/Toggle label style: kol-helper-xxxs, 35% opacity, uppercase

export default function LabeledControl({ label, horizontal = false, children }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: horizontal ? 'row' : 'column', alignItems: 'center', gap: 4 }}>
      {children}
      {label && (
        <span className="kol-helper-xxxs" style={{
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {label}
        </span>
      )}
    </div>
  )
}
