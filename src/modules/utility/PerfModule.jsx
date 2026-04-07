// PerfModule — 4HP 1U, system resource monitor
// Direct DOM refs — no React re-renders, avoids layout cascade in zoomed rack

import { useEffect, useRef } from 'react'
import { useCasePower } from '../../hooks/useCasePower.jsx'
import Module from './Module'

export default function PerfModule({ id = 'perf1' }) {
  const { timingRef } = useCasePower()
  const msRef = useRef(null)
  const fpsRef = useRef(null)
  const modRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const t = timingRef.current
      const ms = t.evalMs ?? 0
      const pct = Math.round((ms / 16.67) * 100)
      const color = pct < 120 ? '#4ade80' : pct < 180 ? '#facc15' : '#ef4444'

      if (msRef.current) {
        msRef.current.textContent = `${ms.toFixed(1)}ms`
        msRef.current.style.color = color
      }
      if (fpsRef.current) fpsRef.current.textContent = `${t.fps ?? 0}fps`
      if (modRef.current) modRef.current.textContent = `${t.moduleCount ?? 0}mod`
      if (barRef.current) {
        barRef.current.style.height = `${Math.min(100, Math.round(pct / 3))}%`
        barRef.current.style.backgroundColor = color
      }
    }, 250)
    return () => clearInterval(interval)
  }, [timingRef])

  return (
    <Module label="Perf" enabled={true} u={1}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 8,
      }}>
        {/* Budget bar */}
        <div style={{
          width: 6, height: 48, borderRadius: 2,
          backgroundColor: '#1a1a1a', border: '1px solid #333',
          position: 'relative', overflow: 'hidden',
        }}>
          <div ref={barRef} style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '0%',
            backgroundColor: '#4ade80',
          }} />
        </div>

        {/* Stats readout */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 48 }}>
          <span ref={msRef} className="kol-helper-xxxs" style={{ color: '#4ade80', lineHeight: 1.2 }}>
            0.0ms
          </span>
          <span ref={fpsRef} className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>
            60fps
          </span>
          <span ref={modRef} className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>
            0mod
          </span>
        </div>
      </div>
    </Module>
  )
}
