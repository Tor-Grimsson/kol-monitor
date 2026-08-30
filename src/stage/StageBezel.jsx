// StageBezel — the 1960s/70s broadcast CRT, ported from kol-mirror's
// `SymphonyViewport` (`Bezel` + `ControlStrip`, 2026-08-28) at the user's ask.
//
// What changed on the way over: mirror's strip wrote its master FX chain, which
// monitor has no equivalent of. Here the four knobs drive CSS filters on the
// GLASS — blur / brightness / saturate / contrast — so they do to the picture
// what the real unit's picture controls do to the tube, and the signal path
// never sees them. Same for MARKER · BLUE ONLY · MONO: display-only by design.
//
// The panel carries its own palette rather than theme tokens. It is a physical
// prop, not UI chrome — sampled off mirror's reference plates.

import { useState } from 'react'
import RotaryDial from '@kolkrabbi/kol-component/atoms/RotaryDial'

const PANEL = {
  metal: '#191919',
  metalLo: '#0f0f0f',
  lip: '#2a2a2a',
  mask: '#0d0d0f',
  screw: '#333333',
  slot: '#141414',
}

const BEZEL_T = 24
const BEZEL_S = 20
const BEZEL_B = 92

/* Each screw sits at a different angle, the way driven screws actually do. */
const SCREWS = [
  { top: 9, left: 9, rot: 24 },
  { top: 9, right: 9, rot: -58 },
  { bottom: 13, left: 9, rot: 71 },
  { bottom: 13, right: 9, rot: -12 },
]

function Screw({ top, right, bottom, left, rot }) {
  return (
    <span
      aria-hidden
      className="absolute rounded-full pointer-events-none"
      style={{
        top, right, bottom, left,
        width: 7, height: 7,
        background: `linear-gradient(145deg, ${PANEL.screw}, ${PANEL.slot})`,
        transform: `rotate(${rot}deg)`,
      }}
    >
      <span className="absolute" style={{ left: 1, right: 1, top: 3, height: 1, background: PANEL.slot }} />
    </span>
  )
}

/* A lozenge key. No legend — at this size silkscreen reads as dirt. */
function PanelKey({ on, onClick, title, w = 26 }) {
  return (
    <span
      onClick={onClick}
      title={title}
      className={onClick ? 'cursor-pointer select-none' : 'select-none'}
      style={{ width: w, height: 10, borderRadius: 1, background: on ? '#f2eee0' : '#cdc9bc', transform: on ? 'translateY(1px)' : 'none' }}
    />
  )
}

function Grille() {
  return (
    <span
      aria-hidden
      className="shrink-0"
      style={{
        width: 60, borderRadius: 2, background: '#0f0f11',
        backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.05) 0.5px, transparent 0.5px)',
        backgroundSize: '3px 3px',
      }}
    />
  )
}

/* The LED counter, ported from mirror's `PlaybackModule`. The OFF segments are
   the half that makes it read as one panel: a ghost `88:88.888` under the live
   figure, so unlit digits still occupy their cells. One grid cell, tabular, so
   nothing shifts as the digits roll. */
export function Clock({ t = 0 }) {
  const abs = Math.max(0, t)
  const mm = String(Math.floor(abs / 60)).padStart(2, '0')
  const ss = String(Math.floor(abs % 60)).padStart(2, '0')
  const ms = String(Math.floor((abs % 1) * 1000)).padStart(3, '0')
  const led = { gridArea: '1 / 1', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em', fontSize: 14, lineHeight: 1 }
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ background: '#0c0c0c', border: '1px solid #2b2b2b', borderRadius: 2, padding: '5px 8px', boxShadow: 'inset 0 1px 3px rgb(0 0 0 / 0.5)' }}
    >
      <div style={{ display: 'inline-grid' }}>
        <span style={{ ...led, color: '#ff3b30', opacity: 0.1 }} aria-hidden>88:88.888</span>
        <span style={{ ...led, color: '#ff3b30', textShadow: '0 0 6px rgb(255 59 48 / 0.5)' }}>{`${mm}:${ss}.${ms}`}</span>
      </div>
    </div>
  )
}

/* The picture knobs, in the reference's order — CSS filter units. */
const KNOBS = [
  ['blur', 0, 20, 0],
  ['brightness', 0, 300, 100],
  ['saturate', 0, 300, 100],
  ['contrast', 0, 300, 100],
]

