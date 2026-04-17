// CvKnob — jack input + knob pair
// Combines a CV input jack with a rotary knob in a flex row

import LabeledJack from './LabeledJack'
import Knob from './Knob'

export default function CvKnob({ port, moduleId, active, signalRef, value, onChange, label, min, max, bipolar, variant, labelMinWidth, jackSize = 'sm', direction = 'horizontal', defaultValue }) {
  const vertical = direction === 'vertical'
  return (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: 4 }}>
      <LabeledJack type="in" port={port} moduleId={moduleId} active={active} signalRef={signalRef} size={jackSize} />
      <Knob value={value} onChange={onChange} label={label} min={min} max={max} bipolar={bipolar} variant={variant} labelMinWidth={labelMinWidth} defaultValue={defaultValue} />
    </div>
  )
}
