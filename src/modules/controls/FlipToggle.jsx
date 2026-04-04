// FlipToggle — vertical two-state toggle switch
// Eurorack-style flip switch with up/down positions

export default function FlipToggle({ value, onChange, labelA, labelB, variant = 'vertical' }) {
  const isHorizontal = variant === 'horizontal'

  return (
    <div
      onClick={() => onChange(!value)}
      style={{ display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', alignItems: 'center', gap: 2, cursor: 'pointer', userSelect: 'none' }}
    >
      {labelA && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
          {labelA}
        </span>
      )}
      <div style={{
        width: isHorizontal ? 16 : 8,
        height: isHorizontal ? 8 : 16,
        borderRadius: 4,
        backgroundColor: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.12)',
        position: 'relative',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: isHorizontal ? 8 : 6,
          height: isHorizontal ? 6 : 8,
          borderRadius: 3,
          backgroundColor: 'rgba(180,175,165,0.6)',
          position: 'absolute',
          ...(isHorizontal
            ? { top: 0, left: value ? 0 : 7, transition: 'left 0.1s' }
            : { left: 0, top: value ? 0 : 7, transition: 'top 0.1s' }
          ),
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }} />
      </div>
      {labelB && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
          {labelB}
        </span>
      )}
    </div>
  )
}
