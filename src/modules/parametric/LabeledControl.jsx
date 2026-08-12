// LabeledControl — wraps any control with a text label
// Matches Knob/Toggle label style: kol-helper-8, 35% opacity, uppercase

export default function LabeledControl({ label, horizontal = false, labelPosition = 'bottom', labelClass = 'kol-helper-8', gap = 0, children }) {
  const isRow = horizontal || labelPosition === 'left' || labelPosition === 'right'
  const labelEl = label && (
    <span className={labelClass} style={{
      color: 'rgba(255,255,255,0.35)',
      textTransform: 'uppercase',
      lineHeight: 1,
    }}>
      {label}
    </span>
  )
  return (
    <div style={{ display: 'inline-flex', flexDirection: isRow ? 'row' : 'column', alignItems: 'center', gap }}>
      {(labelPosition === 'top' || labelPosition === 'left') && labelEl}
      {children}
      {(labelPosition === 'bottom' || labelPosition === 'right') && labelEl}
    </div>
  )
}
