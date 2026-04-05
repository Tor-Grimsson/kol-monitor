// LED — indicator light with optional click
// Sizes: sm (6px), md (8px). Colors: red, yellow, green, white, blue.
// When onClick is provided, renders an invisible hit area overlay.

const COLORS = {
  red: '#e74c3c',
  yellow: '#f1c40f',
  green: '#2ecc71',
  white: '#e5e5e5',
  blue: '#3b82f6',
}

const SIZES = { sm: 6, md: 8 }
const HIT_PAD = 5

export default function LED({ active = false, color = 'red', size = 'sm', onClick }) {
  const s = SIZES[size] || size
  const c = COLORS[color] || color
  return (
    <div style={{ width: s, height: s, flexShrink: 0, position: 'relative' }}>
      <div style={{
        width: s,
        height: s,
        borderRadius: '50%',
        backgroundColor: active ? c : 'rgba(180,175,165,0.15)',
        boxShadow: active ? `0 0 4px ${c}66` : 'none',
        transition: 'background-color 0.1s, box-shadow 0.1s',
      }} />
      {onClick && (
        <div
          onClick={onClick}
          style={{
            position: 'absolute',
            top: -HIT_PAD,
            left: -HIT_PAD,
            width: s + HIT_PAD * 2,
            height: s + HIT_PAD * 2,
            cursor: 'pointer',
          }}
        />
      )}
    </div>
  )
}
