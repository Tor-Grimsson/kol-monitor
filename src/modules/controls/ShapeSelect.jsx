// ShapeSelect — 2x2 icon button grid for 3D shape selection

import Icon from '../../icons/Icon.jsx'

const SHAPES = ['cube', 'tetra', 'octa', 'sphere']

export default function ShapeSelect({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {SHAPES.map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: value === s ? '#e74c3c' : 'rgba(255,255,255,0.08)',
            backgroundColor: value === s ? 'rgba(231,76,60,0.15)' : 'transparent',
            cursor: 'pointer',
            color: value === s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <Icon name={`shape-${s}`} size={10} />
        </button>
      ))}
    </div>
  )
}