function ControlStrip({ picture, setPicture, marker, setMarker, blue, setBlue, mono, setMono, tally, onPower }) {
  const LOWER = [
    { on: marker, onClick: () => setMarker(v => !v), title: 'Safe-area guides' },
    { on: blue, onClick: () => setBlue(v => !v), title: 'Blue channel only' },
    { on: mono, onClick: () => setMono(v => !v), title: 'Monochrome' },
    {}, {}, {}, {}, {}, {}, {},
  ]
  return (
    <div className="absolute flex items-stretch justify-center" style={{ left: BEZEL_S, right: BEZEL_S, bottom: 12, gap: 10 }}>
      <Grille />
      <div
        className="flex items-center shrink"
        style={{ flex: '1 1 auto', maxWidth: 780, minWidth: 0, gap: 12, padding: '8px 14px', borderRadius: 3, background: '#0c0c0c', border: '1px solid #2b2b2b' }}
      >
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 6 }}>
          <div className="flex items-center justify-center" style={{ gap: 8 }}>
            <PanelKey />
            <PanelKey />
            {KNOBS.map(([key, min, max, def]) => (
              <RotaryDial
                key={key}
                /* dense: the default variant pins its tick ring at 64px whatever
                   `size` says, which overflows the chin */
                variant="dense"
                panel
                size={26}
                compact
                min={min}
                max={max}
                defaultValue={def}
                value={picture[key]}
                onChange={v => setPicture(p => ({ ...p, [key]: v }))}
              />
            ))}
          </div>
          <div className="flex items-center justify-center" style={{ gap: 6 }}>
            {LOWER.map((k, i) => <PanelKey key={i} {...k} w={24} />)}
          </div>
        </div>
        {/* POWER — the tall cream cap, and it works: it runs the stage. The cap
            latches down while on, the way a deck's power key does, and the lamp
            above is the tally. */}
        <div className="flex flex-col items-center justify-center shrink-0" style={{ gap: 4 }}>
          <span aria-hidden className="rounded-full" style={{ width: 5, height: 5, background: tally ? '#7ec81e' : '#2b3a1a', boxShadow: tally ? '0 0 5px #7ec81e' : 'none' }} />
          <span
            onClick={onPower}
            title={tally ? 'Power off' : 'Power on'}
            className="cursor-pointer select-none"
            style={{
              width: 24, height: 26, borderRadius: 2,
              background: tally ? '#f2eee0' : '#cdc9bc',
              transform: tally ? 'translateY(1px)' : 'none',
              boxShadow: tally ? 'inset 0 1px 2px rgb(0 0 0 / 0.35)' : 'none',
            }}
          />
        </div>
      </div>
      <Grille />
    </div>
  )
}

export default function StageBezel({ tally, onPower, aspect = '16 / 9', style, children }) {
  /* MARKER / BLUE / MONO and the picture knobs live HERE, not in stage state:
     they change the tube, never the signal. */
  const [marker, setMarker] = useState(false)
  const [blue, setBlue] = useState(false)
  const [mono, setMono] = useState(false)
  const [picture, setPicture] = useState({ blur: 0, brightness: 100, saturate: 100, contrast: 100 })

  const tube = [
    picture.blur ? `blur(${picture.blur}px)` : '',
    `brightness(${picture.brightness}%)`,
    `saturate(${picture.saturate}%)`,
    `contrast(${picture.contrast}%)`,
    mono ? 'grayscale(1)' : '',
    blue ? 'grayscale(1) sepia(1) hue-rotate(180deg) saturate(6)' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className="relative shrink-0"
      style={{
        ...style,
        borderRadius: 8,
        padding: `${BEZEL_T}px ${BEZEL_S}px ${BEZEL_B}px`,
        /* cast metal: a fine vertical grain over a body that lightens at the top
           lip and falls off into the chin. Depth is colour, not shadow. */
        background: `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.015) 0 1px, transparent 1px 3px), linear-gradient(180deg, ${PANEL.lip} 0, ${PANEL.metal} 5%, ${PANEL.metal} 90%, ${PANEL.metalLo} 100%)`,
      }}
    >
      {SCREWS.map((sc, i) => <Screw key={i} {...sc} />)}
      {/* the mask band — the black surround between the moulding and the glass */}
      <div className="w-full" style={{ background: PANEL.mask, borderRadius: 6, padding: 3, aspectRatio: aspect }}>
        <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: 4 }}>
          <div className="absolute inset-0" style={{ filter: tube }}>{children}</div>
          {marker && (
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div className="absolute" style={{ inset: '5%', border: '1px solid rgb(255 255 255 / 0.35)' }} />
              <div className="absolute" style={{ inset: '10%', border: '1px dashed rgb(255 255 255 / 0.22)' }} />
            </div>
          )}
        </div>
      </div>
      <ControlStrip
        picture={picture} setPicture={setPicture}
        marker={marker} setMarker={setMarker}
        blue={blue} setBlue={setBlue}
        mono={mono} setMono={setMono}
        tally={tally} onPower={onPower}
      />
    </div>
  )
}
