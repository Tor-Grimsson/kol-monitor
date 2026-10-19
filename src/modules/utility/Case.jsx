import { createContext, memo, useContext } from 'react'
import { HP_PX, TOTAL_HP, ROW_HEIGHT, RAIL_HEIGHT, hpToPx } from './eurorack.js'
/* THE CASE AND ITS ROWS — monitor's own again (plan 14 8.4, 2026-10-17): back from kol-hardware, unchanged. */

/* the case's width in HP, handed to its rows */
const RackHpContext = createContext(TOTAL_HP)

const Rail = memo(function Rail({ hp }) {
  return (
    <div style={{
      height: RAIL_HEIGHT,
      background: 'var(--kol-ctl-hw-rail)',
      display: 'flex',
      alignItems: 'center',
      boxShadow: 'inset 0 1px 0 var(--kol-ctl-hw-cap-edge), inset 0 -1px 0 rgba(0,0,0,0.2)',
    }}>
      {Array.from({ length: hp }, (_, i) => (
        <div key={i} style={{ width: HP_PX, display: 'flex', justifyContent: 'center' }}>
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

/**
 * RackRow — One row of a rack. a 1U or 3U row: the case ground, a rail of mounting holes top and bottom, the
 * modules over them (kol-monitor's `Case.jsx` `RackRow`, lifted 2026-10-01 — user ruling: the rack
 * comes into the design system). A row is a definite pixel height — 3U 416, 1U 138.67 — and as
 * wide as its case's HP. Lay `RackSlot`s in it.
 *
 * @param {'1u'|'3u'} height   (default 3u)
 * @param {ReactNode} children the row's content — normally a flex row of `RackSlot`
 */
export const RackRow = memo(function RackRow({ height = '3u', children }) {
  const hp = useContext(RackHpContext)
  return (
    <div className="relative" style={{ width: hpToPx(hp), height: ROW_HEIGHT[height] || ROW_HEIGHT['3u'] }}>
      {/* Layer 0: case background */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--kol-ctl-hw-case)', zIndex: 0 }} />
      {/* Layer 1: rails — visible in empty HP space */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}><Rail hp={hp} /></div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1 }}><Rail hp={hp} /></div>
      {/* Layer 2: modules */}
      <div className="relative" style={{ width: '100%', height: '100%', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
})

/**
 * RackSlot — A module's place in a rack row. the box a module sits in: `hp` wide (16px each), the row's height. It
 * paints nothing — the module inside is the panel. Monitor's `ModuleSlot` minus its edit arrows
 * and registry, which stay in the consumer.
 *
 * @param {number}    hp       width in HP
 * @param {1|3}       u        the row it sits in (default 3)
 * @param {boolean}   overflow let the content run past the slot (edit-mode arrows on the edge)
 * @param {ReactNode} children the module — a `ModuleFrame`
 */
export function RackSlot({ hp = 8, u = 3, overflow = false, style, children, ...props }) {
  return (
    <div
      style={{ width: hpToPx(hp), height: ROW_HEIGHT[u === 1 ? '1u' : '3u'], flexShrink: 0, overflow: overflow ? 'visible' : 'hidden', position: 'relative', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * RackCase — The case a rack is built in. the eurorack case: two side cheeks and the rows stacked between them
 * (kol-monitor's `Case.jsx`, lifted 2026-10-01). A frame like `ModuleFrame` — slots and a shape.
 * What is in the rows, where each module sits, routing, power and the edit mode stay in the
 * consumer.
 *
 * @param {number}    hp       the case's width in HP (default 104); its rows read it
 * @param {ReactNode} children `RackRow`s
 */
export default memo(function RackCase({ hp = TOTAL_HP, children }) {
  return (
    <RackHpContext.Provider value={hp}>
      <div style={{ display: 'flex', flexDirection: 'row', padding: '3px 0' }}>
        <div className="bg-oq-12" style={{ width: 24, flexShrink: 0, borderRadius: 4, margin: '-3px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 2px' }}>
          {children}
        </div>
        <div className="bg-oq-12" style={{ width: 24, flexShrink: 0, borderRadius: 4, margin: '-3px 0' }} />
      </div>
    </RackHpContext.Provider>
  )
})
