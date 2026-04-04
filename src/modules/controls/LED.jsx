// LED — small indicator light
// Colors: red, yellow, green, white, blue. Responds to active state.

const COLORS = {
  red: '#e74c3c',
  yellow: '#f1c40f',
  green: '#2ecc71',
  white: '#e5e5e5',
  blue: '#3b82f6',
}

export default function LED({ active = false, color = 'red', size = 5 }) {
  const c = COLORS[color] || color
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: active ? c : 'rgba(180,175,165,0.15)',
      boxShadow: active ? `0 0 4px ${c}66` : 'none',
      transition: 'background-color 0.1s, box-shadow 0.1s',
      flexShrink: 0,
    }} />
  )
}
