// Seam over @kolkrabbi/kol-controls (KolControlsPackage, adopted 2026-09-01) —
// the local implementation is retired to _tmp/2026-09-01-controls-adoption/.
// The case's power context became the package's `powered` prop.
import { ModuleHeader as CtlModuleHeader } from '@kolkrabbi/kol-controls'
import { useCasePower } from '../../hooks/useCasePower.jsx'

export default function ModuleHeader(props) {
  const { power } = useCasePower()
  return <CtlModuleHeader powered={power} {...props} />
}
