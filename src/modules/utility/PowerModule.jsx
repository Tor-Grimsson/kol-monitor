// PowerModule — 6HP 1U, master on/off rocker switch for the case
// Controls case power context — when off, all modules are disabled.

import { useCasePower } from '../../hooks/useCasePower.jsx'
import Module from './Module'
import Toggle from '../parametric/Toggle'

export default function PowerModule({ id = 'power1' }) {
  const { power: on, setPower, allEnabled, toggleAll } = useCasePower()
  const toggle = () => setPower(!on)

  return (
    <Module label="Power" enabled={on} onToggle={toggle} u={1}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12,
      }}>

        {/* Mute all toggle */}
        <Toggle value={allEnabled} onChange={toggleAll} label="MUTE" size="sm" horizontal />

        {/* Rocker switch housing */}
        <div
          onClick={toggle}
          style={{
            width: 28,
            height: 38,
            borderRadius: 3,
            backgroundColor: 'var(--kol-ctl-hw-cap)',
            border: '2px solid var(--kol-ctl-hw-cap-edge)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 4px rgba(0,0,0,0.6)',
          }}
        >
          {/* Rocker paddle */}
          <div style={{
            position: 'absolute',
            left: 2,
            right: 2,
            height: '50%',
            top: on ? 0 : '50%',
            borderRadius: 2,
            backgroundColor: on ? 'var(--kol-ctl-led-red)' : 'var(--kol-ctl-hw-cap-edge)',
            boxShadow: on
              ? '0 0 8px color-mix(in srgb, var(--kol-ctl-led-red) 50%, transparent), inset 0 1px 0 var(--kol-ctl-hw-cap-edge)'
              : 'inset 0 1px 0 var(--kol-ctl-hw-cap-edge)',
            transition: 'top 0.1s, background-color 0.15s, box-shadow 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span className="kol-helper-8" style={{
              color: on ? 'var(--kol-color-ab-white)' : 'var(--kol-ctl-hw-on-cap)',
              lineHeight: 1,
            }}>
              {on ? 'I' : 'O'}
            </span>
          </div>

          {/* Static labels on housing */}
          <span className="kol-helper-xxxxs" style={{
            position: 'absolute', top: 3, left: 0, right: 0,
            textAlign: 'center',
            color: on ? 'transparent' : 'var(--kol-ctl-hw-cap-edge)',
            pointerEvents: 'none',
          }}>I</span>
          <span className="kol-helper-xxxxs" style={{
            position: 'absolute', bottom: 3, left: 0, right: 0,
            textAlign: 'center',
            color: on ? 'var(--kol-ctl-hw-cap-edge)' : 'transparent',
            pointerEvents: 'none',
          }}>O</span>
        </div>
      </div>
    </Module>
  )
}
