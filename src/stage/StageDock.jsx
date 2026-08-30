// StageDock — the patch, over the video.
//
// No chrome of its own: the module panels sit straight on the picture. Mounting
// them is what registers them with the render loop, so hiding fades the group
// out rather than unmounting it — unmounting would stop the patch and resize
// every canvas inside.

import { useRef } from 'react'
import { Icon } from '@kolkrabbi/kol-icons'
import { ModuleInitContext } from '../hooks/useModuleEnabled'
import { MODULE_DEFS } from '../modules/registry'
import { TOTAL_HP, hpToPx } from '../modules/utility/eurorack'
import PatchCableOverlay from '../modules/utility/PatchCableOverlay.jsx'

export default function StageDock({ rows, open, onGrab }) {
  // The cable overlay measures jack centres against this node.
  const containerRef = useRef(null)

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

      <div ref={containerRef} className="relative flex gap-0.5 w-max">
        <PatchCableOverlay containerRef={containerRef} />
        {rows.flatMap(row =>
          [...row.modules].sort((a, b) => a.offset - b.offset).map(mod => {
            const def = MODULE_DEFS[mod.type]
            if (!def) return null
            const Comp = def.component
            const aspectDiv = (def.u || 3) === 1 ? 12 : 4
            return (
              <div
                key={mod.id}
                data-module-id={mod.id}
                className="relative shrink-0 overflow-hidden"
                style={{ width: hpToPx(mod.hp), aspectRatio: `${mod.hp * aspectDiv} / ${TOTAL_HP}` }}
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
