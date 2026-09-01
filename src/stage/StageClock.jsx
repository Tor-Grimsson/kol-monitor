// StageClock — mirror's MASTER CLOCK module (`hall-of-mirrors/PlaybackModule`),
// ported at the user's ask, 2026-08-28.
//
// The panel language comes over whole: the LED well, the ganged key deck with
// its hairline seams and moulded caps, the two-position switches, the big TEMPO
// knob. What could not come over is mirror's `transport` singleton and its jack
// registry — monitor's clock is the case, not a timeline.
//
// So the transport keys drive the STAGE's own run state (the case's `toggleAll`,
// the same switch the rack's `m` throws) and the readout counts while it runs.
//
// ponytail: TEMPO · IN · OUT · SWING · EASE are panel state with no consumer —
// lamps, the way mirror's own jacks were until something read them. Wire them
// to a `clock` module's bpm the day a stage patch carries one.

import { useState } from 'react'
import RotaryDial from '@kolkrabbi/kol-component/atoms/RotaryDial'
import Icon from '../icons/Icon.jsx'

const MODES = [['reverse', 'REV', 'Reverse'], ['forward', 'FWD', 'Forward'], ['pingpong', 'P·P', 'Ping-pong']]

/* The clock readout — a red LED panel: dark inset well, glowing figures, and a
   ghost `88:88.888` behind so the unlit segments hold their cells. */
export function Clock({ t = 0 }) {
  const abs = Math.max(0, t)
  const mm = String(Math.floor(abs / 60)).padStart(2, '0')
  const ss = String(Math.floor(abs % 60)).padStart(2, '0')
  const ms = String(Math.floor((abs % 1) * 1000)).padStart(3, '0')
  const led = { gridArea: '1 / 1', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em', fontSize: 22, lineHeight: 1 }
  return (
    <div
      className="flex items-center justify-center bg-oq-12 border border-fg-08"
      style={{
        borderRadius: 'var(--kol-radius-xs)',
        padding: '6px 10px',
        boxShadow: 'inset 0 1px 3px rgb(0 0 0 / 0.5)',
      }}
    >
      <div style={{ display: 'inline-grid' }}>
        <span style={{ ...led, color: '#ff3b30', opacity: 0.1 }} aria-hidden>88:88.888</span>
        <span style={{ ...led, color: '#ff3b30', textShadow: '0 0 6px rgb(255 59 48 / 0.5)' }}>{`${mm}:${ss}.${ms}`}</span>
      </div>
    </div>
  )
}

/* One key of the deck. Keys are GANGED into a strip with hairline seams rather
   than floating as separate buttons, and the cap drops when the key goes down.
   `down` is the LATCH — PLAY/PAUSE and the mode keys hold; STOP is momentary. */
function Key({ down, onClick, title, height = 30, children }) {
  return (
    <div
      className={`flex flex-1 items-center justify-center cursor-pointer select-none ${down ? 'text-accent-primary bg-oq-12' : 'text-fg-64 hover:text-fg-96'}`}
      style={{
        height,
        /* ponytail: `surface-tertiary` stays inline — `.bg-surface-*` is an
           ink+ground PAIR, and this key drives its own ink above. */
        background: down ? undefined : 'var(--kol-surface-tertiary)',
        boxShadow: down
          ? 'inset 0 1px 2px rgb(0 0 0 / 0.45)'
          : 'inset 0 1px 0 rgb(255 255 255 / 0.06), 0 1px 0 rgb(0 0 0 / 0.4)',
        transform: down ? 'translateY(1px)' : 'none',
      }}
      onClick={onClick}
      title={title}
    >{children}</div>
  )
}

/* The recess the keys sit in — the SAME well the readout uses, so keys and LED
   read as one panel. The 1px gap is the seam: the well's colour showing
   through, which is what a seam physically is. */
function Gang({ width, children }) {
  return (
    <div
      className="flex bg-oq-24"
      style={{ width, gap: 1, padding: 1, borderRadius: 3, boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.5)', overflow: 'hidden' }}
    >{children}</div>
  )
}

/* A two-position panel switch — the well language again, with a moulded lever. */
function Switch({ on, onClick, label, title }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 3 }}>
      <span className="kol-helper-10 text-fg-32">{label}</span>
      <div
        onClick={onClick}
        title={title}
        className="cursor-pointer select-none bg-oq-24"
        style={{ width: 36, height: 18, padding: 2, borderRadius: 3, boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.5)' }}
      >
        {/* The lever carries no text, so `.bg-*`'s paired ink is inert here. */}
        <div
          className={on ? 'bg-accent-primary' : 'bg-surface-tertiary'}
          style={{
            width: 16, height: 14, borderRadius: 2,
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.10), 0 1px 0 rgb(0 0 0 / 0.4)',
            transform: on ? 'translateX(16px)' : 'none',
            transition: 'transform 120ms ease, background 120ms ease',
          }}
        />
      </div>
    </div>
  )
}

