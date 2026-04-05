// IconButton — icon-only toggle button
// Use with LabeledControl for text labels

import Icon from '../../icons/Icon.jsx'

export default function IconButton({ icon, active, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: active ? '#e74c3c' : 'rgba(255,255,255,0.08)',
        backgroundColor: active ? 'rgba(231,76,60,0.15)' : 'transparent',
        cursor: 'pointer',
        color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
      }}
    >
      <Icon name={icon} size={10} />
    </button>
  )
}
