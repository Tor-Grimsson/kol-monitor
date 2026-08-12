// Subpath import — the barrel export pulls every organism into the bundle
// (+5.5MB). Upstream ships deep exports since kol-component@0.35.0.
import DSButton from '@kolkrabbi/kol-component/atoms/Button'
import Icon from '../../icons/Icon'

/**
 * Button — thin seam over the DS Button (@kolkrabbi/kol-component): monitor's
 * own icon set via the `iconComponent` seam. Text casing is authored at the
 * call site (no auto text-transform). See the DS Button for the full API.
 */
export default function Button({ iconSize = 16, ...props }) {
  return <DSButton iconComponent={Icon} iconSize={iconSize} {...props} />
}
