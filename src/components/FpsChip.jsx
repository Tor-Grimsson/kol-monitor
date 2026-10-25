// FpsChip — the framerate readout `F` toggles on the rack and the stage (plan 16 W6.2, user 2026-10-24: "see how fxr
// shows fps on F"): fxr's chip, bottom-right, kol-component's `useFps` (counts only while shown).
import { useFps } from '@kolkrabbi/kol-component/hooks/canvasViewport'
import { Tooltip } from '@kolkrabbi/kol-component/utilities/Popover'

export default function FpsChip({ show }) {
  const fps = useFps(show)
  if (!show) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <Tooltip label="Framerate — press F to hide">
        <span className="rounded border border-oq-08 bg-surface-secondary px-2 py-1 kol-mono-12 text-emphasis tabular-nums">{fps} fps</span>
      </Tooltip>
    </div>
  )
}
