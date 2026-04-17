// LabeledJack — JackSocket with 8px label below
// Use instead of passing label prop directly to JackSocket

import JackSocket from '../utility/JackSocket'
import Icon from '../../icons/Icon'

export default function LabeledJack({ label, icon, iconSize = 8, labelPosition = 'bottom', dim = false, ...jackProps }) {
  const labelEl = icon
    ? <Icon name={icon} size={iconSize} style={{ opacity: 0.35 }} />
    : label && (
      <span className="kol-helper-xxxs" style={{
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        {label}
      </span>
    )
  const isRow = labelPosition === 'left' || labelPosition === 'right'
  return (
    <div style={{ display: 'flex', flexDirection: isRow ? 'row' : 'column', alignItems: 'center', gap: 2, opacity: dim ? 0.3 : 1 }}>
      {(labelPosition === 'top' || labelPosition === 'left') && labelEl}
      <JackSocket {...jackProps} />
      {(labelPosition === 'bottom' || labelPosition === 'right') && labelEl}
    </div>
  )
}
