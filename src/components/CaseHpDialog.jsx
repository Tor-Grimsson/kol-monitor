import { useState } from 'react'
import Input from '@kolkrabbi/kol-component/atoms/Input'
import Button from './atoms/Button'

/* the case width — the rack's own (`rack.caseHp`, plan 14 3.1): typed as a number, committed on blur / Enter,
   never narrower than the modules already mounted (the rack clamps). Was a 40–200 slider wired to nothing. */
export default function CaseHpDialog({ caseHp, onSetHp }) {
  const [showSlider, setShowSlider] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, width: '100%' }}>
      <Button size="md" onClick={() => setShowSlider(v => !v)}>[Width]</Button>
      {showSlider && (
        <Input
          size="md"
          chars={3}
          suffix="HP"
          inputMode="numeric"
          inputClassName="text-right"
          value={String(caseHp)}
          onCommit={(v) => onSetHp(v)}
          aria-label="Case width"
        />
      )}
      <span className="kol-helper-16 text-fg-80">[{caseHp}HP]</span>
    </div>
  )
}