export default function StageClock({ running, onToggle, onReset, t = 0 }) {
  const [mode, setMode] = useState('forward')
  const [loop, setLoop] = useState(true)
  const [hold, setHold] = useState(false)
  const [knobs, setKnobs] = useState({ in: 0, out: 8, swing: 0, ease: 0, tempo: 100 })
  const set = (k) => (v) => setKnobs(p => ({ ...p, [k]: v }))

  return (
    <div className="flex flex-col shrink-0">
      <div className="flex items-center justify-between kol-helper-12 mx-2 px-3 border border-fg-08 border-b-0 shrink-0 bg-surface-tertiary" style={{ borderRadius: '4px 4px 0 0', height: 29 }}>
        <span className="text-fg-96">Master Clock</span>
        <span className="text-fg-96 cursor-pointer select-none" onClick={onReset}>Reset</span>
      </div>

      <div className="flex flex-col items-center gap-3 p-4 bg-surface-secondary border border-fg-08" style={{ borderRadius: 4, width: 300 }}>
        {/* the big ON lamp — lit exactly when the clock runs; click to start and stop */}
        <div
          className="w-6 h-6 rounded-full border-2 border-fg-48 flex items-center justify-center cursor-pointer select-none self-start"
          onClick={onToggle}
          title={running ? 'Stop the clock' : 'Run the clock'}
        >
          <div className={`w-3 h-3 rounded-full transition-all ${running ? 'bg-[#e74c3c]' : 'bg-fg-24'}`} />
        </div>

        {/* dense: the default variant pins its tick ring at 64px whatever `size`
            says, so four of them overflow the panel */}
        <div className="flex items-start" style={{ gap: 16 }}>
          <RotaryDial label="IN" value={knobs.in} min={0} max={60} defaultValue={0} onChange={set('in')} variant="dense" size={30} compact />
          <RotaryDial label="OUT" value={knobs.out} min={0} max={60} defaultValue={8} onChange={set('out')} variant="dense" size={30} compact />
          <RotaryDial label="SWING" value={knobs.swing} min={0} max={100} defaultValue={0} onChange={set('swing')} variant="dense" size={30} compact />
          <RotaryDial label="EASE" value={knobs.ease} min={0} max={100} defaultValue={0} onChange={set('ease')} variant="dense" size={30} compact />
        </div>

        <Clock t={t} />

        <div className="flex flex-col items-center" style={{ gap: 3 }}>
          <div className="flex kol-helper-10 text-fg-32" style={{ width: 232 }}>
            {['Stop', 'Pause', 'Play'].map(l => <span key={l} className="flex-1 text-center">{l}</span>)}
          </div>
          <Gang width={232}>
            <Key down={false} onClick={onReset} title="Stop — back to 0">
              <Icon name="control-stop" size={16} />
            </Key>
            <Key down={!running} onClick={() => running && onToggle()} title="Pause">
              <Icon name="control-pause" size={16} />
            </Key>
            <Key down={running} onClick={() => !running && onToggle()} title="Play">
              <Icon name="control-play" size={16} />
            </Key>
          </Gang>
          {/* no silkscreen over this gang — the caps carry their own legend */}
          <Gang width={190}>
            {MODES.map(([m, label, title]) => (
              <Key key={m} down={mode === m} onClick={() => setMode(m)} title={title} height={20}>
                <span className="kol-helper-10">{label}</span>
              </Key>
            ))}
          </Gang>
        </div>

        <div className="flex items-start" style={{ gap: 16 }}>
          <Switch label="LOOP" on={loop} onClick={() => setLoop(v => !v)} title="Wrap the clock inside IN…OUT" />
          <Switch label="HOLD" on={hold} onClick={() => setHold(v => !v)} title="Freeze the output while the clock keeps running underneath" />
        </div>

        {/* ONE BIG TEMPO KNOB at the bottom. `master` variant: the default pins
            its ring at 64px, so a 92px knob clips its own ticks into fragments. */}
        <RotaryDial label="TEMPO" value={knobs.tempo} min={10} max={400} defaultValue={100} onChange={set('tempo')} variant="master" size={92} />
      </div>
    </div>
  )
}
