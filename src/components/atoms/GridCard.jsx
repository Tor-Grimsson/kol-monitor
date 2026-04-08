/**
 * GridCard — A4-ratio card for grids.
 * Preview area on top (clipped), label + detail at bottom.
 * Supports expanded state (2x2) with detail content.
 * variant="list" renders a compact 36px row.
 */
export default function GridCard({ title, detail, preview, expanded, expandedContent, onClick, variant, action, previewFit = 'natural' }) {
  if (variant === 'list') {
    return (
      <div
        onClick={onClick}
        className="flex items-center justify-between px-3 cursor-pointer bg-surface-tertiary hover:bg-fg-04 rounded border border-fg-04 transition-colors select-none"
        style={{ height: 36 }}
      >
        <span className="kol-helper-xs text-fg-64">{title}</span>
        {action || (detail && <span className="kol-helper-xxs text-fg-32" style={{ textTransform: 'capitalize' }}>{detail}</span>)}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="bg-fg-04 hover:bg-surface-tertiary border border-fg-04"
      style={{
        borderRadius: 4, cursor: 'pointer',
        aspectRatio: expanded ? undefined : '1 / 1.41421',
        gridColumn: expanded ? 'span 2' : 'span 1',
        gridRow: expanded ? 'span 2' : 'span 1',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: expanded ? 'row-reverse' : 'column',
        transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{
        overflow: 'hidden',
        position: 'relative',
        flex: expanded ? '0 0 50%' : 1,
        minHeight: 0,
        minWidth: 0,
      }}>
        <div className={`gridcard-preview gridcard-preview--${previewFit}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {preview}
        </div>
      </div>

      {expanded ? (
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'auto' }}>
          {expandedContent}
        </div>
      ) : (
        <div className="bg-surface-primary" style={{ padding: '12px 16px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-fg-96 kol-helper-s" style={{ marginBottom: 4 }}>{title}</div>
          {detail && <div className="text-fg-32 kol-helper-xxxs">{detail}</div>}
        </div>
      )}
    </div>
  )
}
