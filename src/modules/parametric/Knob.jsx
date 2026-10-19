// Seam over the ONE Knob (kol-component, `variant="panel"`) — what monitor's
// `parametric/Knob.jsx` becomes on the kol-hardware 0.4.0 bump. Two things moved:
// the label placement is `labelPlacement` (was `variant`), and a touch hold no
// longer opens the sheet by itself — it reports `onHold`, and this seam renders
// `ParamSheet` for it, so no module changes.
import { useState } from 'react'
import { Knob as KolKnob } from '@kolkrabbi/kol-component'
import { ParamSheet } from '@kolkrabbi/kol-hardware'

export default function Knob({ variant, size = 'sm', value, onChange, ...props }) {
  const [held, setHeld] = useState(null)
  return (
    <>
      <KolKnob variant="panel" labelPlacement={variant} size={size} value={value} onChange={onChange} onHold={setHeld} {...props} />
      {held && <ParamSheet {...held} value={value} onChange={onChange} onClose={() => setHeld(null)} />}
    </>
  )
}
