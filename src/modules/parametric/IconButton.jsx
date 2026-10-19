// Seam over @kolkrabbi/kol-hardware (KolControlsPackage, adopted 2026-09-01) —
// the local implementation is retired to _tmp/2026-09-01-controls-adoption/.
// Monitor's own icon set rides in through the package's `iconComponent` seam.
import { IconButton as CtlIconButton } from '@kolkrabbi/kol-hardware'
import { Icon } from '@kolkrabbi/kol-icons'

export default function IconButton(props) {
  return <CtlIconButton iconComponent={Icon} {...props} />
}
