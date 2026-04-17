// IconSelect — reusable icon button grid for mode/type selection
// Pass items array [{value, icon}] and columns count

import IconButton from './IconButton'

export default function IconSelect({ value, onChange, items, columns = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}>
      {items.map(item => (
        <IconButton
          key={item.value}
          icon={item.icon}
          title={item.label || item.value}
          active={value === item.value}
          onClick={() => onChange(item.value)}
        />
      ))}
    </div>
  )
}
