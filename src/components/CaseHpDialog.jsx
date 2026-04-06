import { useState } from 'react'
import Slider from './atoms/Slider'

export default function CaseHpDialog({ caseHp, onSetHp }) {
  const [showSlider, setShowSlider] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, width: '100%' }}>
      <span onClick={() => setShowSlider(v => !v)} className="kol-helper-md text-fg-80 hover:text-fg-96 cursor-pointer select-none">[Width]</span>
      {showSlider && (
        <div style={{ width: 400 }}>
          <Slider
            min={40}
            max={200}
            step={2}
            value={caseHp}
            onChange={onSetHp}
            variant="minimal"
            formatValue={() => null}
            className="w-full"
          />
        </div>
      )}
      <span className="kol-helper-md text-fg-80">[{caseHp}HP]</span>
    </div>
  )
}
