// IconButton — icon-only toggle button
// Use with LabeledControl for text labels
// `momentary` flashes the active style for ~200ms on click — for trigger-style actions

import { useState, useRef } from 'react'
import Icon from '../../icons/Icon.jsx'

const PULSE_MS = 100

export default function IconButton({ icon, active, onClick, title, momentary, disabled, iconSize = 10 }) {
  const [pulse, setPulse] = useState(false)
  const timeoutRef = useRef(null)
  const isActive = active || pulse

  const handleClick = (e) => {
    if (disabled) return
    if (momentary) {
      setPulse(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setPulse(false), PULSE_MS)
    }
    onClick?.(e)
  }

  return (
    <button
      title={title}
      onClick={handleClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: isActive ? '#e74c3c' : 'rgba(255,255,255,0.08)',
        backgroundColor: isActive ? 'rgba(231,76,60,0.15)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
        opacity: disabled ? 0.3 : 1,
        transition: pulse ? 'none' : `border-color ${PULSE_MS}ms, background-color ${PULSE_MS}ms, color ${PULSE_MS}ms, opacity ${PULSE_MS}ms`,
      }}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  )
}
