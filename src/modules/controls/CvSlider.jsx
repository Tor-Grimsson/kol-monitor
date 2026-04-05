// CvSlider — jack input + horizontal slider pair
// Combines a CV input jack with a slider in a flex row

import LabeledJack from './LabeledJack'
import Slider from './Slider'

export default function CvSlider({ port, moduleId, active, signalRef, value, onChange, label, min = 0, max = 100, step = 1, jackSize = 'sm' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      <LabeledJack type="in" port={port} moduleId={moduleId} active={active} signalRef={signalRef} size={jackSize} />
      <Slider label={label} min={min} max={max} step={step} value={value} onChange={onChange} />
    </div>
  )
}
