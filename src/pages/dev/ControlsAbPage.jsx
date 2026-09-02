// /dev/controls-ab — the four control pairs on a module panel (KolControlsPackage
// remainder, 2026-09-01). After ControlsXsRung three of them ARE the DS at `xs`; the
// A column names what the rack used (kol-controls 0.2.0, retired in 0.3.0), the B
// column is the live control. IconButton keeps both sides — it stayed in kol-controls.
// Dev page: outside AppLayout, no rail. Shot by scripts in _tmp/ for the A/B artifact.

import { useState } from 'react'
import { IconButton } from '@kolkrabbi/kol-controls'
import Input from '@kolkrabbi/kol-component/atoms/Input'
import Dropdown from '@kolkrabbi/kol-component/molecules/Dropdown'
import Stepper from '@kolkrabbi/kol-component/molecules/Stepper'
import Button from '../../components/atoms/Button'
import Icon from '../../icons/Icon'

const WAVES = ['sine', 'tri', 'saw', 'pulse']

function Row({ id, title, note, a, b }) {
  return (
    <div data-ab={id} className="bg-surface-secondary" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 16, alignItems: 'center', padding: '14px 16px', borderRadius: 2 }}>
      <div>
        <div className="kol-helper-10 text-fg-64" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div className="kol-helper-8 text-fg-32" style={{ marginTop: 4 }}>{note}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <span className="kol-helper-8 text-fg-32" style={{ textTransform: 'uppercase' }}>A · kol-controls</span>
        {a}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <span className="kol-helper-8 text-fg-32" style={{ textTransform: 'uppercase' }}>B · kol-component</span>
        {b}
      </div>
    </div>
  )
}

const Retired = ({ name }) => <span className="kol-helper-8 text-fg-32">{name} — retired in kol-controls 0.3.0</span>

export default function ControlsAbPage() {
  const [text, setText] = useState('render')
  const [wave, setWave] = useState('tri')
  const [active, setActive] = useState(true)
  const [sel, setSel] = useState('tri')

  return (
    <div className="bg-surface-primary text-auto" style={{ minHeight: '100vh', padding: 32 }}>
      <div className="kol-helper-12 text-fg-48" style={{ marginBottom: 16 }}>controls A/B · /dev/controls-ab · after ControlsXsRung — B is the DS at xs</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 640 }}>
        <Row id="text" title="Text input" note="Input xs outline, commit on blur / Enter"
          a={<Retired name="TextInput" />}
          b={<Input size="xs" variant="outline" value={text} onCommit={setText} placeholder="name" width="120px" />}
        />
        <Row id="dropdown" title="Dropdown" note="Dropdown xs grey"
          a={<Retired name="PanelDropdown" />}
          b={<Dropdown size="xs" variant="grey" value={wave} options={WAVES.map((w) => ({ value: w, label: w }))} onChange={setWave} />}
        />
        <Row id="iconbutton" title="Icon button" note="kept in kol-controls — lit state, momentary"
          a={<div style={{ display: 'flex', gap: 6 }}><IconButton icon="tr-inf" active={active} onClick={() => setActive((v) => !v)} title="toggle" /><IconButton icon="tr-skip" momentary onClick={() => {}} title="momentary" /></div>}
          b={<div style={{ display: 'flex', gap: 6 }}><Button variant="grey" size="xs" iconOnly="tr-inf" aria-label="toggle" aria-pressed={active} onClick={() => setActive((v) => !v)} /><Button variant="grey" size="xs" iconOnly="tr-skip" aria-label="momentary" /></div>}
        />
        <Row id="selector" title="Selector" note="Stepper xs with options — the list variant"
          a={<Retired name="Selector" />}
          b={<Stepper size="xs" layout="inline" className="uppercase" options={WAVES} value={sel} onChange={(e) => setSel(e.target.value)} />}
        />
      </div>
      <div className="kol-helper-8 text-fg-32" style={{ marginTop: 16 }}>
        <Icon name="tr-inf" size={8} /> icons are this repo's set on both sides
      </div>
    </div>
  )
}
