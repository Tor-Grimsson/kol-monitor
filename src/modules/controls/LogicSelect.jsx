// LogicSelect — 2x3 icon button grid for logic mode selection

import Icon from '../../icons/Icon.jsx'

const MODES = ['and', 'or', 'xor', 'not', 'nand', 'nor']

export default function LogicSelect({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {MODES.map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: value === m ? '#e74c3c' : 'rgba(255,255,255,0.08)',
            backgroundColor: value === m ? 'rgba(231,76,60,0.15)' : 'transparent',
            cursor: 'pointer',
            color: value === m ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <Icon name={`logic-${m}`} size={10} />
        </button>
      ))}
    </div>
  )
}
