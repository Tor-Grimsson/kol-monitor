const TAG_COLORS = {
  rhythmic: '#e74c3c',
  generative: '#3498db',
  feedback: '#e67e22',
  geometric: '#2ecc71',
  modulation: '#9b59b6',
  color: '#f1c40f',
  ambient: '#1abc9c',
  sequenced: '#e84393',
  noise: '#636e72',
  minimal: '#dfe6e9',
  analog: '#f1c40f',
}

export default function PatchCard({ title, detail, tag, onClick }) {
  const tagColor = tag ? (TAG_COLORS[tag] || 'rgba(255,255,255,0.3)') : null
  return (
    <div
      onClick={onClick}
      className="bg-surface-secondary hover:bg-surface-tertiary"
      style={{ padding: 16, borderRadius: 4, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', minHeight: 64, position: 'relative' }}
    >
      {tagColor && <div style={{ position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: '50%', backgroundColor: tagColor }} />}
      <div className="text-fg-96 kol-helper-14" style={{ marginBottom: 8 }}>{title}</div>
      {detail && <div className="text-fg-32 kol-helper-8">{detail}</div>}
    </div>
  )
}
