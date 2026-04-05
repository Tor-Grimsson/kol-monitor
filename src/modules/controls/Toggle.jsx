// Toggle — red circle on/off button with label below

const SIZES = { sm: 8, md: 12 }

export default function Toggle({ value, onChange, label, horizontal = false, size = 'md', padding = 4 }) {
  const s = SIZES[size]
  return (
    <div
      onClick={() => onChange(!value)}
      className={`inline-flex ${horizontal ? 'flex-row' : 'flex-col'} items-center gap-1 select-none`}
      style={{ cursor: 'pointer', touchAction: 'none', padding }}
    >
      <div style={{
        width: s,
        height: s,
        borderRadius: '50%',
        backgroundColor: '#e74c3c',
        opacity: value ? 1 : 0.3,
        border: 'none',
      }} />
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
