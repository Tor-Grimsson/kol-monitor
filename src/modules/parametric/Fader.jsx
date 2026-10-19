// Seam over the ONE Slider (kol-component, `variant="panel"`) — what a direct
// `import { Fader } from '@kolkrabbi/kol-controls'` becomes on the kol-hardware 0.4.0
// bump. A touch hold no longer opens the sheet by itself; it reports `onHold`, and
// this seam renders `ParamSheet` for it, so no module changes beyond the import.
import { useState } from 'react'
import { Slider } from '@kolkrabbi/kol-component'
import { ParamSheet } from '@kolkrabbi/kol-hardware'

export default function Fader({ value, onChange, ...props }) {
  const [held, setHeld] = useState(null)
  return (
    <>
      <Slider variant="panel" value={value} onChange={onChange} onHold={setHeld} {...props} />
      {held && <ParamSheet {...held} value={value} onChange={onChange} onClose={() => setHeld(null)} />}
    </>
  )
}
