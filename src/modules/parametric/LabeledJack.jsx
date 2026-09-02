// Seam over @kolkrabbi/kol-controls' LabeledJack (kol-controls 0.2.0, ControlsJackSeams,
// 2026-09-01): this repo's WIRED jack rides in through `jackComponent`, its icon set
// through `iconComponent`. The local layout copy is retired to _tmp/2026-09-01-controls-adoption/.
import { LabeledJack as CtlLabeledJack } from '@kolkrabbi/kol-controls'
import JackSocket from '../utility/JackSocket'
import Icon from '../../icons/Icon'

export default function LabeledJack(props) {
  return <CtlLabeledJack iconComponent={Icon} jackComponent={JackSocket} {...props} />
}
