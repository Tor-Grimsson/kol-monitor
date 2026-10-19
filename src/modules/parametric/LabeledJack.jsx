// Seam over @kolkrabbi/kol-hardware' LabeledJack (kol-controls 0.2.0, ControlsJackSeams,
// 2026-09-01): this repo's WIRED jack rides in through `jackComponent`, its icon set
// through `iconComponent`. The local layout copy is retired to _tmp/2026-09-01-controls-adoption/.
import { LabeledJack as CtlLabeledJack } from '@kolkrabbi/kol-hardware'
import JackSocket from '../utility/JackSocket'
import { Icon } from '@kolkrabbi/kol-icons'

export default function LabeledJack(props) {
  return <CtlLabeledJack iconComponent={Icon} jackComponent={JackSocket} {...props} />
}
