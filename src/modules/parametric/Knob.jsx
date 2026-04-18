// Knob — SVG rotary knob with drag-to-change

import { useRef, useCallback } from 'react'

const SIZES = { sm: 24, md: 32, lg: 40, xl: 64 }

export default function Knob({ value, onChange, min, max, label, variant = 'column', bipolar = false, labelMinWidth, size: sizeProp = 'sm', defaultValue }) {
  const size = SIZES[sizeProp] || SIZES.sm
  const effMin = min ?? (bipolar ? -100 : 0)
  const effMax = max ?? 100
  const effDefault = defaultValue ?? (bipolar ? 0 : 50)
  const angle = ((value - effMin) / (effMax - effMin)) * 270 - 135
  const r = size / 2
  const ir = r * 0.56

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    // Alt/Option + click resets to default instead of starting a drag
    if (e.altKey) {
      onChange(effDefault)
      return
    }
    const startY = e.clientY
    const startVal = value
    const range = effMax - effMin

    const handleMove = (e) => {
      const delta = (startY - e.clientY) * (range / 200)
      const next = Math.round(Math.max(effMin, Math.min(effMax, startVal + delta)))
      onChange(next)
    }
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }, [value, effMin, effMax, effDefault, onChange])

  const knobSvg = (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r * 0.75} fill="rgba(30,30,30,0.9)" stroke="rgba(180,175,165,0.3)" strokeWidth="1" />
      <line
        x1={r} y1={r}
        x2={r + ir * Math.cos((angle - 90) * Math.PI / 180)}
        y2={r + ir * Math.sin((angle - 90) * Math.PI / 180)}
        stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  )

  if (variant === 'row-left' || variant === 'row') {
    return (
      <div
        onPointerDown={handlePointerDown}
        style={{ cursor: 'ns-resize', touchAction: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {label && (
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
            {label}
          </span>
        )}
        {knobSvg}
      </div>
    )
  }

  if (variant === 'row-right') {
    return (
      <div
        onPointerDown={handlePointerDown}
        style={{ cursor: 'ns-resize', touchAction: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {knobSvg}
        {label && (
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1, minWidth: labelMinWidth }}>
            {label}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{ cursor: 'ns-resize', touchAction: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
    >
      {bipolar && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
          -/+
        </span>
      )}
      {knobSvg}
      {label && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
          {label}
        </span>
      )}
    </div>
  )
}
