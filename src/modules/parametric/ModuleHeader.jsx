import { Tooltip } from '@kolkrabbi/kol-component'
import { Toggle } from '@kolkrabbi/kol-hardware'

/* MONITOR'S OWN again (plan 14 8.4, 2026-10-17): back from kol-hardware, unchanged — the header is module
 * content. Its controls (the Toggle) stay the KOL's. */
/**
 * ModuleHeader — A module's name and power dot. the enable dot + module name, left-aligned (kol-monitor's rack,
 * lifted 2026-09-01). In edit mode the yellow dot removes the module; otherwise
 * an optional bypass dot. The consumer's case-power context became `powered`:
 * when the case is off the dot shows off whatever `enabled` says.
 *
 * @param {string}   label
 * @param {boolean}  enabled · onToggle
 * @param {boolean}  powered      the case's power (default true)
 * @param {boolean}  editMode · {Function} onRemove
 * @param {boolean}  bypass · {Function} onBypass
 */
export default function ModuleHeader({ label, enabled, onToggle, powered = true, editMode, onRemove, bypass, onBypass }) {
  const isOn = powered && enabled

  return (
    <div onClick={() => onToggle?.()} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '0 2px', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}>
      <Toggle value={isOn} size="sm" onChange={() => {}} padding={0} />
      <span className="kol-helper-10 text-fg-48" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>
        {label}
      </span>
      {editMode && onRemove ? (
        <Tooltip label="Park module" asChild>
        <div
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--kol-ctl-led-yellow)', cursor: 'pointer', flexShrink: 0 }}
        />
        </Tooltip>
      ) : onBypass ? (
        <Tooltip label={bypass ? 'Bypassed — click to re-engage' : 'Bypass'} asChild>
        <div
          onClick={(e) => { e.stopPropagation(); onBypass() }}
          style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--kol-ctl-cv-attenuate)', opacity: bypass ? 0.25 : 1, cursor: 'pointer', flexShrink: 0 }}
        />
        </Tooltip>
      ) : null}
    </div>
  )
}
