// JackSocket — the WIRING seam over @kolkrabbi/kol-controls' presentational jack
// (KolControlsPackage, adopted 2026-09-01). Drag-to-patch, the registry, the
// pending cable and cable visibility are this repo's; they become the package's
// `active · pending · dimPending · cablesHidden · color · onPointerDown` props.
// The local implementation is retired to _tmp/2026-09-01-controls-adoption/.

import { useCallback } from 'react'
import { JackSocket as CtlJackSocket } from '@kolkrabbi/kol-controls'
import { usePatchRouting } from '../../hooks/usePatchRouting.jsx'
import { useModuleRegistry } from '../../hooks/useModuleRegistry.jsx'

// Role colours — HEX, read once (the glow appends a hex alpha). The values are
// kol-theme's kol-components-controls.css.
const _hex = {}
function token(name) {
  if (!_hex[name]) _hex[name] = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return _hex[name]
}

export default function JackSocket({ type = 'out', port, moduleId, signalRef, active = false, size = 'md', label, labelSize = 'xxs', bg }) {
  const routing = usePatchRouting()
  const registry = useModuleRegistry()
  const jackId = `${moduleId}:${type === 'out' ? 'out' : 'in'}:${port}`

  const pending = type === 'out'
    && routing?.pendingOutput?.port === port
    && routing?.pendingOutput?.moduleId === moduleId
  const dimPending = !!routing?.pendingOutput
  const connected = active || (type === 'out' && routing?.connections?.some(c => c.fromModuleId === moduleId && c.fromPort === port))

  // Inputs with no `cv` metadata = primary signal jacks (green); `cv: 'attenuate'`
  // = blue; `cv: 'offset'` (or any other CV value) and outputs = the LED red.
  const cvMode = type === 'in' ? registry?.modulesRef?.current?.get(moduleId)?.inputs?.[port]?.cv : null
  const color = cvMode === 'attenuate'
    ? token('--kol-ctl-cv-attenuate')
    : type === 'in' && cvMode == null
      ? token('--kol-ctl-signal-input')
      : token('--kol-ctl-led-red')

  // Register the RING for hit testing (pointerup finds the nearest input ring
  // centre) — the package hands it over through `ringRef` (kol-controls 0.2.0,
  // ControlsJackSeams); null on unmount unregisters.
  const ringRef = useCallback((el) => routing?.registerJack(jackId, el), [routing, jackId])

  const onPointerDown = useCallback((e) => {
    if (routing?.lockedRef?.current) return
    e.nativeEvent._kolJack = true
    // touch holds the cable between taps (usePatchRouting `sticky`); mouse drags it
    const sticky = e.pointerType === 'touch'
    if (type === 'out') {
      e.preventDefault()
      if (pending) routing?.cancelPending() // tap the held output again = let go
      else routing?.selectOutput(moduleId, port, sticky)
    } else if (type === 'in') {
      // A held cable lands here first; otherwise grab the connected cable at its
      // input end — detach and start a pending drag from the original source.
      // Release on a new input = re-route; on empty space or the same input = disconnect.
      if (routing?.completeInput(moduleId, port)) { e.preventDefault(); return }
      if (active) { e.preventDefault(); routing?.grabInput(moduleId, port, sticky) }
    }
  }, [type, port, moduleId, active, pending, routing])

  return (
    <CtlJackSocket
      type={type} size={size} label={label} labelSize={labelSize} bg={bg}
      active={connected} pending={pending} dimPending={dimPending}
      cablesHidden={routing?.visibilityRef?.current !== 'on'}
      color={color} signalRef={signalRef} onPointerDown={onPointerDown} ringRef={ringRef}
      title={label || port}
    />
  )
}
