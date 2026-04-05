// PerfModule — 4HP 1U, system resource monitor
// Shows frame budget % (real frame time), frame ms, FPS, module count

import { useState, useEffect } from 'react'
import { useCasePower } from '../../hooks/useCasePower.jsx'
import Module from './Module'

export default function PerfModule({ id = 'perf1' }) {
  const { timingRef } = useCasePower()
  const [stats, setStats] = useState({ pct: 0, ms: 0, fps: 60, mod: 0 })

  useEffect(() => {
    let mounted = true
    // Sample at ~4hz to keep overhead low
    const interval = setInterval(() => {
      if (!mounted) return
      const t = timingRef.current
      const ms = t.frameMs ?? 0
      const pct = Math.round((ms / 16.67) * 100)
      setStats({ pct, ms, fps: t.fps ?? 0, mod: t.moduleCount ?? 0 })
    }, 250)
    return () => { mounted = false; clearInterval(interval) }
  }, [timingRef])

  const pctColor = stats.pct < 120 ? '#4ade80' : stats.pct < 180 ? '#facc15' : '#ef4444'

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
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${Math.min(100, Math.round(stats.pct / 3))}%`,
            backgroundColor: pctColor,
            transition: 'height 0.3s, background-color 0.3s',
          }} />
        </div>

        {/* Stats readout */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 48 }}>
          <span className="kol-helper-xxxs" style={{ color: pctColor, lineHeight: 1.2 }}>
            {stats.ms.toFixed(1)}ms
          </span>
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>
            {stats.fps}fps
          </span>
          <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>
            {stats.mod}mod
          </span>
        </div>
      </div>
    </Module>
  )
}
