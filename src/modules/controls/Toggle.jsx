// Toggle — red circle on/off button with label below
// momentary: fires onChange(true) on click, LED auto-clears after flash

import { useState, useRef } from 'react'

const SIZES = { sm: 8, md: 12 }

export default function Toggle({ value, onChange, label, horizontal = false, size = 'md', padding = 4, momentary = false, color = '#e74c3c' }) {
  const [lit, setLit] = useState(false)
  const timerRef = useRef(null)
  const s = SIZES[size]
  const isOn = momentary ? lit : value

  const handleClick = () => {
    if (momentary) {
      onChange(true)
      setLit(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setLit(false), 120)
    } else {
      onChange(!value)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`inline-flex ${horizontal ? 'flex-row' : 'flex-col'} items-center gap-1 select-none`}
      style={{ cursor: 'pointer', touchAction: 'none', padding }}
    >
      <div style={{
        width: s,
        height: s,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: isOn ? 1 : 0.3,
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
