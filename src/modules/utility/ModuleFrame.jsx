import ModuleHeader from '../parametric/ModuleHeader.jsx'

/* MONITOR'S OWN again (plan 14 8.4, 2026-10-17): back from kol-hardware, unchanged. */
/**
 * ModuleFrame — The front panel of a module. the front panel a module is built in: the header pinned at the top, the body
 * below it (frames group, 2026-09-27). Lifted from kol-monitor's `modules/utility/Module.jsx`,
 * where every rack module sits in it; kol-mirror's modules and the controls reference compose
 * the same shape. Presentational — the rack's edit context, power and routing stay in the
 * consumer and arrive as props.
 *
 * @param {string}   label        module name — omit for a headerless frame
 * @param {boolean}  enabled · onToggle   the header's power toggle
 * @param {boolean}  powered      the case's power (default true)
 * @param {boolean}  editMode · onRemove  edit-mode remove dot
 * @param {boolean}  bypass · onBypass    bypass dot
 * @param {number}   u            rack height in U — a 1U module tightens its padding
 * @param {string}   className    the plate (default bg-surface-secondary)
 */
const PAD = 12

export default function ModuleFrame({
  label, enabled, onToggle, powered = true, editMode, onRemove, bypass, onBypass,
  u = 3, className = 'bg-surface-secondary', style, children,
}) {
  return (
    <div
      /* `kol-hw-panel`: the plate keeps its desk control sizes on touch (kol-components-controls.css) */
      className={`kol-hw-panel ${className}`}
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        padding: `${PAD}px 0 ${u === 1 ? 8 : PAD}px`, userSelect: 'none', ...style,
      }}
    >
      {label && (
        <div style={{ flexShrink: 0, padding: `0 4px ${u === 1 ? 8 : 16}px` }}>
          <ModuleHeader label={label} enabled={enabled} onToggle={onToggle} powered={powered}
            editMode={editMode} onRemove={onRemove} bypass={bypass} onBypass={onBypass} />
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 4px', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
