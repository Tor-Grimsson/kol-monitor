import { memo } from 'react'
import { TOTAL_HP, HP_PX, ROW_WIDTH, ROW_HEIGHT, RAIL_HEIGHT, hpToPx } from './eurorack'

// HP with grid placement — offset is 0-based HP position
export function HP(hp, offset = 0) {
  return { gridColumn: `${offset + 1} / span ${hp}`, height: '100%', overflow: 'hidden' }
}

const SLOTS = Array.from({ length: TOTAL_HP }, (_, i) => i)

const FRAME_COLOR = 'var(--kol-ctl-hw-rail)'

const Rail = memo(function Rail() {
  return (
    <div style={{
      height: RAIL_HEIGHT,
      background: FRAME_COLOR,
      display: 'flex',
      alignItems: 'center',
      boxShadow: 'inset 0 1px 0 var(--kol-ctl-hw-cap-edge), inset 0 -1px 0 rgba(0,0,0,0.2)',
    }}>
      {SLOTS.map(i => (
        <div key={i} style={{
          width: HP_PX,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'var(--kol-ctl-hw-shade)',
            boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.6)',
          }} />
        </div>
      ))}
    </div>
  )
})

export const RackRow = memo(function RackRow({ height = '3u', children }) {
  return (
    <div className="relative" style={{ width: ROW_WIDTH, height: ROW_HEIGHT[height] || ROW_HEIGHT['3u'] }}>
      {/* Layer 0: case background */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--kol-ctl-hw-case)', zIndex: 0 }} />
      {/* Layer 1: rails — visible in empty HP space */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}><Rail /></div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1 }}><Rail /></div>
      {/* Layer 2: modules */}
      <div className="relative" style={{ width: '100%', height: '100%', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
})

export default memo(function Case({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', padding: '3px 0' }}>
      <div className="bg-oq-12" style={{ width: 24, flexShrink: 0, borderRadius: 4, margin: '-3px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 2px' }}>
        {children}
      </div>
      <div className="bg-oq-12" style={{ width: 24, flexShrink: 0, borderRadius: 4, margin: '-3px 0' }} />
    </div>
  )
})
