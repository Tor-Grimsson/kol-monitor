// StageDock — the patch, over the video.
//
// No chrome of its own: the module panels sit straight on the picture. Mounting
// them is what registers them with the render loop, so hiding fades the group
// out rather than unmounting it — unmounting would stop the patch and resize
// every canvas inside.

import { Icon } from '@kolkrabbi/kol-icons'
import { ModuleInitContext } from '../hooks/useModuleEnabled'
import { MODULE_DEFS } from '../modules/registry'
import { hpToPx, ROW_HEIGHT } from '../modules/utility/eurorack'

export default function StageDock({ rows, open, onGrab }) {
  return (
    <div
      className={`relative transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* THE GRIP, top centre. The dock cannot drag from its body: a module is
          jacks and knobs edge to edge, and a free-moving panel means no
          patching (user, 2026-08-28). One explicit handle, the DS glyph. */}
      <div
        onPointerDown={onGrab}
        title="Drag to move"
        className="absolute z-10 flex items-center justify-center cursor-grab rounded bg-oq-16 text-fg-48 hover:text-fg-96"
        style={{ top: 14, left: 'calc(52% + 120px)', transform: 'translateX(-50%)', width: 34, height: 14 }}
      >
        <Icon name="drag-handle" size={12} />
      </div>

      <div className="relative flex gap-0.5 w-max">
        {rows.flatMap(row =>
          [...row.modules].sort((a, b) => a.offset - b.offset).map(mod => {
            const def = MODULE_DEFS[mod.type]
            if (!def) return null
            const Comp = def.component
            return (
              <div
                key={mod.id}
                data-module-id={mod.id}
                className="relative shrink-0 overflow-hidden"
                /* definite px, not aspect-ratio — WebKit sizes a `height: 100%` child of an
                   aspect-ratio box to its content (2026-09-02, same as RackView) */
                style={{ width: hpToPx(mod.hp), height: ROW_HEIGHT[(def.u || 3) === 1 ? '1u' : '3u'] }}
              >
                <ModuleInitContext.Provider value={mod.state}>
                  <Comp id={mod.id} init={mod.state} />
                </ModuleInitContext.Provider>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
