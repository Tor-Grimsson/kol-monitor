// Toggle — red circle on/off button with label below
// momentary: fires onChange(true) on click, LED auto-clears after flash
// onLongPress: when provided, hold ≥500ms fires onLongPress instead of onChange
// blink: animates LED opacity as a periodic pulse (visual indicator)

import { useState, useRef, useEffect } from 'react'

const SIZES = { sm: 8, md: 12 }
const LONG_PRESS_MS = 500
const BLINK_MS_DEFAULT = 500

export default function Toggle({ value, onChange, label, horizontal = false, size = 'md', padding = 4, momentary = false, color = '#e74c3c', onLongPress, blink = false, blinkPeriodMs = BLINK_MS_DEFAULT, forceLit = false }) {
  const [lit, setLit] = useState(false)
  const [blinkOn, setBlinkOn] = useState(true)
  const timerRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const longPressFiredRef = useRef(false)
  const s = SIZES[size]
  const isOn = momentary ? lit : value

  useEffect(() => {
    if (!blink) return
    const halfPeriod = Math.max(20, blinkPeriodMs / 2)
    const id = setInterval(() => setBlinkOn(b => !b), halfPeriod)
    return () => clearInterval(id)
  }, [blink, blinkPeriodMs])

  const fireClick = () => {
    if (momentary) {
      onChange(true)
      setLit(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setLit(false), 120)
    } else {
      onChange(!value)
    }
  }

  const handlePointerDown = () => {
    if (!onLongPress) return
    longPressFiredRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }

  const handlePointerUp = () => {
    if (!onLongPress) return
    clearTimeout(longPressTimerRef.current)
  }

  const handleClick = () => {
    if (onLongPress && longPressFiredRef.current) return
    fireClick()
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      className={`inline-flex ${horizontal ? 'flex-row' : 'flex-col'} items-center gap-1 select-none`}
      style={{ cursor: 'pointer', touchAction: 'none', padding }}
    >
      <div style={{
        width: s,
        height: s,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: blink ? (blinkOn ? 1 : 0.3) : (isOn || forceLit ? 1 : 0.3),
        border: 'none',
        transition: 'opacity 0.1s, background-color 0.15s',
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
