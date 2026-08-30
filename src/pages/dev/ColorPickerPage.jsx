// ColorPickerPage — review surface for the ColorPicker atom before porting to kol-ds-ui.
// Access at /dev/color-picker

import { useState } from 'react'
import ColorPicker from '../../components/atoms/ColorPicker'

function Row({ label, note, value, onChange, defaultValue }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--kol-border-default)' }}>
      <div style={{ width: 160, flexShrink: 0 }}>
        <div className="kol-helper-12">{label}</div>
        {note && <div className="kol-helper-10" style={{ opacity: 0.5 }}>{note}</div>}
      </div>
      <ColorPicker color={value} onChange={onChange} defaultValue={defaultValue} />
      <div className="kol-helper-12" style={{ fontFamily: 'var(--kol-font-family-mono)', opacity: 0.7 }}>
        {value === undefined ? 'undefined' : String(value)}
      </div>
    </div>
  )
}

function Board({ theme }) {
  const [solid, setSolid] = useState('#66A44C')
  const [alpha, setAlpha] = useState('#497DA280')
  const [none, setNone] = useState('transparent')
  const [inherit, setInherit] = useState('currentColor')
  const [resettable, setResettable] = useState('#E74C3C')

  return (
    <div
      data-theme={theme}
      style={{
        flex: 1,
        minWidth: 380,
        padding: 24,
        backgroundColor: 'var(--kol-surface-primary)',
        color: 'var(--kol-surface-on-primary)',
      }}
    >
      <div className="kol-mono-heading-03" style={{ marginBottom: 4 }}>{theme}</div>
      <div className="kol-helper-10" style={{ opacity: 0.5, marginBottom: 16 }}>
        Click a swatch to open. Alt-click resets to defaultValue where one is set.
      </div>

      <Row label="Solid" note="6-digit hex" value={solid} onChange={setSolid} />
      <Row label="With alpha" note="8-digit hex, checkerboard-free swatch" value={alpha} onChange={setAlpha} />
      <Row label="None" note="transparent — red slash" value={none} onChange={setNone} />
      <Row label="currentColor" note="resolves against theme" value={inherit} onChange={setInherit} />
      <Row label="Alt-click reset" note="defaultValue #E74C3C" value={resettable} onChange={setResettable} defaultValue="#E74C3C" />
    </div>
  )
}

export default function ColorPickerPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--kol-surface-primary)' }}>
      <div style={{ padding: '24px 24px 0' }}>
        <div className="kol-mono-heading-03">ColorPicker</div>
        <div className="kol-helper-12" style={{ opacity: 0.6, marginTop: 4, maxWidth: 620 }}>
          16px swatch + portalled react-colorful popover. Both themes side by side.
          The popover flips upward when there is under 260px below the swatch — scroll down
          to the bottom row to check that.
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 16 }}>
        <Board theme="light" />
        <Board theme="dark" />
      </div>

      {/* Space below so the last row's popover has to open upward. */}
      <div style={{ height: '70vh' }} />
    </div>
  )
}
