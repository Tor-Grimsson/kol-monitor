// Slider — horizontal range slider for modules
// Same conventions as Knob: label prop, kol-helper-xxxs, inline styles, pointer drag

import { useRef, useCallback } from 'react'

export default function Slider({ value, onChange, min = 0, max = 100, step = 1, label, direction = 'horizontal', height }) {
  const trackRef = useRef(null)
  const vertical = direction === 'vertical'

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    const track = trackRef.current
    if (!track) return

    const update = (e) => {
      const rect = track.getBoundingClientRect()
      const ratio = vertical
        ? Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
        : Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const raw = min + ratio * (max - min)
      onChange(Math.round(raw / step) * step)
    }

    update(e)
    const onMove = (e) => update(e)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [min, max, step, onChange, vertical])

  const norm = max > min ? ((value ?? 0) - min) / (max - min) : 0

  if (vertical) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {label && (
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1 }}>
            {label}
          </span>
        )}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          style={{
            width: 2,
            height: height ?? 60,
            backgroundColor: 'rgba(255,255,255,0.15)',
            position: 'relative',
            cursor: 'ns-resize',
            touchAction: 'none',
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${norm * 100}%`,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: `calc(${norm * 100}% - 4px)`,
            left: -3,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.7)',
          }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      {label && (
        <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1, flexShrink: 0, minWidth: 20 }}>
          {label}
        </span>
      )}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        style={{
          flex: 1,
          height: 2,
          backgroundColor: 'rgba(255,255,255,0.15)',
          position: 'relative',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          left: `calc(${norm * 100}% - 4px)`,
          top: -3,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.7)',
        }} />
      </div>
      <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1, flexShrink: 0, minWidth: 16, textAlign: 'right' }}>
        {Math.round(value ?? 0)}
      </span>
    </div>
  )
}
