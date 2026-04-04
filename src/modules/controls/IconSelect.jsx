// IconSelect — reusable icon button grid for mode/type selection
// Pass items array [{value, icon}] and columns count

import Icon from '../../icons/Icon.jsx'

export default function IconSelect({ value, onChange, items, columns = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}>
      {items.map(item => (
        <button
          key={item.value}
          title={item.label || item.value}
          onClick={() => onChange(item.value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: value === item.value ? '#e74c3c' : 'rgba(255,255,255,0.08)',
            backgroundColor: value === item.value ? 'rgba(231,76,60,0.15)' : 'transparent',
            cursor: 'pointer',
            color: value === item.value ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <Icon name={item.icon} size={10} />
        </button>
      ))}
    </div>
  )
}
