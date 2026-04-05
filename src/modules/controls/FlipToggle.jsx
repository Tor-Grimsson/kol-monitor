// FlipToggle — vertical two-state or three-state toggle switch
// Eurorack-style flip switch with up/down/center positions
// positions=2 (default): value is boolean
// positions=3: value is 0, 1, or 2 (top, center, bottom)

export default function FlipToggle({ value, onChange, labelA, labelB, labelC, variant = 'vertical', positions = 2 }) {
  const isHorizontal = variant === 'horizontal'

  const handleClick = () => {
    if (positions === 3) {
      onChange((value + 1) % 3)
    } else {
      onChange(!value)
    }
  }

  const trackW = isHorizontal ? (positions === 3 ? 24 : 16) : 8
  const trackH = isHorizontal ? 8 : (positions === 3 ? 24 : 16)
  const thumbW = isHorizontal ? 8 : 6
  const thumbH = isHorizontal ? 6 : 8

  let thumbPos
  if (positions === 3) {
    const offsets = isHorizontal ? [0, 8, 15] : [0, 8, 15]
    thumbPos = isHorizontal
      ? { top: 0, left: offsets[value], transition: 'left 0.1s' }
      : { left: 0, top: offsets[value], transition: 'top 0.1s' }
  } else {
    thumbPos = isHorizontal
      ? { top: 0, left: value ? 0 : 7, transition: 'left 0.1s' }
      : { left: 0, top: value ? 0 : 7, transition: 'top 0.1s' }
  }

  return (
    <div
      onClick={handleClick}
      style={{ display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', alignItems: 'center', gap: 2, cursor: 'pointer', userSelect: 'none' }}
    >
      {labelA && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
          {labelA}
        </span>
      )}
      <div style={{
        width: trackW,
        height: trackH,
        borderRadius: 4,
        backgroundColor: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.12)',
        position: 'relative',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: thumbW,
          height: thumbH,
          borderRadius: 3,
          backgroundColor: 'rgba(180,175,165,0.6)',
          position: 'absolute',
          ...thumbPos,
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }} />
      </div>
      {labelB && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
          {labelB}
        </span>
      )}
      {labelC && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
          {labelC}
        </span>
      )}
    </div>
  )
}
